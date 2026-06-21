import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const excelDateToISOString = (val) => {
  if (typeof val === 'number') {
    const date = new Date((val - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  }
  return String(val);
};

const getCustomerType = (id) => {
  if (!id) return 'Umum';
  const num = parseInt(String(id).replace(/\D/g, ''), 10);
  if (isNaN(num)) return 'Umum';
  if (num % 5 === 0) return 'VIP';
  if (num % 2 === 0) return 'Member';
  return 'Umum';
};

const sampleFolder = 'sample data exel';

// 1. Retail
const parseRetail = () => {
  const file = 'dataset_umkm_retail_kompleks_jan_mei_2026.xlsx';
  const workbook = XLSX.readFile(path.join(sampleFolder, file));
  const worksheet = workbook.Sheets['Data_Clean'];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  const headers = rows[3];
  
  const colIndex = (name) => headers.indexOf(name);
  const dateIdx = colIndex('transaction_date');
  const txIdIdx = colIndex('transaction_id');
  const prodNameIdx = colIndex('product_name');
  const catIdx = colIndex('category');
  const brandIdx = colIndex('brand');
  const qtyIdx = colIndex('quantity');
  const discIdx = colIndex('discount_amount');
  const salesIdx = colIndex('sales_amount');
  const cogsIdx = colIndex('cogs');
  const custIdIdx = colIndex('customer_id');
  const channelIdx = colIndex('sales_channel');
  const branchIdx = colIndex('branch');
  const cashierIdx = colIndex('cashier');
  const payMethodIdx = colIndex('payment_method');
  const isValidIdx = colIndex('is_valid_sale');

  const list = [];
  for (let i = 4; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || row[isValidIdx] !== 1) continue;

    const transaction_date = excelDateToISOString(row[dateIdx]);
    const sales_channel = row[channelIdx] || 'Kasir Toko';
    const isOnline = sales_channel.toLowerCase().includes('online') || sales_channel.toLowerCase().includes('go') || sales_channel.toLowerCase().includes('grab') || sales_channel.toLowerCase().includes('shopee');
    
    list.push({
      transaction_date,
      transaction_id: String(row[txIdIdx] || `TX-RT-${i}`),
      product_name: row[prodNameIdx],
      category: row[catIdx],
      sales_channel,
      quantity: Number(row[qtyIdx] || 0),
      sales_amount: Number(row[salesIdx] || 0),
      cogs: Number(row[cogsIdx] || 0),
      payment_method: row[payMethodIdx] === 'Tunai' ? 'Tunai' : 'E-Wallet',
      payment_provider: row[payMethodIdx] || 'Tunai',
      shipping_courier: isOnline ? (Math.random() < 0.5 ? 'Gosend' : 'GrabExpress') : '',
      shipping_fee: isOnline ? 12000 : 0,
      promo_code: Number(row[discIdx]) > 0 ? 'PROMORETAIL' : '',
      discount_amount: Number(row[discIdx] || 0),
      customer_type: getCustomerType(row[custIdIdx]),
      table_number: '',
      variant: row[brandIdx] || 'Biasa',
      destination_city: (row[branchIdx] || '').toLowerCase().includes('utama') ? 'Jakarta' : (row[branchIdx] || '').toLowerCase().includes('timur') ? 'Surabaya' : 'Bandung',
      staff_name: row[cashierIdx] || 'Staff',
      duration_mins: 0,
      order_type: isOnline ? 'Delivery' : 'Takeaway'
    });
  }
  return list;
};

// 2. F&B
const parseFnb = () => {
  const file = 'dataset_umkm_kuliner_kompleks_jan_mei_2026.xlsx';
  const workbook = XLSX.readFile(path.join(sampleFolder, file));
  const worksheet = workbook.Sheets['Data_Clean'];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  const headers = rows[3];
  
  const colIndex = (name) => headers.indexOf(name);
  const dateIdx = colIndex('transaction_date');
  const txIdIdx = colIndex('transaction_id');
  const prodNameIdx = colIndex('product_name');
  const catIdx = colIndex('category');
  const qtyIdx = colIndex('quantity');
  const discIdx = colIndex('discount_amount');
  const salesIdx = colIndex('sales_amount');
  const cogsIdx = colIndex('cogs');
  const channelIdx = colIndex('sales_channel');
  const payMethodIdx = colIndex('payment_method');
  const memberIdx = colIndex('member_status');
  const orderTypeIdx = colIndex('order_type');
  const promoIdx = colIndex('promo_code');
  const orderTimeIdx = colIndex('order_time');
  const isValidIdx = colIndex('is_valid_sale');

  const list = [];
  for (let i = 4; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || row[isValidIdx] !== 1) continue;

    const transaction_date = excelDateToISOString(row[dateIdx]);
    const orderType = row[orderTypeIdx] || 'Dine-in';
    const isOnline = orderType.toLowerCase().includes('delivery') || orderType.toLowerCase().includes('take');
    
    // table number
    let table = '';
    if (orderType === 'Dine-in') {
      const tables = ['Meja 1', 'Meja 2', 'Meja 3', 'Meja 4', 'Meja 5', 'Meja 6'];
      table = tables[i % tables.length];
    }

    list.push({
      transaction_date,
      transaction_id: String(row[txIdIdx] || `TX-FB-${i}`),
      product_name: row[prodNameIdx],
      category: row[catIdx],
      sales_channel: row[channelIdx] || 'Kasir',
      quantity: Number(row[qtyIdx] || 0),
      sales_amount: Number(row[salesIdx] || 0),
      cogs: Number(row[cogsIdx] || 0),
      payment_method: row[payMethodIdx] === 'Tunai' ? 'Tunai' : 'E-Wallet',
      payment_provider: row[payMethodIdx] || 'Tunai',
      shipping_courier: isOnline ? 'ShopeeFood' : '',
      shipping_fee: isOnline ? 10000 : 0,
      promo_code: row[promoIdx] || '',
      discount_amount: Number(row[discIdx] || 0),
      customer_type: row[memberIdx] === 'Member' ? 'Member' : 'Umum',
      table_number: table,
      variant: 'Standard',
      destination_city: 'Jakarta',
      staff_name: 'Waiter ' + (i % 3 + 1),
      duration_mins: row[orderTimeIdx] ? 15 : 0,
      order_type: orderType
    });
  }
  return list;
};

