/**
 * CSV parsing and generation utility
 */

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
