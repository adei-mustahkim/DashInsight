/* eslint-disable */
// @ts-nocheck

import { BASKET_SIZE_THRESHOLDS, BASKET_SIZE_LABELS, EXCEL_EPOCH_OFFSET, EXCEL_DATE_THRESHOLD } from '../lib/constants';

export const parseTransactionDate = (value) => {
    if (!value) return null;
    if (!isNaN(value) && Number(value) > EXCEL_DATE_THRESHOLD) {
        const date = new Date(Math.round((Number(value) - EXCEL_EPOCH_OFFSET) * 86400 * 1000));
        return isNaN(date.getTime()) ? null : date;
    }
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
};

export const toCleanLabel = (value, fallback = 'Tidak Diketahui') => {
    const label = String(value ?? '').trim();
    return label || fallback;
};

export const getCalculatedMetrics = (row, settings = {}) => {
    const rawSales = Number(row.sales_amount) || 0;
    const rawRetur = Number(row.return_amount) || 0;
    const rawDiscount = Number(row.discount_amount) || 0;
    const rawCogs = Number(row.cogs) || 0;
    const rawTax = Number(row.tax) || 0;
    const rawComm = Number(row.staff_commission) || 0;
    const rawPlat = Number(row.platform_fee) || 0;

    let netRev = rawSales;
    if (settings.netRevenueFormula === 'net_of_returns') netRev = rawSales - rawRetur;
    if (settings.netRevenueFormula === 'net_of_discounts_returns') netRev = rawSales - rawRetur - rawDiscount;

    let profit = 0;
    if (settings.profitFormula === 'auto') {
        profit = Number(row.gross_profit) || (rawSales > 0 && rawCogs > 0 ? rawSales - rawCogs : 0);
    } else if (settings.profitFormula === 'gross_profit') {
        profit = netRev - rawCogs;
    } else if (settings.profitFormula === 'operating_profit') {
        profit = netRev - rawCogs - rawTax - rawComm - rawPlat;
    }

    return { netRev, profit, rawSales };
};

export const groupSum = (rows, key, fallback = 'Tidak Diketahui', settings = {}) => {
    const map = {};
    rows.forEach(row => {
        const name = toCleanLabel(row[key], fallback);
        const { netRev, profit } = getCalculatedMetrics(row, settings);
        const qty = Number(row.quantity) || 1;

        map[name] = map[name] || { name, sales: 0, quantity: 0, qty: 0, transactions: 0, profit: 0 };
        map[name].sales += netRev;
        map[name].quantity += qty;
        map[name].qty += qty;
        map[name].transactions += 1;
        map[name].profit += profit;
    });
    return Object.values(map).sort((a, b) => settings.metricView === 'quantity' ? b.qty - a.qty : b.sales - a.sales);
};

export const profileDataHealth = (rows, dimensions) => {
    const totalRows = rows.length;
    const issues = [];
    const missing = (key) => rows.filter(row => String(row[key] ?? '').trim() === '').length;
    const invalidDates = dimensions.date ? rows.filter(row => row.transaction_date && !parseTransactionDate(row.transaction_date)).length : 0;
    const invalidSales = rows.filter(row => Number(row.sales_amount) <= 0 || Number.isNaN(Number(row.sales_amount))).length;
    const duplicateTransactions = (() => {
        const ids = rows.map(row => row.transaction_id).filter(Boolean);
        return ids.length - new Set(ids).size;
    })();

    if (!dimensions.date) issues.push({ level: 'warning', text: 'Kolom tanggal belum tersedia, analisis tren waktu terbatas.' });
    if (!dimensions.product) issues.push({ level: 'warning', text: 'Kolom produk belum tersedia, analisis produk tidak bisa dibuat.' });
    if (invalidSales > 0) issues.push({ level: 'critical', text: `${invalidSales} baris memiliki nilai penjualan kosong atau tidak valid.` });
    if (invalidDates > 0) issues.push({ level: 'warning', text: `${invalidDates} baris memiliki tanggal tidak valid.` });
    if (duplicateTransactions > 0) issues.push({ level: 'info', text: `${duplicateTransactions} nomor transaksi terduplikasi. Ini normal jika data per item, tetapi perlu dicek bila data per order.` });
    if (missing('category') > totalRows * 0.25 && dimensions.category) issues.push({ level: 'warning', text: 'Lebih dari 25% baris tidak memiliki kategori produk.' });
    if (missing('sales_channel') > totalRows * 0.25 && dimensions.channel) issues.push({ level: 'info', text: 'Banyak baris belum memiliki channel penjualan.' });

    let score = 100;
    score -= Math.min(35, (invalidSales / Math.max(totalRows, 1)) * 60);
    score -= Math.min(20, (invalidDates / Math.max(totalRows, 1)) * 40);
    score -= !dimensions.date ? 12 : 0;
    score -= !dimensions.product ? 12 : 0;
    score -= duplicateTransactions > 0 ? 4 : 0;
    score = Math.max(0, Math.round(score));

    return {
        score,
        label: score >= 85 ? 'Baik' : score >= 65 ? 'Perlu Dicek' : 'Bermasalah',
        issues,
        stats: { totalRows, invalidSales, invalidDates, duplicateTransactions }
    };
};

export const computePareto = (items) => {
    const total = items.reduce((sum, item) => sum + (Number(item.sales) || 0), 0);
    let cumulative = 0;
    let countFor80 = 0;
    const enriched = items.map((item, index) => {
        cumulative += Number(item.sales) || 0;
        if (total > 0 && cumulative / total <= 0.8) countFor80 = index + 1;
        return {
            ...item,
            share: total ? (item.sales / total) * 100 : 0,
            cumulativeShare: total ? (cumulative / total) * 100 : 0,
        };
    });
    if (total > 0 && countFor80 < enriched.length) countFor80 += 1;
    return {
        total,
        countFor80,
        top20Count: Math.max(1, Math.ceil(items.length * 0.2)),
        top20Share: total ? (items.slice(0, Math.max(1, Math.ceil(items.length * 0.2))).reduce((sum, item) => sum + item.sales, 0) / total) * 100 : 0,
        items: enriched,
    };
};

