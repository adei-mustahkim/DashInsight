import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const folder = 'sample data exel';
const files = fs.readdirSync(folder).filter(f => f.endsWith('.xlsx'));

files.forEach(file => {
  const filePath = path.join(folder, file);
  try {
    const workbook = XLSX.readFile(filePath);
    console.log(`\n=========================================`);
    console.log(`File: ${file}`);
    console.log(`Sheets:`, workbook.SheetNames);
    
    const targetSheet = workbook.SheetNames.includes('Data_Clean') ? 'Data_Clean' : workbook.SheetNames[0];
    const worksheet = workbook.Sheets[targetSheet];
    if (worksheet) {
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      console.log(`Target Sheet: ${targetSheet}`);
      console.log(`Total Rows: ${rows.length}`);
      
      // Let's search for headers row (row containing transaction_date or product_name or sales_amount)
      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(10, rows.length); i++) {
        const row = rows[i];
        if (row && (row.includes('transaction_date') || row.includes('product_name') || row.includes('sales_amount'))) {
          headerRowIndex = i;
          break;
        }
      }
      
      if (headerRowIndex !== -1) {
        console.log(`Headers found at row index ${headerRowIndex}:`, rows[headerRowIndex]);
      } else {
        console.log(`Headers NOT found in first 10 rows. First 5 rows:`);
        for (let i = 0; i < Math.min(5, rows.length); i++) {
          console.log(`Row ${i}:`, rows[i]);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading ${file}:`, error);
  }
});