// 3. Jasa
const parseJasa = () => {
  const file = 'dataset_umkm_jasa_kompleks_jan_mei_2026.xlsx';
  const workbook = XLSX.readFile(path.join(sampleFolder, file));
  const worksheet = workbook.Sheets['Data_Clean'];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  const headers = rows[3];
  
  const colIndex = (name) => headers.indexOf(name);
  const dateIdx = colIndex('transaction_date');
  const txIdIdx = colIndex('transaction_id');
  const prodNameIdx = colIndex('product_name');
  const catIdx = colIndex('category');
  const qtyIdx = colIndex('quantity');
  const discIdx = colIndex('discount_amount');
  const salesIdx = colIndex('sales_amount');
  const cogsIdx = colIndex('cogs');
  const channelIdx = colIndex('sales_channel');
  const branchIdx = colIndex('branch');
  const payMethodIdx = colIndex('payment_method');
  const membershipIdx = colIndex('membership');
  const staffNameIdx = colIndex('staff_name');
  const durationIdx = colIndex('duration_minutes');
  const visitTypeIdx = colIndex('visit_type');
  const addonIdx = colIndex('addon_product');
  const isValidIdx = colIndex('is_valid_sale');

  const list = [];
  for (let i = 4; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || row[isValidIdx] !== 1) continue;

    const transaction_date = excelDateToISOString(row[dateIdx]);

    list.push({
      transaction_date,
      transaction_id: String(row[txIdIdx] || `TX-JS-${i}`),
      product_name: row[prodNameIdx],
      category: row[catIdx],
      sales_channel: row[channelIdx] || 'Offline',
      quantity: Number(row[qtyIdx] || 0),
      sales_amount: Number(row[salesIdx] || 0),
      cogs: Number(row[cogsIdx] || 0),
      payment_method: row[payMethodIdx] === 'Tunai' ? 'Tunai' : 'E-Wallet',
      payment_provider: row[payMethodIdx] || 'Tunai',
      shipping_courier: '',
      shipping_fee: 0,
      promo_code: Number(row[discIdx]) > 0 ? 'PROMOJASA' : '',
      discount_amount: Number(row[discIdx] || 0),
      customer_type: row[membershipIdx] || 'Umum',
      table_number: '',
      variant: row[addonIdx] || 'Biasa',
      destination_city: row[branchIdx] || 'Jakarta',
      staff_name: row[staffNameIdx] || 'Terapis',
      duration_mins: Number(row[durationIdx] || 0),
      order_type: row[visitTypeIdx] || 'Walk-in'
    });
  }
  return list;
};

