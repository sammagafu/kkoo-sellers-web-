/**
 * CSV export, import and template download utilities for list views.
 */

export interface CsvColumn {
  key: string
  label: string
  /** Omit from export (e.g. actions); include in template as header only */
  export?: boolean
}

/** Escape a cell for CSV (RFC 4180 style) */
function escapeCell(value: unknown): string {
  if (value == null) return ''
  const s = String(value)
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

/** Export rows to CSV and trigger download */
export function exportToCsv(
  rows: Record<string, unknown>[],
  columns: CsvColumn[],
  filename: string
): void {
  const exportCols = columns.filter((c) => c.export !== false && c.key !== 'actions')
  const header = exportCols.map((c) => escapeCell(c.label)).join(',')
  const lines = [header]
  for (const row of rows) {
    const cells = exportCols.map((col) => escapeCell(row[col.key]))
    lines.push(cells.join(','))
  }
  const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename || 'export.csv'
  link.click()
  URL.revokeObjectURL(link.href)
}

/** Build CSV template content (header + optional sample row) and trigger download */
export function downloadCsvTemplate(
  columns: CsvColumn[],
  filename: string,
  sampleRow?: Record<string, string>
): void {
  const exportCols = columns.filter((c) => c.key !== 'actions')
  const header = exportCols.map((c) => escapeCell(c.label)).join(',')
  const lines = [header]
  if (sampleRow) {
    const cells = exportCols.map((col) => escapeCell(sampleRow[col.key] ?? ''))
    lines.push(cells.join(','))
  }
  const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename || 'template.csv'
  link.click()
  URL.revokeObjectURL(link.href)
}

/** Parse CSV file (simple: first row = headers, then data rows) */
export function parseCsvFile(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = (reader.result as string) || ''
        const rows = parseCsvString(text)
        if (rows.length < 2) {
          resolve([])
          return
        }
        const headers = rows[0].map((h) => h.trim())
        const result: Record<string, string>[] = []
        for (let i = 1; i < rows.length; i++) {
          const obj: Record<string, string> = {}
          headers.forEach((h, j) => {
            obj[h] = rows[i][j]?.trim() ?? ''
          })
          result.push(obj)
        }
        resolve(result)
      } catch (e) {
        reject(e)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file, 'UTF-8')
  })
}

/** Parse CSV string into 2D array (handles quoted fields) */
function parseCsvString(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cell += c
      }
    } else {
      if (c === '"') {
        inQuotes = true
      } else if (c === ',' || c === '\n') {
        row.push(cell)
        cell = ''
        if (c === '\n') {
          if (row.some((s) => s.length)) rows.push(row)
          row = []
        }
      } else if (c !== '\r') {
        cell += c
      }
    }
  }
  row.push(cell)
  if (row.some((s) => s.length)) rows.push(row)
  return rows
}
