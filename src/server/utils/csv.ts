/**
 * Spreadsheet (Excel .xlsx / .xls & CSV) parsing and generation utility
 */
import * as XLSX from 'xlsx';

export function parseCSV(text: string): Record<string, string>[] {
  // Strip BOM if present
  let cleanText = text;
  if (cleanText.charCodeAt(0) === 0xFEFF) {
    cleanText = cleanText.slice(1);
  }

  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentLine += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip LF after CR
      }
      if (currentLine.trim().length > 0) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }

  if (currentLine.trim().length > 0) {
    lines.push(currentLine);
  }

  if (lines.length < 2) return [];

  // Parse headers
  const headers = splitCSVRow(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVRow(lines[i]);
    const rowObj: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      const headerKey = headers[j]?.trim() || `col_${j}`;
      rowObj[headerKey] = values[j] !== undefined ? values[j].trim() : '';
    }
    rows.push(rowObj);
  }

  return rows;
}

function splitCSVRow(rowStr: string): string[] {
  const values: string[] = [];
  let currentValue = '';
  let inQuotes = false;

  for (let i = 0; i < rowStr.length; i++) {
    const char = rowStr[i];
    const nextChar = rowStr[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentValue += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(currentValue);
      currentValue = '';
    } else {
      currentValue += char;
    }
  }

  values.push(currentValue);
  return values;
}

export function parseSpreadsheetBuffer(buffer: ArrayBuffer, fileName: string): Record<string, string>[] {
  const isCsv = fileName.toLowerCase().endsWith('.csv');
  
  if (isCsv) {
    const decoder = new TextDecoder('utf-8');
    const text = decoder.decode(buffer);
    return parseCSV(text);
  }

  // Parse using XLSX library for .xlsx and .xls
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });

  return rawRows.map(row => {
    const formatted: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) {
      formatted[k.trim()] = typeof v === 'string' ? v.trim() : (v !== null && v !== undefined ? String(v).trim() : '');
    }
    return formatted;
  });
}

export function generateSampleEmployeeCSV(): string {
  const headers = ['Emp_id', 'emp_name', 'place', 'team_name', 'email_id', 'team leader mail', 'team leader name'];
  const sampleRows = [
    ['EMP1001', 'Aditi Sharma', 'Chennai', 'Alpha Innovators', 'aditi.sharma@example.com', 'aditi.sharma@example.com', 'Aditi Sharma'],
    ['EMP1002', 'Rohan Verma', 'Chennai', 'Alpha Innovators', 'rohan.verma@example.com', 'aditi.sharma@example.com', 'Aditi Sharma'],
    ['EMP1003', 'Sneha Patel', 'Bengaluru', 'Alpha Innovators', 'sneha.patel@example.com', 'aditi.sharma@example.com', 'Aditi Sharma'],
    ['EMP2001', 'Karthik Raja', 'Coimbatore', 'Code Pioneers', 'karthik.raja@example.com', 'karthik.raja@example.com', 'Karthik Raja'],
    ['EMP2002', 'Pooja Nair', 'Coimbatore', 'Code Pioneers', 'pooja.nair@example.com', 'karthik.raja@example.com', 'Karthik Raja'],
    ['EMP1002', 'Rohan Verma', 'Chennai', 'Beta Disruptors', 'rohan.verma@example.com', 'vikram.singh@example.com', 'Vikram Singh']
  ];

  return [
    headers.join(','),
    ...sampleRows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
  ].join('\r\n');
}

export function generateSampleEmployeeExcel(): Uint8Array {
  const headers = ['Emp_id', 'emp_name', 'place', 'team_name', 'email_id', 'team leader mail', 'team leader name'];
  const sampleRows = [
    {
      'Emp_id': 'EMP1001',
      'emp_name': 'Aditi Sharma',
      'place': 'Chennai',
      'team_name': 'Alpha Innovators',
      'email_id': 'aditi.sharma@example.com',
      'team leader mail': 'aditi.sharma@example.com',
      'team leader name': 'Aditi Sharma'
    },
    {
      'Emp_id': 'EMP1002',
      'emp_name': 'Rohan Verma',
      'place': 'Chennai',
      'team_name': 'Alpha Innovators',
      'email_id': 'rohan.verma@example.com',
      'team leader mail': 'aditi.sharma@example.com',
      'team leader name': 'Aditi Sharma'
    },
    {
      'Emp_id': 'EMP1003',
      'emp_name': 'Sneha Patel',
      'place': 'Bengaluru',
      'team_name': 'Alpha Innovators',
      'email_id': 'sneha.patel@example.com',
      'team leader mail': 'aditi.sharma@example.com',
      'team leader name': 'Aditi Sharma'
    },
    {
      'Emp_id': 'EMP2001',
      'emp_name': 'Karthik Raja',
      'place': 'Coimbatore',
      'team_name': 'Code Pioneers',
      'email_id': 'karthik.raja@example.com',
      'team leader mail': 'karthik.raja@example.com',
      'team leader name': 'Karthik Raja'
    },
    {
      'Emp_id': 'EMP2002',
      'emp_name': 'Pooja Nair',
      'place': 'Coimbatore',
      'team_name': 'Code Pioneers',
      'email_id': 'pooja.nair@example.com',
      'team leader mail': 'karthik.raja@example.com',
      'team leader name': 'Karthik Raja'
    },
    {
      'Emp_id': 'EMP1002',
      'emp_name': 'Rohan Verma',
      'place': 'Chennai',
      'team_name': 'Beta Disruptors',
      'email_id': 'rohan.verma@example.com',
      'team leader mail': 'vikram.singh@example.com',
      'team leader name': 'Vikram Singh'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleRows, { header: headers });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Teams');
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(buffer);
}
