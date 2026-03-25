import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(process.cwd(), 'data');

function inspectFile(filename: string) {
    const filePath = path.join(dataDir, filename);
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filename}`);
        return;
    }

    console.log(`\n--- Inspecting ${filename} ---`);
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON to see headers and first raw
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (data.length > 0) {
        console.log('Headers:', data[0]);
        console.log('First Row:', data[1]);
    } else {
        console.log('Empty content');
    }
}

// Inspect the most likely master files
inspectFile('5Monkeys_Master_Inventory_Phase1_2.xlsx');
inspectFile('5Monkeys Inventory .xlsx');
inspectFile('Restaurant_Inventory.xlsx');
