import fs from 'fs';
import path from 'path';
import * as readline from 'readline';

const dataDir = path.join(process.cwd(), 'data');

async function inspectCsv(filename: string) {
    const filePath = path.join(dataDir, filename);
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filename}`);
        return;
    }

    console.log(`\n--- Inspecting ${filename} ---`);

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let lineCount = 0;
    for await (const line of rl) {
        if (lineCount < 5) {
            console.log(`Line ${lineCount}: ${line}`);
        }
        lineCount++;
    }
}

// Inspect one of the PMIX files
inspectCsv('pmix_2026_01_01-2026_01_31.csv');
inspectCsv('Jan 18 2026 11_04 PM (1).csv');
