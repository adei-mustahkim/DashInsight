export const generateDemoData = () => {
  const products = [
    { name: 'Kopi Susu Gula Aren', category: 'Minuman', price: 18000 },
    { name: 'Es Teh Manis', category: 'Minuman', price: 8000 },
    { name: 'Nasi Ayam Geprek', category: 'Makanan', price: 25000 },
    { name: 'Mie Goreng Spesial', category: 'Makanan', price: 20000 },
    { name: 'Keripik Singkong', category: 'Cemilan', price: 15000 },
  ];
  const channels = ['Toko Fisik', 'Gofood', 'Grabfood', 'ShopeeFood'];
  const branches = ['Cabang Utama', 'Cabang Selatan'];
  const staffs = ['Ahmad', 'Budi', 'Chandra', 'Dewi'];

  const data: any[] = [];
  const now = new Date();

  for (let i = 0; i < 200; i++) {
    const product = products[Math.floor(Math.random() * products.length)];
    const qty = Math.floor(Math.random() * 5) + 1;
    const date = new Date(now.getTime() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);
    const time = `${String(Math.floor(Math.random() * 14) + 9).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`;

    // Financial estimations
    const subtotal = product.price * qty;
    const hasDiscount = Math.random() < 0.25;
    const discountAmount = hasDiscount ? Math.round(subtotal * (Math.random() < 0.5 ? 0.1 : 0.2)) : 0;
    const salesAmount = subtotal - discountAmount;
    
    const cogsPercent = 0.45 + Math.random() * 0.10; // 45%-55% cost
    const unitCogs = Math.round(product.price * cogsPercent);
    const totalCogs = unitCogs * qty;

    const isReturned = Math.random() < 0.02; // 2% return rate
    const returnAmount = isReturned ? salesAmount : 0;
    const paymentStatus = isReturned ? 'Batal' : (Math.random() < 0.05 ? 'Diproses' : 'Selesai');

    const grossProfit = isReturned ? 0 : salesAmount - totalCogs;
    
    // Taxes and platform fees
    const channel = channels[Math.floor(Math.random() * channels.length)];
    const isOnline = channel !== 'Toko Fisik';
    const platformFee = isOnline ? Math.round(salesAmount * 0.15) : 0; // 15% platform fee for delivery apps
    const tax = Math.round(salesAmount * 0.11); // 11% PPN
    const expenseAmount = Math.floor(Math.random() * 5000) + 1000; // Small miscellaneous opex per item row

    // Order properties
    const orderType = isOnline ? 'Delivery' : (Math.random() < 0.5 ? 'Dine-In' : 'Takeaway');
    const paymentProvider = Math.random() < 0.3 ? 'BCA' : (Math.random() < 0.6 ? 'Gopay' : (Math.random() < 0.8 ? 'ShopeePay' : 'Tunai'));
    const shippingCourier = orderType === 'Delivery' ? (Math.random() < 0.5 ? 'Gosend' : 'GrabExpress') : '';
    const tableNumber = orderType === 'Dine-In' ? `Meja-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}` : '';
    const promoCode = discountAmount > 0 ? (Math.random() < 0.5 ? 'PROMOHEBAT' : 'DISKONCOPI') : '';
    const customerType = Math.random() < 0.2 ? 'Member Gold' : (Math.random() < 0.4 ? 'Member Silver' : 'Regular');
    const variant = Math.random() < 0.3 ? 'Regular' : (Math.random() < 0.6 ? 'Large' : 'Less Sugar');

    data.push({
      transaction_date: date.toISOString().split('T')[0],
      transaction_time: time,
      transaction_id: `INV-${1000 + i}`,
      product_name: product.name,
      category: product.category,
      quantity: qty,
      unit_price: product.price,
      discount_amount: discountAmount,
      shipping_fee: orderType === 'Delivery' ? 12000 : 0,
      cogs: totalCogs,
      gross_profit: grossProfit,
      sales_amount: salesAmount,
      return_amount: returnAmount,
      payment_method: paymentProvider === 'Tunai' ? 'Cash' : 'Digital',
      payment_status: paymentStatus,
      customer_name: `Pelanggan ${100 + i}`,
      customer_id: `CUST-${2000 + (i % 20)}`,
      sales_channel: channel,
      branch: branches[Math.floor(Math.random() * branches.length)],
      staff_name: staffs[Math.floor(Math.random() * staffs.length)],
      staff_commission: Math.round(salesAmount * 0.02), // 2% staff incentive
      tax: tax,
      platform_fee: platformFee,
      promo_code: promoCode,
      customer_type: customerType,
      variant: variant,
      expense_amount: expenseAmount,
      order_type: orderType,
      payment_provider: paymentProvider,
      shipping_courier: shippingCourier,
      table_number: tableNumber,
    });
  }
  return data;
};
export default generateDemoData;
