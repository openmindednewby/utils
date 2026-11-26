import { deflateRawSync } from 'node:zlib';

import { crc32 } from '../../src/zip/createZip';
import type { CellValue } from '../../src/xlsx/xlsxRead';

export const DATA_SHEET = 'Data';

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function columnName(index: number): string {
  return String.fromCharCode('A'.charCodeAt(0) + index);
}

function cellXml(value: CellValue, ref: string, strings: string[]): string {
  if (value === null || value === '') {
    return `<c r="${ref}" s="1"/>`;
  }
  if (typeof value === 'number') {
    return `<c r="${ref}"><v>${value}</v></c>`;
  }
  strings.push(value);
  return `<c r="${ref}" t="s"><v>${strings.length - 1}</v></c>`;
}

function sheetXml(rows: CellValue[][], strings: string[]): string {
  const rowXml = rows.map((row, r) => {
    const cells = row.map((value, c) => cellXml(value, `${columnName(c)}${r + 1}`, strings));
    return cells.length === 0 ? `<row r="${r + 1}"/>` : `<row r="${r + 1}">${cells.join('')}</row>`;
  });
  return `<?xml version="1.0"?><worksheet><sheetData>${rowXml.join('')}</sheetData></worksheet>`;
}

function deflatedZip(files: Array<{ name: string; text: string }>): Uint8Array {
  const parts: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const file of files) {
    const raw = Buffer.from(file.text, 'utf8');
    const data = deflateRawSync(raw);
    const name = Buffer.from(file.name, 'utf8');
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(8, 8);
    local.writeUInt32LE(crc32(raw), 14); local.writeUInt32LE(data.length, 18); local.writeUInt32LE(raw.length, 22); local.writeUInt16LE(name.length, 26);
    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0); entry.writeUInt16LE(20, 4); entry.writeUInt16LE(20, 6); entry.writeUInt16LE(8, 10);
    entry.writeUInt32LE(crc32(raw), 16); entry.writeUInt32LE(data.length, 20); entry.writeUInt32LE(raw.length, 24); entry.writeUInt16LE(name.length, 28);
    entry.writeUInt32LE(offset, 42);
    parts.push(local, name, data);
    central.push(entry, name);
    offset += local.length + name.length + data.length;
  }
  const centralBytes = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralBytes.length, 12); end.writeUInt32LE(offset, 16);
  return new Uint8Array(Buffer.concat([...parts, centralBytes, end]));
}

export function xlsxFixture(rows: CellValue[][] = [['Date', 'Amount'], ['2026-10-01', 12.5]]): Uint8Array {
  const strings: string[] = [];
  const sheet = sheetXml(rows, strings);
  return xlsxFromSheet(sheet, strings.map((value) => `<si><t>${escapeXml(value)}</t></si>`).join(''));
}

export function xlsxFromSheet(sheet: string, shared = ''): Uint8Array {
  return deflatedZip([
    { name: 'xl/workbook.xml', text: `<workbook><sheets><sheet name="Cover" sheetId="1" r:id="rId1"/><sheet name="${DATA_SHEET}" sheetId="2" r:id="rId2"/></sheets></workbook>` },
    { name: 'xl/_rels/workbook.xml.rels', text: '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Target="/xl/worksheets/sheet2.xml"/></Relationships>' },
    { name: 'xl/worksheets/sheet1.xml', text: '<worksheet><sheetData><row r="1"><c r="A1"><v>1</v></c></row></sheetData></worksheet>' },
    { name: 'xl/worksheets/sheet2.xml', text: sheet },
    { name: 'xl/sharedStrings.xml', text: `<sst>${shared}</sst>` },
  ]);
}
