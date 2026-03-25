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

    console.log(`\n==========================================`);
    console.log(`FILE: ${filename}`);
    console.log(`==========================================`);

    try {
        const workbook = XLSX.readFile(filePath);
        console.log('SHEETS:', workbook.SheetNames);

        workbook.SheetNames.forEach(sheetName => {
            console.log(`\n  --- Sheet: ${sheetName} ---`);
            const sheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            if (data.length > 0) {
                console.log('  Headers (Row 0):', data[0]);
                if (data.length > 1) console.log('  Row 1:', data[1]);
                console.log(`  Total Rows: ${data.length}`);
            } else {
                console.log('  (Empty Sheet)');
            }
        });
    } catch (e: any) {
        console.log(`  Error reading file: ${e.message}`);
    }
}

const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.xlsx') || f.endsWith('.csv'));

files.forEach(f => inspectFile(f));