// 4. Marketplace / Online Shop
const parseMarketplace = () => {
  const file = 'dataset_umkm_fashion_kompleks_jan_mei_2026.xlsx';
  const workbook = XLSX.readFile(path.join(sampleFolder, file));
  const worksheet = workbook.Sheets['Data_Clean'];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  const headers = rows[3];
  
  const colIndex = (name) => headers.indexOf(name);
  const dateIdx = colIndex('transaction_date');
  const txIdIdx = colIndex('transaction_id');
  const prodNameIdx = colIndex('product_name');
  const catIdx = colIndex('category');
  const sizeIdx = colIndex('variant_size');
  const colorIdx = colIndex('variant_color');
  const qtyIdx = colIndex('quantity');
  const sellerDiscIdx = colIndex('seller_discount');
  const voucherDiscIdx = colIndex('voucher_discount');
  const salesIdx = colIndex('sales_amount');
  const cogsIdx = colIndex('cogs');
  const custIdIdx = colIndex('customer_id');
  const cityIdx = colIndex('customer_city');
  const channelIdx = colIndex('sales_channel');
  const campaignIdx = colIndex('campaign');
  const payMethodIdx = colIndex('payment_method');
  const shippingFeeIdx = colIndex('shipping_paid_by_customer');
  const isValidIdx = colIndex('is_valid_sale');

  const list = [];
  for (let i = 4; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || row[isValidIdx] !== 1) continue;

    const transaction_date = excelDateToISOString(row[dateIdx]);
    const variantStr = `${row[sizeIdx] || ''} - ${row[colorIdx] || ''}`.trim();
    const discount = Number(row[sellerDiscIdx] || 0) + Number(row[voucherDiscIdx] || 0);

    list.push({
      transaction_date,
      transaction_id: String(row[txIdIdx] || `TX-MP-${i}`),
      product_name: row[prodNameIdx],
      category: row[catIdx],
      sales_channel: row[channelIdx] || 'Shopee',
      quantity: Number(row[qtyIdx] || 0),
      sales_amount: Number(row[salesIdx] || 0),
      cogs: Number(row[cogsIdx] || 0),
      payment_method: (row[payMethodIdx] || '').toLowerCase().includes('cod') ? 'COD' : 'Transfer',
      payment_provider: row[payMethodIdx] || 'Transfer',
      shipping_courier: 'J&T Express',
      shipping_fee: Number(row[shippingFeeIdx] || 0),
      promo_code: row[campaignIdx] || '',
      discount_amount: discount,
      customer_type: getCustomerType(row[custIdIdx]),
      table_number: '',
      variant: variantStr || 'Biasa',
      destination_city: row[cityIdx] || 'Jakarta',
      staff_name: 'System',
      duration_mins: 0,
      order_type: 'Delivery'
    });
  }
  return list;
};

console.log('Starting Excel extraction with standard dashboard keys...');
const retail = parseRetail();
console.log(`Parsed Retail: ${retail.length} rows`);
const fnb = parseFnb();
console.log(`Parsed F&B: ${fnb.length} rows`);
const jasa = parseJasa();
console.log(`Parsed Jasa: ${jasa.length} rows`);
const marketplace = parseMarketplace();
console.log(`Parsed Marketplace: ${marketplace.length} rows`);

const fileContent = `// Autogenerated datasets mapping the 4 excel sheets to standard dashboard transaction layout
export interface DemoTransaction {
  transaction_date: string;
  transaction_id: string;
  product_name: string;
  category: string;
  sales_channel: string;
  quantity: number;
  sales_amount: number;
  cogs: number;
  payment_method: string;
  payment_provider: string;
  shipping_courier: string;
  shipping_fee: number;
  promo_code: string;
  discount_amount: number;
  customer_type: string;
  table_number: string;
  variant: string;
  destination_city: string;
  staff_name: string;
  duration_mins: number;
  order_type: string;
}

export const retailDemoData: DemoTransaction[] = ${JSON.stringify(retail, null, 2)};
export const fnbDemoData: DemoTransaction[] = ${JSON.stringify(fnb, null, 2)};
export const jasaDemoData: DemoTransaction[] = ${JSON.stringify(jasa, null, 2)};
export const marketplaceDemoData: DemoTransaction[] = ${JSON.stringify(marketplace, null, 2)};
`;

fs.writeFileSync('src/constants/demoDatasets.ts', fileContent);
console.log('Saved src/constants/demoDatasets.ts successfully!');
