import { useState, useMemo } from 'react'
import {
  getRoomDepartment, extractAssetCode,
  formatDateTH, formatShipDate, getCurrentYearBE
} from '../utils/departmentMapping'
import { exportWarrantyExcel } from '../utils/exportExcel'

function groupByDepartment(computers) {
  const map = {}
  computers.forEach(c => {
    const dept = getRoomDepartment(c.room)
    if (!map[dept]) map[dept] = []
    map[dept].push(c)
  })
  return map
}

function ReportTable({ items, dept, index }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
      <thead>
        <tr style={{ background: '#1e3a5f', color: 'white' }}>
          {['ลำดับ', 'ชื่อเครื่อง', 'ชื่อผู้ใช้', 'โมเดล', 'Service Tag',
            'รหัสทรัพย์สิน', 'วันผลิต', 'วันหมดอายุ', 'ห้อง', 'หมายเหตุ'].map(h => (
            <th key={h} style={{ border: '1px solid #ccc', padding: '5px 8px', textAlign: 'center', whiteSpace: 'nowrap' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map((c, i) => (
          <tr key={c.id} style={{ background: i % 2 === 0 ? '#fff' : '#f5f8ff' }}>
            <td style={{ border: '1px solid #ddd', padding: '4px 8px', textAlign: 'center' }}>{i + 1}</td>
            <td style={{ border: '1px solid #ddd', padding: '4px 8px' }}>{c.hostname}</td>
            <td style={{ border: '1px solid #ddd', padding: '4px 8px' }}>{c.lastUser.split('\\')[1] || c.lastUser}</td>
            <td style={{ border: '1px solid #ddd', padding: '4px 8px' }}>{c.model}</td>
            <td style={{ border: '1px solid #ddd', padding: '4px 8px', textAlign: 'center' }}>{c.serial}</td>
            <td style={{ border: '1px solid #ddd', padding: '4px 8px', textAlign: 'center' }}>{extractAssetCode(c.assetsTag)}</td>
            <td style={{ border: '1px solid #ddd', padding: '4px 8px', textAlign: 'center' }}>{formatShipDate(c.shipDate)}</td>
            <td style={{ border: '1px solid #ddd', padding: '4px 8px', textAlign: 'center' }}>{formatDateTH(c.warrantyExp)}</td>
            <td style={{ border: '1px solid #ddd', padding: '4px 8px', textAlign: 'center' }}>{c.room}</td>
            <td style={{ border: '1px solid #ddd', padding: '4px 8px' }}>{c.notes}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function WarrantyReport({ computers, onBack }) {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filtered, setFiltered] = useState([])
  const [hasFiltered, setHasFiltered] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const currentYearBE = getCurrentYearBE()

  const handleFilter = () => {
    let result = computers
    if (dateFrom) result = result.filter(c => c.warrantyExp && new Date(c.warrantyExp) >= new Date(dateFrom))
    if (dateTo) {
      const end = new Date(dateTo)
      end.setHours(23, 59, 59, 999)
      result = result.filter(c => c.warrantyExp && new Date(c.warrantyExp) <= end)
    }
    setFiltered(result)
    setHasFiltered(true)
  }

  const handleClear = () => {
    setDateFrom('')
    setDateTo('')
    setFiltered([])
    setHasFiltered(false)
    setSearchQ('')
  }

  // base = date-filtered if date filter applied, else all computers
  const baseData = hasFiltered ? filtered : computers

  const searchFiltered = useMemo(() => {
    const q = searchQ.trim().toLowerCase()
    if (!q) return baseData
    return baseData.filter(c =>
      c.hostname?.toLowerCase().includes(q) ||
      c.lastUser?.toLowerCase().includes(q) ||
      c.model?.toLowerCase().includes(q) ||
      c.room?.toLowerCase().includes(q) ||
      c.serial?.toLowerCase().includes(q) ||
      getRoomDepartment(c.room)?.toLowerCase().includes(q)
    )
  }, [baseData, searchQ])

  const showResults = hasFiltered || searchQ.trim().length > 0

  const grouped = useMemo(() => groupByDepartment(searchFiltered), [searchFiltered])
  const deptEntries = Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0], 'th'))

  const handlePrint = () => {
    const html = `
<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<title>รายงาน Warranty หมดอายุ</title>
<style>
  * { font-family: 'TH SarabunPSK', 'Sarabun', 'THSarabunNew', Arial, sans-serif;
      color: #000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; padding: 0; font-size: 12pt; background: #fff; }
  .page { padding: 15mm 12mm; page-break-after: always; }
  .page:last-child { page-break-after: avoid; }
  h1 { text-align: center; font-size: 16pt; font-weight: bold; margin: 0 0 10px; color: #000 !important; }
  .subtitle { margin-bottom: 4px; font-size: 12pt; color: #000 !important; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10pt; }
  th { background: #fff !important; color: #000 !important; border: 1px solid #555;
       padding: 5px 8px; text-align: center; white-space: nowrap; font-weight: bold; }
  td { border: 1px solid #999; padding: 4px 8px; color: #000 !important; background: #fff !important; }
  a { color: #000 !important; text-decoration: none; }
  .footer-note { margin-top: 12px; font-size: 10pt; color: #000 !important; font-style: italic; }
  .signature { margin-top: 28px; text-align: right; font-size: 12pt; color: #000 !important; }
  @page { size: A4 landscape; margin: 8mm; }
</style>
</head>
<body>
${deptEntries.map(([dept, items]) => `
  <div class="page">
    <h1>รายงานเครื่องคอมพิวเตอร์ที่หมดอายุการใช้งาน ประจำปี ${currentYearBE}</h1>
    <div class="subtitle">เรียน ฝ่าย${dept}</div>
    <div class="subtitle">เรื่อง แจ้งคอมพิวเตอร์ที่หมดอายุการใช้งาน จำนวน ${items.length} เครื่อง รายละเอียดตามตาราง</div>
    <table>
      <thead>
        <tr>
          ${['ลำดับ','ชื่อเครื่อง','ชื่อผู้ใช้','โมเดล','Service Tag','รหัสทรัพย์สิน','วันผลิต','วันหมดอายุ','ห้อง','หมายเหตุ']
            .map(h => `<th>${h}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${items.map((c, i) => `
          <tr>
            <td style="text-align:center">${i + 1}</td>
            <td>${c.hostname}</td>
            <td>${c.lastUser.split('\\\\')[1] || c.lastUser}</td>
            <td>${c.model}</td>
            <td style="text-align:center">${c.serial}</td>
            <td style="text-align:center">${extractAssetCode(c.assetsTag)}</td>
            <td style="text-align:center">${formatShipDate(c.shipDate)}</td>
            <td style="text-align:center">${formatDateTH(c.warrantyExp)}</td>
            <td style="text-align:center">${c.room}</td>
            <td>${c.notes || ''}</td>
          </tr>`).join('')}
      </tbody>
    </table>
    <div class="footer-note">หมายเหตุ : หากมีข้อสงสัย กรุณาติดต่อฝ่าย ICT</div>
    <div class="signature">
      ลงชื่อผู้รายงาน ...................................................<br/>
      (........../........../..........)
    </div>
  </div>`).join('')}
</body>
</html>`
    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print() }, 600)
  }

  const handleExportExcel = async () => {
    setExporting(true)
    try {
      await exportWarrantyExcel(searchFiltered, deptEntries, currentYearBE)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-3xl">📋</span> รายงาน Warranty หมดอายุ
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">พิมพ์รายงานและ Export Excel แยกตามฝ่าย</p>
        </div>
        <button onClick={onBack} className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 flex items-center gap-2">
          🏠 กลับหน้าหลัก
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
        {/* Row 1: date filters + buttons */}
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">วันหมดอายุเริ่มต้น:</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-44"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">วันหมดอายุสิ้นสุด:</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-44"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleFilter}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 flex items-center gap-2 shadow-sm"
            >
              🔍 กรองข้อมูล
            </button>
            <button
              onClick={handlePrint}
              disabled={!showResults || searchFiltered.length === 0}
              className="px-5 py-2.5 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 flex items-center gap-2 shadow-sm disabled:opacity-40"
            >
              🖨 พิมพ์รายงานแยกตามห้อง
            </button>
            <button
              onClick={handleExportExcel}
              disabled={!showResults || searchFiltered.length === 0 || exporting}
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-medium text-sm hover:bg-emerald-700 flex items-center gap-2 shadow-sm disabled:opacity-40"
            >
              {exporting
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> กำลัง Export...</>
                : '📊 Export Excel'}
            </button>
            <button
              onClick={handleClear}
              className="px-5 py-2.5 border border-gray-300 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-50"
            >
              ล้างค่า
            </button>
          </div>
        </div>

        {/* Row 2: search — แสดงตลอด ใช้ได้ทั้งแบบค้นหาเดี่ยวหรือร่วมกับกรองวันที่ */}
        <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="ค้นหาชื่อเครื่อง, ผู้ใช้, โมเดล, ห้อง, ฝ่าย, Serial..."
              className="w-full border border-gray-300 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          {searchQ && (
            <button onClick={() => setSearchQ('')} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1">
              ✕ ล้าง
            </button>
          )}
          {showResults && (
            <span className="text-sm text-gray-400 shrink-0">
              แสดง <span className="font-semibold text-gray-700">{searchFiltered.length}</span>
              {searchQ && hasFiltered ? ` / ${filtered.length}` : ''} เครื่อง
            </span>
          )}
        </div>
      </div>

      {/* Result summary */}
      {showResults && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-blue-600 text-white rounded-2xl p-4 col-span-2">
            <div className="text-sm opacity-80">พบเครื่องทั้งหมด</div>
            <div className="text-4xl font-bold mt-1">{searchFiltered.length} เครื่อง</div>
            <div className="text-xs opacity-60 mt-1">
              จาก {deptEntries.length} ฝ่าย{searchQ ? ` (กรองจาก ${filtered.length} เครื่อง)` : ''}
            </div>
          </div>
          {deptEntries.slice(0, 6).map(([dept, items]) => (
            <div key={dept} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <div className="text-xs text-gray-500 truncate">{dept}</div>
              <div className="text-2xl font-bold text-gray-800 mt-1">{items.length}</div>
              <div className="text-xs text-gray-400">เครื่อง</div>
            </div>
          ))}
        </div>
      )}

      {/* Preview tables per department */}
      {showResults && searchFiltered.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center text-gray-400">
          <div className="text-4xl mb-3">🔍</div>
          <p className="font-medium">{searchQ ? `ไม่พบเครื่องที่ตรงกับ "${searchQ}"` : 'ไม่พบเครื่องในช่วงวันที่ที่เลือก'}</p>
          <p className="text-sm mt-1">{searchQ ? 'ลองค้นหาด้วยคำอื่น' : 'ลองเปลี่ยนช่วงวันที่ใหม่'}</p>
        </div>
      )}

      {showResults && searchFiltered.length > 0 && (
        <div className="space-y-6">
          {deptEntries.map(([dept, items], idx) => (
            <div key={dept} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Dept header */}
              <div className="bg-[#1e3a5f] text-white px-6 py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-lg">ฝ่าย{dept}</span>
                  <span className="ml-3 text-sm opacity-70">{items.length} เครื่อง</span>
                </div>
                <span className="bg-white/20 text-xs px-3 py-1 rounded-full">ประจำปี {currentYearBE}</span>
              </div>
              {/* Memo line */}
              <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 text-sm text-gray-600">
                <span className="font-medium">เรียน</span> ฝ่าย{dept} &nbsp;|&nbsp;
                <span className="font-medium">เรื่อง</span> แจ้งคอมพิวเตอร์ที่หมดอายุการใช้งาน จำนวน <strong>{items.length}</strong> เครื่อง รายละเอียดตามตาราง
              </div>
              {/* Table */}
              <div className="overflow-x-auto">
                <ReportTable items={items} dept={dept} index={idx} />
              </div>
              {/* Footer */}
              <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span>หมายเหตุ : หากมีข้อสงสัย กรุณาติดต่อฝ่าย ICT</span>
                <span>ลงชื่อผู้รายงาน ..................................................</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!hasFiltered && (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center text-gray-400">
          <div className="text-5xl mb-4">📅</div>
          <p className="font-medium text-gray-500">เลือกช่วงวันหมดอายุแล้วกด "กรองข้อมูล"</p>
          <p className="text-sm mt-2">ระบบจะแสดงรายงานแยกตามฝ่าย พร้อมพิมพ์และ Export Excel ได้ทันที</p>
        </div>
      )}
    </div>
  )
}