export const computeDashboardAnalytics = (processedData, filters = {}, settings = {}) => {
    if (!processedData || processedData.length === 0) return null;

    const {
        dateFilter = 'all',
        trendGranularity = 'daily',
        categoryFilter = 'all',
        channelFilter = 'all',
        branchFilter = 'all',
        paymentFilter = 'all',
    } = filters;

    const uniqueOptions = (key) => [...new Set(processedData.map(row => toCleanLabel(row[key], '')).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'id'));

    const hasValue = (key) => processedData.some(row => String(row[key] ?? '').trim() !== '');

    const dimensions = {
        date: hasValue('transaction_date'),
        product: hasValue('product_name'),
        category: hasValue('category'),
        channel: hasValue('sales_channel'),
        branch: hasValue('branch'),
        customer: hasValue('customer_name') || hasValue('customer_id'),
        paymentMethod: hasValue('payment_method'),
        city: hasValue('destination_city'),
        paymentStatus: hasValue('payment_status'),
        staff: hasValue('staff_name'),
        discount: hasValue('discount_amount'),
        shipping: hasValue('shipping_fee'),
        cogs: hasValue('cogs'),
        profit: hasValue('gross_profit'),
        rating: hasValue('rating'),
        duration: hasValue('duration_mins'),
        commission: hasValue('staff_commission'),
        time: hasValue('transaction_time'),
        brand: hasValue('brand'),
        supplier: hasValue('supplier'),
        returns: hasValue('return_amount'),
        tax: hasValue('tax'),
        serviceCharge: hasValue('service_charge'),
        platformFee: hasValue('platform_fee'),
        promoCode: hasValue('promo_code'),
        customerType: hasValue('customer_type'),
        variant: hasValue('variant'),
        expenseAmount: hasValue('expense_amount'),
        orderType: hasValue('order_type'),
        paymentProvider: hasValue('payment_provider'),
        shippingCourier: hasValue('shipping_courier'),
        tableNumber: hasValue('table_number'),
    };

    const filterOptions = {
        categories: dimensions.category ? uniqueOptions('category') : [],
        channels: dimensions.channel ? uniqueOptions('sales_channel') : [],
        branches: dimensions.branch ? uniqueOptions('branch') : [],
        payments: dimensions.paymentMethod ? uniqueOptions('payment_method') : [],
    };

    const allDates = processedData
        .map(row => parseTransactionDate(row.transaction_date))
        .filter(Boolean)
        .sort((a, b) => a - b);
    const now = allDates.length ? allDates[allDates.length - 1] : new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const filteredData = processedData.filter(row => {
        if (categoryFilter !== 'all' && toCleanLabel(row.category, '') !== categoryFilter) return false;
        if (channelFilter !== 'all' && toCleanLabel(row.sales_channel, '') !== channelFilter) return false;
        if (branchFilter !== 'all' && toCleanLabel(row.branch, '') !== branchFilter) return false;
        if (paymentFilter !== 'all' && toCleanLabel(row.payment_method, '') !== paymentFilter) return false;

        if (dateFilter === 'all' || !dimensions.date) return true;
        const rowDate = parseTransactionDate(row.transaction_date);
        if (!rowDate) return true;

        if (dateFilter === '7days') {
            const diffDays = (now - rowDate) / (1000 * 60 * 60 * 24);
            return diffDays >= 0 && diffDays <= 7;
        }
        if (dateFilter === '30days') {
            const diffDays = (now - rowDate) / (1000 * 60 * 60 * 24);
            return diffDays >= 0 && diffDays <= 30;
        }
        if (dateFilter === 'mtd' || dateFilter === 'mom' || dateFilter === 'yoy') return rowDate.getFullYear() === currentYear && rowDate.getMonth() === currentMonth;
        if (dateFilter === 'ytd') return rowDate.getFullYear() === currentYear;
        return true;
    });

    const salesRows = filteredData.filter(row => Number(row.sales_amount) > 0);

    // Base raw totals
    const totalOmzet = filteredData.reduce((sum, row) => sum + (Number(row.sales_amount) || 0), 0);
    const totalDiskon = filteredData.reduce((sum, row) => sum + (Number(row.discount_amount) || 0), 0);
    const totalOngkir = filteredData.reduce((sum, row) => sum + (Number(row.shipping_fee) || 0), 0);
    const totalCogs = filteredData.reduce((sum, row) => sum + (Number(row.cogs) || 0), 0);
    const totalRetur = dimensions.returns ? filteredData.reduce((sum, row) => sum + (Number(row.return_amount) || 0), 0) : 0;

    // Advanced totals
    const totalCommission = dimensions.commission ? filteredData.reduce((sum, row) => sum + (Number(row.staff_commission) || 0), 0) : 0;
    const totalTax = dimensions.tax ? filteredData.reduce((sum, row) => sum + (Number(row.tax) || 0), 0) : 0;
    const totalServiceCharge = dimensions.serviceCharge ? filteredData.reduce((sum, row) => sum + (Number(row.service_charge) || 0), 0) : 0;
    const totalPlatformFee = dimensions.platformFee ? filteredData.reduce((sum, row) => sum + (Number(row.platform_fee) || 0), 0) : 0;

    // Computed metrics based on settings
    let netRevenue = totalOmzet;
    if (settings.netRevenueFormula === 'net_of_returns') netRevenue = totalOmzet - totalRetur;
    if (settings.netRevenueFormula === 'net_of_discounts_returns') netRevenue = totalOmzet - totalRetur - totalDiskon;

    let totalProfit = 0;
    if (settings.profitFormula === 'auto') {
        if (dimensions.profit) {
            totalProfit = filteredData.reduce((sum, row) => sum + (Number(row.gross_profit) || 0), 0);
        } else if (dimensions.cogs) {
            totalProfit = totalOmzet - totalCogs;
        }
    } else if (settings.profitFormula === 'gross_profit') {
        totalProfit = netRevenue - totalCogs;
    } else if (settings.profitFormula === 'operating_profit') {
        totalProfit = netRevenue - totalCogs - totalTax - totalCommission - totalPlatformFee;
    }

    const profitMargin = netRevenue > 0 ? (totalProfit / netRevenue) * 100 : 0;

    const ratingData = dimensions.rating ? filteredData.map(r => Number(r.rating)).filter(n => n > 0 && n <= 5) : [];
    const avgRating = ratingData.length ? ratingData.reduce((a, b) => a + b, 0) / ratingData.length : 0;

    const produkTerjual = filteredData.reduce((sum, row) => sum + (Number(row.quantity) || 1), 0);
    const uniqueTransactions = new Set(filteredData.map(row => row.transaction_id).filter(Boolean));
    const uniqueCustomers = new Set(filteredData.map(row => row.customer_id || row.customer_name).filter(Boolean));
    const totalTransaksi = uniqueTransactions.size > 0 ? uniqueTransactions.size : filteredData.length;

    let avgTransaksi = 0;
    if (settings.aovFormula === 'gross') {
        avgTransaksi = totalTransaksi > 0 ? totalOmzet / totalTransaksi : 0;
    } else {
        avgTransaksi = totalTransaksi > 0 ? netRevenue / totalTransaksi : 0;
    }

    const avgItems = totalTransaksi > 0 ? produkTerjual / totalTransaksi : 0;

    const validDates = filteredData
        .map(row => parseTransactionDate(row.transaction_date))
        .filter(Boolean)
        .sort((a, b) => a - b);
    const dateRange = validDates.length ? {
        start: validDates[0].toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
        end: validDates[validDates.length - 1].toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    } : null;

    const formatWeek = (date) => {
        const d = new Date(date);
        const day = d.getDay() || 7;
        d.setDate(d.getDate() - day + 1);
        return d.toISOString().split('T')[0];
    };
    const formatMonth = (date) => date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
    const trendSalesMap = {};
    const weekdayMap = {};
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    const predictLinearRegression = (points: number[], periods: number) => {
        const n = points.length;
        if (n === 0) return Array(periods).fill(0);
        if (n === 1) return Array(periods).fill(points[0]);
        
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += points[i];
            sumXY += i * points[i];
            sumXX += i * i;
        }
        
        const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
        const c = (sumY - m * sumX) / n;
        
        const predictions = [];
        for (let i = 0; i < periods; i++) {
            const val = m * (n + i) + c;
            predictions.push(Math.max(0, val));
        }
        return predictions;
    };

    filteredData.forEach(row => {
        const { netRev } = getCalculatedMetrics(row, settings);
        const date = parseTransactionDate(row.transaction_date);
        const qty = Number(row.quantity) || 1;
        const val = settings.metricView === 'quantity' ? qty : netRev;
        let dateKey = 'Tanpa Tanggal';
        let sortKey = 0;
        if (date) {
            dateKey = trendGranularity === 'monthly' ? formatMonth(date) : trendGranularity === 'weekly' ? formatWeek(date) : date.toISOString().split('T')[0];
            sortKey = trendGranularity === 'monthly' ? new Date(date.getFullYear(), date.getMonth(), 1).getTime() : new Date(dateKey).getTime();
            const weekday = dayNames[date.getDay()];
            weekdayMap[weekday] = weekdayMap[weekday] || { name: weekday, sales: 0, transactions: 0, sort: date.getDay() };
            weekdayMap[weekday].sales += val;
            weekdayMap[weekday].transactions += 1;
        }
        trendSalesMap[dateKey] = trendSalesMap[dateKey] || { date: dateKey, sales: 0, transactions: 0, sort: sortKey };
        trendSalesMap[dateKey].sales += val;
        trendSalesMap[dateKey].transactions += 1;
    });

    const trendSales = Object.values(trendSalesMap).sort((a, b) => a.sort - b.sort);

    if (trendSales.length >= 2) {
        const fitCount = Math.min(7, trendSales.length);
        const pointsForFit = trendSales.slice(-fitCount);
        const salesPoints = pointsForFit.map(d => d.sales);
        const txPoints = pointsForFit.map(d => d.transactions);
        
        const periods = trendGranularity === 'monthly' ? 3 : trendGranularity === 'weekly' ? 4 : 7;
        const predictedSales = predictLinearRegression(salesPoints, periods);
        const predictedTx = predictLinearRegression(txPoints, periods);
        
        const lastIndex = trendSales.length - 1;
        trendSales[lastIndex].forecastSales = trendSales[lastIndex].sales;
        trendSales[lastIndex].forecastTransactions = trendSales[lastIndex].transactions;
        trendSales[lastIndex].isForecastStart = true;
        
        let lastDate = new Date(trendSales[lastIndex].sort);
        for (let i = 0; i < periods; i++) {
            let nextDate = new Date(lastDate);
            if (trendGranularity === 'monthly') {
                nextDate.setMonth(nextDate.getMonth() + (i + 1));
            } else if (trendGranularity === 'weekly') {
                nextDate.setDate(lastDate.getDate() + (i + 1) * 7);
            } else {
                nextDate.setDate(lastDate.getDate() + (i + 1));
            }
            
            const dateStr = trendGranularity === 'monthly' 
                ? formatMonth(nextDate) 
                : trendGranularity === 'weekly' 
                    ? formatWeek(nextDate) 
                    : nextDate.toISOString().split('T')[0];
            const sortKey = trendGranularity === 'monthly'
                ? new Date(nextDate.getFullYear(), nextDate.getMonth(), 1).getTime()
                : new Date(dateStr).getTime();
                
            trendSales.push({
                date: dateStr,
                sales: null,
                transactions: null,
                forecastSales: predictedSales[i],
                forecastTransactions: predictedTx[i],
                isForecast: true,
                sort: sortKey
            });
        }
    }

    const topProducts = dimensions.product ? groupSum(filteredData, 'product_name', 'Tidak Diketahui', settings) : [];
    const categorySales = dimensions.category ? groupSum(filteredData, 'category', 'Lainnya', settings) : [];
    const channelSales = dimensions.channel ? groupSum(filteredData, 'sales_channel', 'Lainnya', settings).map(item => ({ ...item, value: settings.metricView === 'quantity' ? item.qty : item.sales })) : [];
    const branchSales = dimensions.branch ? groupSum(filteredData, 'branch', 'Tanpa Cabang', settings) : [];
    const citySales = dimensions.city ? groupSum(filteredData, 'destination_city', 'Tanpa Kota', settings) : [];
    const paymentMethods = dimensions.paymentMethod ? groupSum(filteredData, 'payment_method', 'Tidak Diketahui', settings).map(item => ({ ...item, value: settings.metricView === 'quantity' ? item.qty : item.sales })) : [];
    const weekdaySales = Object.values(weekdayMap).sort((a, b) => a.sort - b.sort);

    // Advanced Groupings
    const staffSales = dimensions.staff ? groupSum(filteredData, 'staff_name', 'Tanpa Staff', settings) : [];
    const brandSales = dimensions.brand ? groupSum(filteredData, 'brand', 'Tanpa Merek', settings) : [];
    const supplierSales = dimensions.supplier ? groupSum(filteredData, 'supplier', 'Tanpa Supplier', settings) : [];
    
    // New Business Analytics Groupings
    const promoCampaign = dimensions.promoCode ? groupSum(filteredData, 'promo_code', 'Tanpa Promo', settings) : [];
    const customerSegment = dimensions.customerType ? groupSum(filteredData, 'customer_type', 'Umum', settings).map(item => ({ ...item, value: settings.metricView === 'quantity' ? item.qty : item.sales })) : [];
    const variantPopularity = dimensions.variant ? groupSum(filteredData, 'variant', 'Tanpa Varian', settings) : [];
    const orderFulfillment = dimensions.paymentStatus ? groupSum(filteredData, 'payment_status', 'Selesai', settings).map(item => ({ ...item, value: item.transactions })) : [];

    // New 2D/3D business charts calculations
    const orderTypeMix = dimensions.orderType ? groupSum(filteredData, 'order_type', 'Lainnya', settings).map(item => ({ ...item, value: settings.metricView === 'quantity' ? item.qty : item.sales })) : [];

    let paymentProviderShare = [];
    if (dimensions.paymentMethod && dimensions.paymentProvider) {
        const crossMap = {};
        const provSet = new Set();
        filteredData.forEach(row => {
            const method = toCleanLabel(row.payment_method, 'Tunai');
            const provider = toCleanLabel(row.payment_provider, 'Lainnya');
            const { netRev } = getCalculatedMetrics(row, settings);
            const val = settings.metricView === 'quantity' ? (Number(row.quantity) || 1) : netRev;
            crossMap[method] = crossMap[method] || { name: method };
            crossMap[method][provider] = (crossMap[method][provider] || 0) + val;
            provSet.add(provider);
        });
        paymentProviderShare = Object.values(crossMap).sort((a, b) => {
            const sA = Object.keys(a).filter(k => k !== 'name').reduce((s, k) => s + (a[k] || 0), 0);
            const sB = Object.keys(b).filter(k => k !== 'name').reduce((s, k) => s + (b[k] || 0), 0);
            return sB - sA;
        });
        paymentProviderShare.categories = Array.from(provSet);
    }

    let courierEfficiency = [];
    if (dimensions.shippingCourier) {
        const courierMap = {};
        filteredData.forEach(row => {
            const courier = toCleanLabel(row.shipping_courier, '');
            if (courier) {
                const { netRev } = getCalculatedMetrics(row, settings);
                const fee = Number(row.shipping_fee) || 0;
                courierMap[courier] = courierMap[courier] || { name: courier, fee: 0, sales: 0 };
                courierMap[courier].fee += fee;
                courierMap[courier].sales += netRev;
            }
        });
        courierEfficiency = Object.values(courierMap).sort((a, b) => b.sales - a.sales);
    }

    const tableRevenue = dimensions.tableNumber ? groupSum(filteredData, 'table_number', '', settings).filter(item => item.name !== '') : [];

    let promoRoi = [];
    if (dimensions.promoCode) {
        const promoMap = {};
        filteredData.forEach(row => {
            const promo = toCleanLabel(row.promo_code, '');
            if (promo) {
                const { netRev } = getCalculatedMetrics(row, settings);
                const discount = Number(row.discount_amount) || 0;
                promoMap[promo] = promoMap[promo] || { name: promo, discount: 0, sales: 0 };
                promoMap[promo].discount += discount;
                promoMap[promo].sales += netRev;
            }
        });
        promoRoi = Object.values(promoMap).sort((a, b) => b.sales - a.sales);
    }

    let customerLoyaltyMix = [];
    if (dimensions.customerType && dimensions.category) {
        const crossMap = {};
        const catSet = new Set();
        filteredData.forEach(row => {
            const loyalty = toCleanLabel(row.customer_type, 'Umum');
            const category = toCleanLabel(row.category, 'Lainnya');
            const { netRev } = getCalculatedMetrics(row, settings);
            const val = settings.metricView === 'quantity' ? (Number(row.quantity) || 1) : netRev;
            crossMap[loyalty] = crossMap[loyalty] || { name: loyalty };
            crossMap[loyalty][category] = (crossMap[loyalty][category] || 0) + val;
            catSet.add(category);
        });
        customerLoyaltyMix = Object.values(crossMap).sort((a, b) => {
            const sA = Object.keys(a).filter(k => k !== 'name').reduce((s, k) => s + (a[k] || 0), 0);
            const sB = Object.keys(b).filter(k => k !== 'name').reduce((s, k) => s + (b[k] || 0), 0);
            return sB - sA;
        });
        customerLoyaltyMix.categories = Array.from(catSet);
    }

    let variantProfitability = [];
    if (dimensions.variant) {
        const varMap = {};
        filteredData.forEach(row => {
            const variant = toCleanLabel(row.variant, 'Tanpa Varian');
            const { netRev } = getCalculatedMetrics(row, settings);
            const qty = Number(row.quantity) || 0;
            const cogs = Number(row.cogs) || 0;
            varMap[variant] = varMap[variant] || { name: variant, cogs: 0, sales: 0, qty: 0 };
            varMap[variant].cogs += cogs;
            varMap[variant].sales += netRev;
            varMap[variant].qty += qty;
        });
        variantProfitability = Object.values(varMap).map(item => {
            const margin = item.sales > 0 ? ((item.sales - item.cogs) / item.sales) * 100 : 0;
            return { ...item, margin: Math.round(margin * 10) / 10 };
        });
    }

    // Duration Grouping
    const serviceDuration = [];
    if (dimensions.duration && dimensions.product) {
        const durationMap = {};
        filteredData.forEach(row => {
            const name = toCleanLabel(row.product_name, 'Tidak Diketahui');
            const mins = Number(row.duration_mins) || 0;
            if (mins > 0) {
                durationMap[name] = durationMap[name] || { name, totalMins: 0, count: 0 };
                durationMap[name].totalMins += mins;
                durationMap[name].count += 1;
            }
        });
        Object.values(durationMap).forEach(item => {
            serviceDuration.push({ name: item.name, sales: Math.round(item.totalMins / item.count) }); // using 'sales' key for chart bar size
        });
        serviceDuration.sort((a, b) => b.sales - a.sales);
    }

    // Hourly Grouping (Busiest Hours)
    const hourlySales = [];
    if (dimensions.time) {
        const hourlyMap = {};
        for (let i = 0; i < 24; i++) {
            const hh = i.toString().padStart(2, '0');
            hourlyMap[`${hh}:00`] = { name: `${hh}:00`, sales: 0, transactions: 0 };
        }
        filteredData.forEach(row => {
            const { netRev } = getCalculatedMetrics(row, settings);
            const timeStr = String(row.transaction_time || '').trim();
            if (timeStr) {
                const hourStr = timeStr.split(':')[0];
                if (!isNaN(hourStr)) {
                    const hour = `${hourStr.padStart(2, '0')}:00`;
                    hourlyMap[hour] = hourlyMap[hour] || { name: hour, sales: 0, transactions: 0 };
                    hourlyMap[hour].sales += netRev;
                    hourlyMap[hour].transactions += 1;
                }
            }
        });
        hourlySales.push(...Object.values(hourlyMap));
    }

    // Basket Size Distribution
    const basketSize = BASKET_SIZE_LABELS.map(item => ({ ...item, count: 0 }));
    const trxs = {};
    filteredData.forEach((row, idx) => {
        const id = row.transaction_id || `row_${idx}`;
        if (id) {
            trxs[id] = (trxs[id] || 0) + (Number(row.sales_amount) || 0);
        }
    });
    Object.values(trxs).forEach(val => {
        if (val < BASKET_SIZE_THRESHOLDS.low) basketSize[0].count++;
        else if (val < BASKET_SIZE_THRESHOLDS.medium) basketSize[1].count++;
        else if (val < BASKET_SIZE_THRESHOLDS.high) basketSize[2].count++;
        else if (val < BASKET_SIZE_THRESHOLDS.veryHigh) basketSize[3].count++;
        else basketSize[4].count++;
    });

    // Product Matrix (BCG Scatter)
    let productMatrix = [];
    if (dimensions.product && (dimensions.profit || dimensions.cogs)) {
        const prodMap = {};
        filteredData.forEach(row => {
            const { netRev, profit } = getCalculatedMetrics(row, settings);
            const name = toCleanLabel(row.product_name, 'Tidak Diketahui');
            const qty = Number(row.quantity) || 1;
            prodMap[name] = prodMap[name] || { name, sales: 0, profit: 0, quantity: 0 };
            prodMap[name].sales += netRev;
            prodMap[name].profit += profit;
            prodMap[name].quantity += qty;
        });
        Object.values(prodMap).forEach(item => {
            if (item.sales > 0 && item.quantity > 0) {
                const margin = (item.profit / item.sales) * 100;
                productMatrix.push({
                    name: item.name,
                    x: item.quantity,
                    y: Math.min(Math.max(margin, -100), 100),
                    z: item.sales,
                });
            }
        });
    }

    if (productMatrix.length > 0) {
        const avgQty = productMatrix.reduce((sum, item) => sum + item.x, 0) / productMatrix.length;
        const avgMargin = productMatrix.reduce((sum, item) => sum + item.y, 0) / productMatrix.length;
        productMatrix = productMatrix.map(item => {
            if (item.x >= avgQty && item.y >= avgMargin) {
                return { ...item, quadrant: 'Star Product', recommendation: 'Jaga stok, kualitas, dan visibilitas produk ini.' };
            }
            if (item.x >= avgQty && item.y < avgMargin) {
                return { ...item, quadrant: 'Traffic Product', recommendation: 'Laku keras, tapi cek HPP, diskon, atau bundling agar margin membaik.' };
            }
            if (item.x < avgQty && item.y >= avgMargin) {
                return { ...item, quadrant: 'Hidden Gem', recommendation: 'Margin bagus. Dorong exposure, bundling, atau rekomendasi kasir.' };
            }
            return { ...item, quadrant: 'Problem Product', recommendation: 'Evaluasi harga, stok, atau posisinya di katalog.' };
        });
    }

    // Cross-Dimensional: Category per Branch
    let crossCategoryBranch = [];
    if (dimensions.category && dimensions.branch) {
        const crossMap = {};
        const categories = new Set();
        filteredData.forEach(row => {
            const cat = toCleanLabel(row.category, 'Tanpa Kategori');
            const branch = toCleanLabel(row.branch, 'Tanpa Cabang');
            const { netRev } = getCalculatedMetrics(row, settings);
            const val = settings.metricView === 'quantity' ? (Number(row.quantity) || 1) : netRev;
            crossMap[branch] = crossMap[branch] || { name: branch };
            crossMap[branch][cat] = (crossMap[branch][cat] || 0) + val;
            categories.add(cat);
        });
        crossCategoryBranch = Object.values(crossMap).sort((a, b) => {
            const sumA = Object.keys(a).filter(k => k !== 'name').reduce((s, k) => s + a[k], 0);
            const sumB = Object.keys(b).filter(k => k !== 'name').reduce((s, k) => s + b[k], 0);
            return sumB - sumA;
        });
        crossCategoryBranch.categories = Array.from(categories);
    }

    // Cross-Dimensional: Time x Category (Heatmap/Area data)
    let crossTimeCategory = [];
    if (dimensions.time && dimensions.category) {
        const timeCatMap = {};
        const categories = new Set();
        filteredData.forEach(row => {
            const timeStr = String(row.transaction_time || '').trim();
            const cat = toCleanLabel(row.category, 'Lainnya');
            const { netRev } = getCalculatedMetrics(row, settings);
            const val = settings.metricView === 'quantity' ? (Number(row.quantity) || 1) : netRev;
            if (timeStr) {
                const hour = `${timeStr.split(':')[0].padStart(2, '0')}:00`;
                timeCatMap[hour] = timeCatMap[hour] || { name: hour };
                timeCatMap[hour][cat] = (timeCatMap[hour][cat] || 0) + val;
                categories.add(cat);
            }
        });
        crossTimeCategory = Object.values(timeCatMap).sort((a, b) => a.name.localeCompare(b.name));
        crossTimeCategory.categories = Array.from(categories);
    }

    // Cross-Dimensional: Discount Effectiveness
    let discountEffectiveness = [];
    if (filteredData.some(row => Number(row.discount_amount) > 0) && dimensions.product) {
        filteredData.forEach(row => {
            const discount = Number(row.discount_amount) || 0;
            const qty = Number(row.quantity) || 1;
            const { netRev } = getCalculatedMetrics(row, settings);
            if (discount > 0 && qty > 0 && netRev > 0) {
                discountEffectiveness.push({
                    name: toCleanLabel(row.product_name, 'Produk'),
                    x: discount,
                    y: qty,
                    z: netRev
                });
            }
        });
    }

    // Cross-Dimensional: Channel x Category — omzet/qty tiap kategori per channel
    let crossChannelCategory = [];
    if (dimensions.channel && dimensions.category) {
        const crossMap = {};
        const catSet = new Set();
        filteredData.forEach(row => {
            const ch = toCleanLabel(row.sales_channel, 'Tanpa Channel');
            const cat = toCleanLabel(row.category, 'Tanpa Kategori');
            const { netRev } = getCalculatedMetrics(row, settings);
            const val = settings.metricView === 'quantity' ? (Number(row.quantity) || 1) : netRev;
            crossMap[ch] = crossMap[ch] || { name: ch, _total: 0 };
            crossMap[ch][cat] = (crossMap[ch][cat] || 0) + val;
            crossMap[ch]._total += val;
            catSet.add(cat);
        });
        crossChannelCategory = Object.values(crossMap)
            .map(({ _total, ...rest }) => rest)
            .sort((a, b) => {
                const sA = Object.keys(a).filter(k => k !== 'name').reduce((s, k) => s + (a[k] || 0), 0);
                const sB = Object.keys(b).filter(k => k !== 'name').reduce((s, k) => s + (b[k] || 0), 0);
                return sB - sA;
            });
        crossChannelCategory.categories = Array.from(catSet);
    }

    // Cross-Dimensional: Payment x Channel — volume/qty transaksi metode bayar per channel
    let crossPaymentChannel = [];
    if (dimensions.paymentMethod && dimensions.channel) {
        const crossMap = {};
        const chSet = new Set();
        filteredData.forEach(row => {
            const pay = toCleanLabel(row.payment_method, 'Tanpa Pembayaran');
            const ch = toCleanLabel(row.sales_channel, 'Tanpa Channel');
            const { netRev } = getCalculatedMetrics(row, settings);
            const val = settings.metricView === 'quantity' ? (Number(row.quantity) || 1) : netRev;
            crossMap[pay] = crossMap[pay] || { name: pay };
            crossMap[pay][ch] = (crossMap[pay][ch] || 0) + val;
            chSet.add(ch);
        });
        crossPaymentChannel = Object.values(crossMap).sort((a, b) => {
            const sA = Object.keys(a).filter(k => k !== 'name').reduce((s, k) => s + (a[k] || 0), 0);
            const sB = Object.keys(b).filter(k => k !== 'name').reduce((s, k) => s + (b[k] || 0), 0);
            return sB - sA;
        });
        crossPaymentChannel.categories = Array.from(chSet);
    }

    // Cross-Dimensional: Staff x Category — performa staff per kategori produk
    let crossStaffCategory = [];
    if (dimensions.staff && dimensions.category) {
        const crossMap = {};
        const catSet2 = new Set();
        filteredData.forEach(row => {
            const staff = toCleanLabel(row.staff_name, 'Tanpa Staff');
            const cat = toCleanLabel(row.category, 'Tanpa Kategori');
            const { netRev } = getCalculatedMetrics(row, settings);
            const val = settings.metricView === 'quantity' ? (Number(row.quantity) || 1) : netRev;
            crossMap[staff] = crossMap[staff] || { name: staff };
            crossMap[staff][cat] = (crossMap[staff][cat] || 0) + val;
            catSet2.add(cat);
        });
        crossStaffCategory = Object.values(crossMap).sort((a, b) => {
            const sA = Object.keys(a).filter(k => k !== 'name').reduce((s, k) => s + (a[k] || 0), 0);
            const sB = Object.keys(b).filter(k => k !== 'name').reduce((s, k) => s + (b[k] || 0), 0);
            return sB - sA;
        });
        crossStaffCategory.categories = Array.from(catSet2);
    }

    // Metric: Revenue per Transaction per Channel (efisiensi transaksi tiap channel)
    let channelEfficiency = [];
    if (dimensions.channel) {
        const effMap = {};
        filteredData.forEach(row => {
            const ch = toCleanLabel(row.sales_channel, 'Tanpa Channel');
            const { netRev } = getCalculatedMetrics(row, settings);
            const txId = row.transaction_id || null;
            effMap[ch] = effMap[ch] || { name: ch, sales: 0, txSet: new Set(), qty: 0, discount: 0 };
            effMap[ch].sales += netRev;
            if (txId) effMap[ch].txSet.add(txId);
            effMap[ch].qty += Number(row.quantity) || 1;
            effMap[ch].discount += Number(row.discount_amount) || 0;
        });
        channelEfficiency = Object.values(effMap).map(({ txSet, ...rest }) => ({
            ...rest,
            transactions: txSet.size || 1,
            aov: rest.sales / (txSet.size || 1),
            discountRate: rest.sales > 0 ? (rest.discount / (rest.sales + rest.discount)) * 100 : 0,
        })).sort((a, b) => b.aov - a.aov);
    }

    // Metric: Category Profitability Index (margin per kategori, jika data profit tersedia)
    let categoryProfitability = [];
    if (dimensions.category && (dimensions.profit || dimensions.cogs)) {
        const profMap = {};
        filteredData.forEach(row => {
            const cat = toCleanLabel(row.category, 'Tanpa Kategori');
            const { netRev, profit } = getCalculatedMetrics(row, settings);
            const qty = Number(row.quantity) || 1;
            profMap[cat] = profMap[cat] || { name: cat, sales: 0, profit: 0, qty: 0, transactions: 0 };
            profMap[cat].sales += netRev;
            profMap[cat].profit += profit;
            profMap[cat].qty += qty;
            profMap[cat].transactions += 1;
        });
        categoryProfitability = Object.values(profMap)
            .filter(item => item.sales > 0)
            .map(item => ({
                ...item,
                margin: (item.profit / item.sales) * 100,
                aov: item.sales / Math.max(item.transactions, 1),
            }))
            .sort((a, b) => b.margin - a.margin);
    }

    const dataHealth = profileDataHealth(processedData, dimensions);
    const pareto = {
        products: computePareto(topProducts),
        categories: computePareto(categorySales),
        channels: computePareto(channelSales),
    };

    const topProductShare = topProducts.length && totalOmzet ? topProducts[0].sales / totalOmzet : 0;
    const topChannelShare = channelSales.length && totalOmzet ? channelSales[0].sales / totalOmzet : 0;
    const insights = [];

    if (filteredData.length === 0) {
        insights.push({ type: 'warning', text: 'Tidak ada baris data yang cocok dengan filter saat ini. Longgarkan filter untuk melihat analisis.' });
    } else if (salesRows.length === 0) {
        insights.push({ type: 'warning', text: 'Kolom total penjualan belum terbaca sebagai angka, jadi grafik omzet belum bisa dihitung akurat.' });
    }

    if (topProducts.length > 0) {
        insights.push(topProductShare > 0.4
            ? { type: 'warning', text: `Produk "${topProducts[0].name}" menyumbang ${(topProductShare * 100).toFixed(1)}% omzet. Ini peluang fokus stok, tapi juga risiko ketergantungan produk.` }
            : { type: 'success', text: `Produk teratas "${topProducts[0].name}" masih dalam porsi sehat, komposisi omzet relatif tersebar.` });

        if (pareto.products.total > 0) {
            insights.push({
                type: pareto.products.top20Share > 80 ? 'warning' : 'success',
                text: `Pareto produk: top 20% produk menyumbang ${pareto.products.top20Share.toFixed(1)}% omzet. ${pareto.products.top20Share > 80 ? 'Fokus stok dan mitigasi risiko produk hero.' : 'Portofolio produk relatif lebih tersebar.'}`
            });
        }
    }

    if (channelSales.length > 0 && topChannelShare > 0.65) {
        insights.push({ type: 'warning', text: `${(topChannelShare * 100).toFixed(1)}% omzet datang dari ${channelSales[0].name}. Pertimbangkan penguatan channel cadangan.` });
    }

    if (trendSales.length >= 2) {
        const latest = trendSales[trendSales.length - 1].sales;
        const previous = trendSales[trendSales.length - 2].sales;
        if (previous > 0) {
            const growth = ((latest - previous) / previous) * 100;
            insights.push(growth >= 15
                ? { type: 'success', text: `Periode terakhir naik ${growth.toFixed(1)}% dibanding periode sebelumnya.` }
                : growth <= -15
                    ? { type: 'warning', text: `Periode terakhir turun ${Math.abs(growth).toFixed(1)}% dibanding periode sebelumnya. Cek produk/channel penyebabnya.` }
                    : { type: 'success', text: 'Tren periode terakhir relatif stabil dibanding periode sebelumnya.' });
        }
    }

    if (profitMargin > 0) {
        if (profitMargin > 30) insights.push({ type: 'success', text: `Profit margin Anda sangat sehat di angka ${profitMargin.toFixed(1)}%.` });
        else if (profitMargin < 10) insights.push({ type: 'warning', text: `Profit margin hanya ${profitMargin.toFixed(1)}%. Pertimbangkan meninjau harga pokok atau biaya operasional.` });
    }

    if (avgRating > 0) {
        if (avgRating >= 4.5) insights.push({ type: 'success', text: `Kepuasan pelanggan sangat baik dengan rata-rata rating ${avgRating.toFixed(1)} dari 5.` });
        else if (avgRating < 3.5) insights.push({ type: 'warning', text: `Rata-rata rating ${avgRating.toFixed(1)}. Perlu investigasi masalah layanan atau produk secepatnya.` });
    }

    if (staffSales.length > 0 && totalOmzet > 0) {
        const topStaffShare = staffSales[0].sales / totalOmzet;
        if (topStaffShare > 0.5 && staffSales.length > 2) {
            insights.push({ type: 'warning', text: `Ketergantungan tinggi! Staff "${staffSales[0].name}" menyumbang ${(topStaffShare * 100).toFixed(1)}% dari total omzet. Pastikan transfer ilmu terjadi.` });
        }
    }

    // --- Period-over-period Growth Calculation (based on selected filter) ---
    const growthCalc = (current, previous) => previous > 0 ? ((current - previous) / previous) * 100 : (current > 0 ? 100 : 0);

    // Generic KPI extractor from any set of rows
    const computeKpiFromRows = (rows) => {
        const omzet = rows.reduce((s, r) => s + (Number(r.sales_amount) || 0), 0);
        const diskon = rows.reduce((s, r) => s + (Number(r.discount_amount) || 0), 0);
        const ongkir = rows.reduce((s, r) => s + (Number(r.shipping_fee) || 0), 0);
        const profit = rows.reduce((s, r) => s + (Number(r.gross_profit) || 0), 0);
        const commission = rows.reduce((s, r) => s + (Number(r.staff_commission) || 0), 0);
        const tax = rows.reduce((s, r) => s + (Number(r.tax) || 0), 0);
        const serviceCharge = rows.reduce((s, r) => s + (Number(r.service_charge) || 0), 0);
        const platformFee = rows.reduce((s, r) => s + (Number(r.platform_fee) || 0), 0);
        const retur = rows.reduce((s, r) => s + (Number(r.return_amount) || 0), 0);
        const qty = rows.reduce((s, r) => s + (Number(r.quantity) || 1), 0);
        const txSet = new Set(rows.map(r => r.transaction_id).filter(Boolean));
        const txCount = txSet.size > 0 ? txSet.size : rows.length;
        const customers = new Set(rows.map(r => r.customer_id || r.customer_name).filter(Boolean));
        const ratings = rows.map(r => Number(r.rating)).filter(n => n > 0 && n <= 5);
        const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
        const aov = txCount > 0 ? omzet / txCount : 0;
        return { omzet, diskon, ongkir, profit, commission, tax, serviceCharge, platformFee, retur, qty, txCount, customers: customers.size, avgRating, aov };
    };

    let growth = { label: '' };

    if (dimensions.date) {
        let prevRows = [];
        let currRowsOverride = null; // when we need to override filteredData for "current"
        let growthLabel = '';
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

        const applyNonDateFilters = (row) => {
            if (categoryFilter !== 'all' && toCleanLabel(row.category, '') !== categoryFilter) return false;
            if (channelFilter !== 'all' && toCleanLabel(row.sales_channel, '') !== channelFilter) return false;
            if (branchFilter !== 'all' && toCleanLabel(row.branch, '') !== branchFilter) return false;
            if (paymentFilter !== 'all' && toCleanLabel(row.payment_method, '') !== paymentFilter) return false;
            return true;
        };

        if (dateFilter === '7days') {
            prevRows = processedData.filter(row => {
                if (!applyNonDateFilters(row)) return false;
                const d = parseTransactionDate(row.transaction_date);
                if (!d) return false;
                const diffDays = (now - d) / (1000 * 60 * 60 * 24);
                return diffDays > 7 && diffDays <= 14;
            });
            growthLabel = 'vs 7hr sblm';
        } else if (dateFilter === '30days') {
            prevRows = processedData.filter(row => {
                if (!applyNonDateFilters(row)) return false;
                const d = parseTransactionDate(row.transaction_date);
                if (!d) return false;
                const diffDays = (now - d) / (1000 * 60 * 60 * 24);
                return diffDays > 30 && diffDays <= 60;
            });
            growthLabel = 'vs 30hr sblm';
        } else if (dateFilter === 'mtd') {
            const dayOfMonth = now.getDate();
            const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            prevRows = processedData.filter(row => {
                if (!applyNonDateFilters(row)) return false;
                const d = parseTransactionDate(row.transaction_date);
                return d && d.getFullYear() === prevYear && d.getMonth() === prevMonth && d.getDate() <= dayOfMonth;
            });
            growthLabel = `vs ${monthNames[prevMonth]}`;
        } else if (dateFilter === 'mom') {
            const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            prevRows = processedData.filter(row => {
                if (!applyNonDateFilters(row)) return false;
                const d = parseTransactionDate(row.transaction_date);
                return d && d.getFullYear() === prevYear && d.getMonth() === prevMonth;
            });
            growthLabel = `vs ${monthNames[prevMonth]}`;
        } else if (dateFilter === 'yoy') {
            prevRows = processedData.filter(row => {
                if (!applyNonDateFilters(row)) return false;
                const d = parseTransactionDate(row.transaction_date);
                return d && d.getFullYear() === currentYear - 1 && d.getMonth() === currentMonth;
            });
            growthLabel = `vs ${monthNames[currentMonth]} ${currentYear - 1}`;
        } else if (dateFilter === 'ytd') {
            const dayOfYear = Math.floor((now - new Date(currentYear, 0, 1)) / (1000 * 60 * 60 * 24));
            prevRows = processedData.filter(row => {
                if (!applyNonDateFilters(row)) return false;
                const d = parseTransactionDate(row.transaction_date);
                if (!d || d.getFullYear() !== currentYear - 1) return false;
                const prevDayOfYear = Math.floor((d - new Date(currentYear - 1, 0, 1)) / (1000 * 60 * 60 * 24));
                return prevDayOfYear <= dayOfYear;
            });
            growthLabel = `vs ${currentYear - 1}`;
        } else if (dateFilter === 'all' && validDates.length >= 2) {
            const firstDate = validDates[0];
            const lastDate = validDates[validDates.length - 1];
            const totalSpanDays = (lastDate - firstDate) / (1000 * 60 * 60 * 24);

            if (totalSpanDays >= 56) {
                const lastMonth = lastDate.getMonth();
                const lastYear = lastDate.getFullYear();
                const pm = lastMonth === 0 ? 11 : lastMonth - 1;
                const py = lastMonth === 0 ? lastYear - 1 : lastYear;
                currRowsOverride = filteredData.filter(row => {
                    const d = parseTransactionDate(row.transaction_date);
                    return d && d.getMonth() === lastMonth && d.getFullYear() === lastYear;
                });
                prevRows = filteredData.filter(row => {
                    const d = parseTransactionDate(row.transaction_date);
                    return d && d.getMonth() === pm && d.getFullYear() === py;
                });
                growthLabel = `vs ${monthNames[pm]}`;
            } else {
                const midDate = new Date(firstDate.getTime() + (lastDate - firstDate) / 2);
                currRowsOverride = filteredData.filter(row => {
                    const d = parseTransactionDate(row.transaction_date);
                    return d && d >= midDate;
                });
                prevRows = filteredData.filter(row => {
                    const d = parseTransactionDate(row.transaction_date);
                    return d && d < midDate;
                });
                growthLabel = 'vs paruh sblm';
            }
        }

        const currSource = currRowsOverride || filteredData;
        if (currSource.length > 0) {
            const prev = computeKpiFromRows(prevRows);
            const curr = currRowsOverride ? computeKpiFromRows(currRowsOverride) : {
                omzet: totalOmzet, diskon: totalDiskon, ongkir: totalOngkir, profit: totalProfit,
                commission: totalCommission, tax: totalTax, serviceCharge: totalServiceCharge,
                platformFee: totalPlatformFee, retur: totalRetur, qty: produkTerjual,
                txCount: totalTransaksi, customers: uniqueCustomers.size, avgRating, aov: avgTransaksi,
            };

            growth = {
                omzet: growthCalc(curr.omzet, prev.omzet),
                transaksi: growthCalc(curr.txCount, prev.txCount),
                profit: growthCalc(curr.profit, prev.profit),
                aov: growthCalc(curr.aov, prev.aov),
                diskon: growthCalc(curr.diskon, prev.diskon),
                ongkir: growthCalc(curr.ongkir, prev.ongkir),
                commission: growthCalc(curr.commission, prev.commission),
                tax: growthCalc(curr.tax, prev.tax),
                serviceCharge: growthCalc(curr.serviceCharge, prev.serviceCharge),
                platformFee: growthCalc(curr.platformFee, prev.platformFee),
                retur: growthCalc(curr.retur, prev.retur),
                qty: growthCalc(curr.qty, prev.qty),
                customers: growthCalc(curr.customers, prev.customers),
                rating: growthCalc(curr.avgRating, prev.avgRating),
                label: growthLabel,
            };
        }
    }

    const productQuadrants = Object.values(productMatrix.reduce((acc, item) => {
        const key = item.quadrant || 'Belum Diklasifikasi';
        acc[key] = acc[key] || { name: key, count: 0, sales: 0, items: [] };
        acc[key].count += 1;
        acc[key].sales += Number(item.z) || 0;
        acc[key].items.push(item);
        return acc;
    }, {})).sort((a, b) => b.sales - a.sales);

    const customerMap = {};
    if (dimensions.customer) {
        filteredData.forEach((row, idx) => {
            const id = row.customer_id || row.customer_name || `row_${idx}`;
            const date = parseTransactionDate(row.transaction_date);
            const { netRev } = getCalculatedMetrics(row, settings);
            customerMap[id] = customerMap[id] || {
                id,
                name: toCleanLabel(row.customer_name || row.customer_id, 'Pelanggan'),
                sales: 0,
                transactions: new Set(),
                rows: 0,
                lastDate: null,
            };
            customerMap[id].sales += netRev;
            customerMap[id].transactions.add(row.transaction_id || `row_${idx}`);
            customerMap[id].rows += 1;
            if (date && (!customerMap[id].lastDate || date > customerMap[id].lastDate)) customerMap[id].lastDate = date;
        });
    }
    const customerList = Object.values(customerMap).map(item => ({
        ...item,
        transactions: item.transactions.size || item.rows,
        recencyDays: item.lastDate ? Math.round((now - item.lastDate) / (1000 * 60 * 60 * 24)) : null,
    })).sort((a, b) => b.sales - a.sales);
    const repeatCustomers = customerList.filter(item => item.transactions > 1);
    const vipThreshold = customerList.length ? customerList[Math.max(0, Math.floor(customerList.length * 0.2) - 1)]?.sales || 0 : 0;
    const customerSegments = {
        total: customerList.length,
        repeat: repeatCustomers.length,
        repeatRate: customerList.length ? (repeatCustomers.length / customerList.length) * 100 : 0,
        vip: customerList.filter(item => item.sales >= vipThreshold && vipThreshold > 0).slice(0, 10),
        atRisk: customerList.filter(item => item.recencyDays !== null && item.recencyDays > 30 && item.transactions > 1).slice(0, 10),
        topCustomers: customerList.slice(0, 10),
    };

    if (dimensions.customer && customerSegments.total > 0) {
        insights.push({
            type: customerSegments.repeatRate >= 25 ? 'success' : 'warning',
            text: `Repeat customer rate ${customerSegments.repeatRate.toFixed(1)}%. ${customerSegments.repeatRate >= 25 ? 'Basis pelanggan mulai sehat untuk program loyalti.' : 'Peluang retensi masih besar: dorong follow-up, voucher balik, atau membership sederhana.'}`
        });
    }

    const businessSignals = {
        fnb: dimensions.time || dimensions.channel || /cafe|kopi|resto|makan|minum|food|kuliner/i.test(settings.businessType || ''),
        jasa: dimensions.duration || dimensions.staff || /salon|klinik|barber|jasa|service|spa/i.test(settings.businessType || ''),
        marketplace: dimensions.platformFee || dimensions.shipping || dimensions.city || /marketplace|online|seller|shopee|tokopedia/i.test(settings.businessType || ''),
        retail: dimensions.brand || dimensions.supplier || dimensions.cogs || /retail|toko|fashion|sembako/i.test(settings.businessType || ''),
    };
    const businessProfile = businessSignals.jasa
        ? { type: 'Jasa / Layanan', focus: ['Performa staff', 'Durasi layanan', 'Rating', 'Repeat customer'] }
        : businessSignals.marketplace
            ? { type: 'Marketplace / Online Seller', focus: ['Biaya platform', 'Kota pengiriman', 'Retur', 'Margin bersih'] }
            : businessSignals.fnb
                ? { type: 'F&B / Cafe', focus: ['Jam ramai', 'Menu terlaris', 'Channel delivery', 'Efektivitas promo'] }
                : businessSignals.retail
                    ? { type: 'Retail / Toko', focus: ['Produk dan kategori', 'Supplier', 'Brand', 'Margin produk'] }
                    : { type: 'General UMKM', focus: ['Omzet', 'Produk', 'Channel', 'Kualitas data'] };

    const analystQuestions = [
        dimensions.product && 'Produk mana yang harus diprioritaskan?',
        dimensions.channel && 'Channel mana paling menguntungkan?',
        dimensions.date && 'Kenapa omzet naik atau turun?',
        dimensions.discount && 'Diskon saya efektif atau tidak?',
        dimensions.branch && 'Cabang mana yang butuh perhatian?',
        dimensions.customer && 'Pelanggan mana yang paling bernilai?',
        'Apa risiko terbesar dari data ini?',
    ].filter(Boolean);

    const topDriver = topProducts[0] || categorySales[0] || channelSales[0];
    const hiddenGem = productMatrix.find(item => item.quadrant === 'Hidden Gem');
    const riskText = dataHealth.issues[0]?.text
        || (pareto.products.top20Share > 80 ? 'Ketergantungan pada sedikit produk cukup tinggi.' : 'Tidak ada risiko data besar yang langsung terlihat.');
    const opportunityText = hiddenGem
        ? `Produk "${hiddenGem.name}" terlihat sebagai hidden gem: margin bagus tetapi volume belum maksimal.`
        : channelSales[0]?.name
            ? `Channel "${channelSales[0].name}" adalah kontributor utama dan layak dijadikan benchmark.`
            : 'Rapikan kolom produk, tanggal, channel, dan HPP agar analisis makin tajam.';
    const executiveSummary = [
        `${dateRange ? `Periode ${dateRange.start} - ${dateRange.end}` : 'Dataset ini'} berisi ${filteredData.length} baris terfilter dari ${processedData.length} baris.`,
        `Omzet tercatat ${totalOmzet.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })} dengan ${totalTransaksi.toLocaleString('id-ID')} transaksi dan AOV ${avgTransaksi.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}.`,
        topDriver ? `Driver utama saat ini adalah "${topDriver.name}" dengan kontribusi omzet terbesar.` : 'Driver utama belum bisa dibaca karena kolom produk/kategori/channel belum cukup lengkap.',
        `Risiko utama: ${riskText}`,
        `Aksi yang disarankan: ${opportunityText}`,
    ];

    const analystFindings = insights.map((item) => {
        const text = item.text || '';
        if (/pareto|top 20/i.test(text)) {
            return {
                ...item,
                title: 'Konsentrasi Portofolio Produk',
                finding: text,
                impact: pareto.products.top20Share > 80 ? 'Risiko ketergantungan pada sedikit produk tinggi.' : 'Kontribusi produk relatif tersebar.',
                action: pareto.products.top20Share > 80 ? 'Amankan stok produk utama dan siapkan produk substitusi.' : 'Pertahankan variasi produk dan dorong produk margin tinggi.',
            };
        }
        if (/produk/i.test(text)) {
            return {
                ...item,
                title: 'Driver Omzet Produk',
                finding: text,
                impact: topProductShare > 0.4 ? 'Omzet sensitif terhadap performa satu produk.' : 'Risiko konsentrasi produk masih terkendali.',
                action: topProductShare > 0.4 ? 'Pantau stok, harga, dan kualitas produk utama secara ketat.' : 'Gunakan produk teratas sebagai anchor bundling.',
            };
        }
        if (/channel|omzet datang/i.test(text)) {
            return {
                ...item,
                title: 'Ketergantungan Channel Penjualan',
                finding: text,
                impact: 'Komposisi channel memengaruhi risiko penjualan dan biaya akuisisi.',
                action: 'Bandingkan margin bersih antar channel sebelum menaikkan budget promo.',
            };
        }
        if (/Periode terakhir|Tren/i.test(text)) {
            return {
                ...item,
                title: 'Momentum Penjualan',
                finding: text,
                impact: 'Perubahan tren perlu dibaca bersama produk, channel, dan periode promo.',
                action: 'Cek kontributor kenaikan/penurunan di chart produk dan channel.',
            };
        }
        if (/Profit margin/i.test(text)) {
            return {
                ...item,
                title: 'Kesehatan Margin',
                finding: text,
                impact: profitMargin < 10 ? 'Ruang laba tipis, omzet tinggi belum tentu sehat.' : 'Margin memberi ruang untuk promosi atau ekspansi.',
                action: profitMargin < 10 ? 'Audit HPP, diskon, komisi, dan biaya platform.' : 'Prioritaskan produk/channel dengan margin serupa.',
            };
        }
        if (/rating|Kepuasan/i.test(text)) {
            return {
                ...item,
                title: 'Kualitas Pengalaman Pelanggan',
                finding: text,
                impact: 'Rating memengaruhi repeat order dan reputasi channel.',
                action: avgRating < 3.5 ? 'Audit keluhan pelanggan dan proses layanan.' : 'Gunakan rating tinggi sebagai materi promosi.',
            };
        }
        if (/Staff|staff/i.test(text)) {
            return {
                ...item,
                title: 'Distribusi Performa Staff',
                finding: text,
                impact: 'Ketimpangan performa staff dapat menjadi risiko operasional.',
                action: 'Dokumentasikan pola kerja staff terbaik dan replikasi ke tim lain.',
            };
        }
        if (/Repeat customer/i.test(text)) {
            return {
                ...item,
                title: 'Retensi Pelanggan',
                finding: text,
                impact: 'Repeat rate menentukan stabilitas omzet tanpa selalu mengejar pelanggan baru.',
                action: customerSegments.repeatRate >= 25 ? 'Bangun program loyalti ringan.' : 'Buat promo balik atau reminder pelanggan lama.',
            };
        }
        return {
            ...item,
            title: item.type === 'warning' ? 'Area Yang Perlu Dicek' : 'Sinyal Positif',
            finding: text,
            impact: 'Temuan ini memengaruhi cara membaca performa bisnis.',
            action: 'Validasi dengan filter periode, produk, dan channel.',
        };
    });

    const confidenceSignals = [
        { ok: dataHealth.score >= 85, weight: 25, label: 'Kualitas data baik' },
        { ok: dimensions.date, weight: 15, label: 'Tanggal transaksi tersedia' },
        { ok: dimensions.product || dimensions.category, weight: 15, label: 'Produk atau kategori tersedia' },
        { ok: dimensions.channel || dimensions.branch, weight: 10, label: 'Channel atau cabang tersedia' },
        { ok: dimensions.cogs || dimensions.profit, weight: 15, label: 'HPP atau profit tersedia' },
        { ok: dimensions.customer, weight: 10, label: 'Data pelanggan tersedia' },
        { ok: filteredData.length >= 30, weight: 10, label: 'Jumlah baris cukup untuk pola dasar' },
    ];
    const confidenceScore = Math.min(100, Math.round(confidenceSignals.reduce((sum, signal) => sum + (signal.ok ? signal.weight : 0), 0)));
    const missingConfidenceSignals = confidenceSignals.filter(signal => !signal.ok).map(signal => signal.label);
    const insightConfidence = {
        score: confidenceScore,
        label: confidenceScore >= 80 ? 'Tinggi' : confidenceScore >= 55 ? 'Sedang' : 'Rendah',
        missingSignals: missingConfidenceSignals,
        note: confidenceScore >= 80
            ? 'Insight cukup kuat untuk dipakai mengambil keputusan operasional.'
            : confidenceScore >= 55
                ? 'Insight bisa dipakai sebagai arahan awal, tetapi beberapa kolom perlu dilengkapi.'
                : 'Insight masih bersifat indikasi. Rapikan data utama sebelum mengambil keputusan besar.',
    };

    const weeklyActionPlan = [
        topProducts[0] && {
            priority: 'Tinggi',
            area: 'Produk',
            action: `Pastikan stok dan visibilitas "${topProducts[0].name}" aman minggu ini.`,
            evidence: `Produk ini menjadi driver omzet terbesar pada data terfilter.`,
        },
        profitMargin > 0 && profitMargin < 10 && {
            priority: 'Tinggi',
            area: 'Margin',
            action: 'Audit HPP, diskon, fee platform, dan komisi untuk produk/channel beromzet besar.',
            evidence: `Profit margin hanya ${profitMargin.toFixed(1)}%.`,
        },
        pareto.products.top20Share > 80 && {
            priority: 'Tinggi',
            area: 'Risiko Portofolio',
            action: 'Siapkan produk substitusi dan jaga stok produk utama agar omzet tidak bergantung pada sedikit item.',
            evidence: `Top 20% produk menyumbang ${pareto.products.top20Share.toFixed(1)}% omzet.`,
        },
        channelSales[0] && topChannelShare > 0.7 && {
            priority: 'Sedang',
            area: 'Channel',
            action: `Uji channel cadangan selain "${channelSales[0].name}" dengan promo kecil dan ukur AOV/margin.`,
            evidence: `${(topChannelShare * 100).toFixed(1)}% omzet datang dari satu channel.`,
        },
        customerSegments.total > 0 && customerSegments.repeatRate < 25 && {
            priority: 'Sedang',
            area: 'Retensi',
            action: 'Kirim promo balik atau reminder ke pelanggan lama yang pernah transaksi lebih dari sekali.',
            evidence: `Repeat customer rate ${customerSegments.repeatRate.toFixed(1)}%.`,
        },
        hiddenGem && {
            priority: 'Sedang',
            area: 'Hidden Gem',
            action: `Dorong "${hiddenGem.name}" lewat bundling, rekomendasi kasir, atau highlight katalog.`,
            evidence: 'Produk ini punya margin bagus tetapi volume belum maksimal.',
        },
        dataHealth.score < 85 && {
            priority: 'Dasar',
            area: 'Kualitas Data',
            action: 'Lengkapi kolom tanggal, produk, omzet, channel, dan HPP sebelum analisis periode berikutnya.',
            evidence: `Skor kualitas data ${dataHealth.score}/100.`,
        },
    ].filter(Boolean).slice(0, 6);

    const activeFilterCount = [dateFilter, categoryFilter, channelFilter, branchFilter, paymentFilter].filter(v => v !== 'all').length;

    return {
        dimensions,
        filters: filterOptions,
        activeFilterCount,
        rowStats: { totalRows: processedData.length, filteredRows: filteredData.length },
        dateRange,
        dataHealth,
        pareto,
        businessProfile,
        analystQuestions,
        executiveSummary,
        insightConfidence,
        weeklyActionPlan,
        customerSegments,
        productQuadrants,
        kpis: {
            totalOmzet,
            totalTransaksi,
            produkTerjual,
            avgTransaksi,
            jumlahPelanggan: uniqueCustomers.size,
            avgItems,
            totalDiskon,
            totalOngkir,
            totalProfit,
            profitMargin,
            avgRating,
            totalCommission,
            totalRetur,
            netRevenue,
            totalTax,
            totalServiceCharge,
            totalPlatformFee,
            growth,
        },
        charts: { topProducts, categorySales, channelSales, branchSales, citySales, paymentMethods, trendSales, weekdaySales, staffSales, serviceDuration, hourlySales, basketSize, productMatrix, brandSales, supplierSales, crossCategoryBranch, crossTimeCategory, discountEffectiveness, crossChannelCategory, crossPaymentChannel, crossStaffCategory, channelEfficiency, categoryProfitability, promoCampaign, customerSegment, variantPopularity, orderFulfillment, orderTypeMix, paymentProviderShare, courierEfficiency, tableRevenue, promoRoi, customerLoyaltyMix, variantProfitability },
        insights: analystFindings
    };
};
