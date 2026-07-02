import ExcelJS from 'exceljs'
import { getRoomDepartment, extractAssetCode, formatDateTH, formatShipDate } from './departmentMapping'

const NAVY      = 'FF1E3A5F'
const WHITE     = 'FFFFFFFF'
const BLACK     = 'FF000000'
const GRAY_BDR  = 'FF9CA3AF'

// คอลัมน์สำหรับ sheet รายฝ่าย (ไม่มี ฝ่าย)
const DEPT_COLS = [
  { header: 'ลำดับ',         width: 8  },
  { header: 'ชื่อเครื่อง',   width: 24 },
  { header: 'ชื่อผู้ใช้',    width: 20 },
  { header: 'โมเดล',         width: 30 },
  { header: 'Service Tag',    width: 14 },
  { header: 'รหัสทรัพย์สิน', width: 16 },
  { header: 'วันผลิต',       width: 14 },
  { header: 'วันหมดอายุ',    width: 14 },
  { header: 'ห้อง',          width: 16 },
  { header: 'หมายเหตุ',      width: 22 },
]
const DEPT_LAST = 'J'   // 10 columns A–J

// คอลัมน์สำหรับ sheet ทั้งหมด (มีคอลัมน์ ฝ่าย)
const ALL_COLS = [
  ...DEPT_COLS.slice(0, 9),              // A–I เหมือนกัน
  { header: 'ฝ่าย',     width: 26 },    // J
  { header: 'หมายเหตุ', width: 22 },    // K
]
const ALL_LAST = 'K'

// ---- style helpers ----

const BORDER_THIN = (argb = GRAY_BDR) => ({
  top:    { style: 'thin', color: { argb } },
  bottom: { style: 'thin', color: { argb } },
  left:   { style: 'thin', color: { argb } },
  right:  { style: 'thin', color: { argb } },
})

function styleHeaderRow(row) {
  row.height = 22
  row.eachCell({ includeEmpty: true }, cell => {
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: WHITE } }
    cell.font      = { bold: true, color: { argb: BLACK }, size: 11, name: 'TH SarabunPSK' }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border    = BORDER_THIN()
  })
}

function styleDataRow(row) {
  row.height = 18
  row.eachCell({ includeEmpty: true }, cell => {
    cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: WHITE } }
    cell.font   = { size: 11, name: 'TH SarabunPSK', color: { argb: BLACK } }
    cell.border = BORDER_THIN()
  })
}

// ---- row data builders ----

function toDeptRowData(c, i) {
  return [
    i + 1,
    c.hostname,
    c.lastUser.split('\\')[1] || c.lastUser,
    c.model,
    c.serial,
    extractAssetCode(c.assetsTag),
    formatShipDate(c.shipDate),
    formatDateTH(c.warrantyExp),
    c.room,
    c.notes || '',
  ]
}

function toAllRowData(c, i) {
  return [
    i + 1,
    c.hostname,
    c.lastUser.split('\\')[1] || c.lastUser,
    c.model,
    c.serial,
    extractAssetCode(c.assetsTag),
    formatShipDate(c.shipDate),
    formatDateTH(c.warrantyExp),
    c.room,
    getRoomDepartment(c.room),
    c.notes || '',
  ]
}

// center columns by 1-based index
const CENTER_COLS_DEPT = [1, 5, 6, 7, 8, 9]  // ลำดับ, Serial, Asset, วันผลิต, วันหมดอายุ, ห้อง
const CENTER_COLS_ALL  = [1, 5, 6, 7, 8, 9]

function applyCenterAlign(row, cols) {
  cols.forEach(i => {
    row.getCell(i).alignment = { horizontal: 'center', vertical: 'middle' }
  })
}

// ---- sheet builders ----

