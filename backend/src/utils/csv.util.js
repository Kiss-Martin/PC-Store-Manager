// Simple CSV generator utilities
export function escapeCsvValue(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export function generateCsvFromObjects(columns, rows) {
  // columns: array of { key, label }
  const header = columns.map((c) => escapeCsvValue(c.label)).join(',') + '\n';
  const lines = rows.map((row) =>
    columns.map((c) => escapeCsvValue(row[c.key])).join(',')
  );
  return '\uFEFF' + header + lines.join('\n');
}