function addDeptSheet(wb, dept, items, yearBE) {
  const safeName = dept.replace(/[\\/:*?[\]]/g, '-').substring(0, 31)
  const ws = wb.addWorksheet(safeName)
  ws.columns = DEPT_COLS.map(c => ({ width: c.width }))

  // Row 1: Title – navy bg, white text, merged
  ws.mergeCells(`A1:${DEPT_LAST}1`)
  const t = ws.getCell('A1')
  t.value     = `รายงานเครื่องคอมพิวเตอร์ที่หมดอายุการใช้งาน ประจำปี ${yearBE}`
  t.font      = { bold: true, size: 16, color: { argb: BLACK }, name: 'TH SarabunPSK' }
  t.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(1).height = 32

  // Row 2: spacer
  ws.getRow(2).height = 4

  // Row 3: เรียน
  ws.mergeCells(`A3:${DEPT_LAST}3`)
  const r3 = ws.getCell('A3')
  r3.value = `เรียน  ฝ่าย${dept}`
  r3.font  = { size: 13, name: 'TH SarabunPSK', color: { argb: BLACK } }
  ws.getRow(3).height = 20

  // Row 4: เรื่อง
  ws.mergeCells(`A4:${DEPT_LAST}4`)
  const r4 = ws.getCell('A4')
  r4.value = `เรื่อง  แจ้งคอมพิวเตอร์ที่หมดอายุการใช้งาน จำนวน ${items.length} เครื่อง รายละเอียดตามตาราง`
  r4.font  = { size: 13, name: 'TH SarabunPSK', color: { argb: BLACK } }
  ws.getRow(4).height = 20

  // Row 5: spacer
  ws.getRow(5).height = 4

  // Row 6: headers
  const hRow = ws.addRow(DEPT_COLS.map(c => c.header))
  styleHeaderRow(hRow)

  // Data rows (start row 7)
  items.forEach((c, i) => {
    const row = ws.addRow(toDeptRowData(c, i))
    styleDataRow(row)
    applyCenterAlign(row, CENTER_COLS_DEPT)
  })

  const noteRow = 6 + items.length + 2
  ws.getRow(noteRow - 1).height = 6

  // หมายเหตุ
  ws.mergeCells(`A${noteRow}:${DEPT_LAST}${noteRow}`)
  const note = ws.getCell(`A${noteRow}`)
  note.value = 'หมายเหตุ : หากมีข้อสงสัย กรุณาติดต่อฝ่าย ICT'
  note.font  = { size: 12, italic: true, name: 'TH SarabunPSK', color: { argb: 'FF4B5563' } }
  ws.getRow(noteRow).height = 20

  // Signature block
  const sigRow = noteRow + 3
  ws.getRow(sigRow - 2).height = 8
  ws.getRow(sigRow - 1).height = 8

  const sigCols = `F${sigRow}:${DEPT_LAST}${sigRow}`
  ws.mergeCells(sigCols)
  const sig = ws.getCell(`F${sigRow}`)
  sig.value     = 'ลงชื่อผู้รายงาน ...................................................'
  sig.font      = { size: 12, name: 'TH SarabunPSK', color: { argb: BLACK } }
  sig.alignment = { horizontal: 'right' }
  ws.getRow(sigRow).height = 22

  ws.mergeCells(`F${sigRow + 1}:${DEPT_LAST}${sigRow + 1}`)
  const dt = ws.getCell(`F${sigRow + 1}`)
  dt.value     = '(.........../.........../...........)'
  dt.font      = { size: 12, name: 'TH SarabunPSK', color: { argb: BLACK } }
  dt.alignment = { horizontal: 'right' }
  ws.getRow(sigRow + 1).height = 22

  ws.pageSetup = {
    paperSize: 9,
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 },
  }
}

function addAllSheet(wb, allData) {
  const ws = wb.addWorksheet('ทั้งหมด')
  ws.columns = ALL_COLS.map(c => ({ width: c.width }))

  const hRow = ws.addRow(ALL_COLS.map(c => c.header))
  styleHeaderRow(hRow)

  allData.forEach((c, i) => {
    const row = ws.addRow(toAllRowData(c, i))
    styleDataRow(row)
    applyCenterAlign(row, CENTER_COLS_ALL)
  })

  ws.pageSetup = {
    paperSize: 9,
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  }
}

// ---- main export ----

export async function exportWarrantyExcel(filtered, deptEntries, yearBE) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'IT Asset Management'

  addAllSheet(wb, filtered)

  deptEntries.forEach(([dept, items]) => {
    addDeptSheet(wb, dept, items, yearBE)
  })

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `warranty_report_${yearBE}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
