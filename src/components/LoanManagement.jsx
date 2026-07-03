import { useState, useMemo } from 'react'
import { useLoanRecords, getLoanStatus } from '../hooks/useLoanRecords'
import { useAuth } from '../contexts/AuthContext'

const STATUS_CFG = {
  active:   { label: 'กำลังยืม',   cls: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500' },
  overdue:  { label: 'เกินกำหนด',  cls: 'bg-red-100 text-red-700',     dot: 'bg-red-500' },
  returned: { label: 'คืนแล้ว',    cls: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
}

const EQUIP_TYPES = ['คอมพิวเตอร์', 'แล็ปท็อป', 'จอมอนิเตอร์', 'คีย์บอร์ด', 'เมาส์', 'อุปกรณ์เครือข่าย', 'อื่นๆ']

const TODAY = new Date().toISOString().slice(0, 10)

function fmt(d) {
  if (!d) return '-'
  const [y, m, day] = d.split('-')
  const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
  return `${parseInt(day)} ${months[parseInt(m)-1]} ${parseInt(y)+543}`
}

function diffDays(from, to) {
  const a = new Date(from), b = new Date(to)
  return Math.round((b - a) / 86400000)
}

// ── Add / Edit Modal ─────────────────────────────────────────────────────────
function LoanModal({ record, computers, onSave, onClose, currentUser }) {
  const isEdit = !!record
  const [form, setForm] = useState({
    equipmentType: record?.equipmentType || 'คอมพิวเตอร์',
    equipmentName: record?.equipmentName || '',
    serial:        record?.serial || '',
    assetTag:      record?.assetTag || '',
    borrowerName:  record?.borrowerName || '',
    borrowerDept:  record?.borrowerDept || '',
    borrowerPhone: record?.borrowerPhone || '',
    borrowDate:    record?.borrowDate || TODAY,
    dueDate:       record?.dueDate || '',
    purpose:       record?.purpose || '',
    notes:         record?.notes || '',
  })
  const [computerSearch, setComputerSearch] = useState('')
  const [showComputerList, setShowComputerList] = useState(false)
  const [errors, setErrors] = useState({})

  const filteredComputers = useMemo(() =>
    computers.filter(c =>
      !computerSearch ||
      c.hostname?.toLowerCase().includes(computerSearch.toLowerCase()) ||
      c.serial?.toLowerCase().includes(computerSearch.toLowerCase()) ||
      c.model?.toLowerCase().includes(computerSearch.toLowerCase())
    ).slice(0, 20),
  [computers, computerSearch])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const selectComputer = (c) => {
    setForm(p => ({
      ...p,
      equipmentName: `${c.model || ''} (${c.hostname || ''})`.trim(),
      serial: c.serial || '',
      assetTag: c.assetsTag || '',
    }))
    setComputerSearch(`${c.model || ''} (${c.hostname || ''})`)
    setShowComputerList(false)
  }

  const validate = () => {
    const e = {}
    if (!form.equipmentName.trim()) e.equipmentName = 'กรุณาระบุชื่ออุปกรณ์'
    if (!form.borrowerName.trim()) e.borrowerName = 'กรุณาระบุชื่อผู้ยืม'
    if (!form.borrowDate) e.borrowDate = 'กรุณาระบุวันที่ยืม'
    if (!form.dueDate) e.dueDate = 'กรุณาระบุวันกำหนดคืน'
    if (form.dueDate && form.dueDate < form.borrowDate) e.dueDate = 'วันกำหนดคืนต้องหลังวันยืม'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSave({ ...form, approvedBy: currentUser?.name || currentUser?.email })
  }

  const isComputer = form.equipmentType === 'คอมพิวเตอร์' || form.equipmentType === 'แล็ปท็อป'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800">{isEdit ? '✏️ แก้ไขรายการยืม' : '➕ เพิ่มรายการยืม'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Equipment */}
          <div className="bg-blue-50 rounded-xl p-4 space-y-4">
            <p className="text-sm font-semibold text-blue-800">🖥 ข้อมูลอุปกรณ์</p>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">ประเภทอุปกรณ์</label>
              <div className="flex flex-wrap gap-2">
                {EQUIP_TYPES.map(t => (
                  <button key={t} type="button"
                    onClick={() => { set('equipmentType', t); set('equipmentName', ''); set('serial', ''); setComputerSearch('') }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                      form.equipmentType === t
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                    }`}
                  >{t}</button>
                ))}
              </div>
            </div>

            {isComputer ? (
              <div className="relative">
                <label className="block text-sm font-medium text-gray-600 mb-1.5">เลือกเครื่อง <span className="text-red-500">*</span></label>
                <input
                  value={computerSearch}
                  onChange={e => { setComputerSearch(e.target.value); setShowComputerList(true); set('equipmentName', e.target.value) }}
                  onFocus={() => setShowComputerList(true)}
                  placeholder="ค้นหา hostname, serial, model..."
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.equipmentName ? 'border-red-400' : 'border-gray-200'}`}
                />
                {showComputerList && computerSearch && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {filteredComputers.length === 0
                      ? <p className="px-4 py-3 text-sm text-gray-400">ไม่พบเครื่อง</p>
                      : filteredComputers.map(c => (
                        <button key={c.id} type="button" onClick={() => selectComputer(c)}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 border-b border-gray-50 last:border-0">
                          <div className="font-medium text-gray-800">{c.hostname}</div>
                          <div className="text-xs text-gray-400">{c.model} · {c.serial}</div>
                        </button>
                      ))
                    }
                  </div>
                )}
                {errors.equipmentName && <p className="text-red-500 text-xs mt-1">{errors.equipmentName}</p>}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">ชื่ออุปกรณ์ <span className="text-red-500">*</span></label>
                <input value={form.equipmentName} onChange={e => set('equipmentName', e.target.value)}
                  placeholder="เช่น จอมอนิเตอร์ Dell 24 นิ้ว"
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.equipmentName ? 'border-red-400' : 'border-gray-200'}`} />
                {errors.equipmentName && <p className="text-red-500 text-xs mt-1">{errors.equipmentName}</p>}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Serial Number</label>
                <input value={form.serial} onChange={e => set('serial', e.target.value)}
                  placeholder="SN-XXXXXX"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Asset Tag</label>
                <input value={form.assetTag} onChange={e => set('assetTag', e.target.value)}
                  placeholder="TAG-XXXXXX"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
            </div>
          </div>

          {/* Borrower */}
          <div className="bg-purple-50 rounded-xl p-4 space-y-4">
            <p className="text-sm font-semibold text-purple-800">👤 ข้อมูลผู้ยืม</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
                <input value={form.borrowerName} onChange={e => set('borrowerName', e.target.value)}
                  placeholder="ชื่อผู้ยืม"
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 ${errors.borrowerName ? 'border-red-400' : 'border-gray-200'}`} />
                {errors.borrowerName && <p className="text-red-500 text-xs mt-1">{errors.borrowerName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">ฝ่าย / แผนก</label>
                <input value={form.borrowerDept} onChange={e => set('borrowerDept', e.target.value)}
                  placeholder="เช่น ฝ่ายบัญชี"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">เบอร์โทร</label>
                <input value={form.borrowerPhone} onChange={e => set('borrowerPhone', e.target.value)}
                  placeholder="081-xxx-xxxx"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">วัตถุประสงค์</label>
                <input value={form.purpose} onChange={e => set('purpose', e.target.value)}
                  placeholder="เช่น ใช้งานชั่วคราว, ซ่อมเครื่อง"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-green-50 rounded-xl p-4 space-y-4">
            <p className="text-sm font-semibold text-green-800">📅 วันที่</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">วันที่ยืม <span className="text-red-500">*</span></label>
                <input type="date" value={form.borrowDate} onChange={e => set('borrowDate', e.target.value)}
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${errors.borrowDate ? 'border-red-400' : 'border-gray-200'}`} />
                {errors.borrowDate && <p className="text-red-500 text-xs mt-1">{errors.borrowDate}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">กำหนดคืน <span className="text-red-500">*</span></label>
                <input type="date" value={form.dueDate} min={form.borrowDate} onChange={e => set('dueDate', e.target.value)}
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${errors.dueDate ? 'border-red-400' : 'border-gray-200'}`} />
                {errors.dueDate && <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">หมายเหตุ</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
                placeholder="บันทึกเพิ่มเติม..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 transition">
              ยกเลิก
            </button>
            <button type="submit"
              className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-700 transition">
              {isEdit ? 'บันทึกการแก้ไข' : 'บันทึกรายการยืม'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Return Modal ─────────────────────────────────────────────────────────────
function ReturnModal({ record, onConfirm, onClose }) {
  const [returnDate, setReturnDate] = useState(TODAY)
  const [notes, setNotes] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">✅ บันทึกการคืนอุปกรณ์</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-700">{record.equipmentName}</p>
            <p className="text-xs text-gray-400 mt-0.5">ผู้ยืม: {record.borrowerName} · {record.borrowerDept}</p>
            {record.serial && <p className="text-xs text-gray-400">Serial: {record.serial}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">วันที่คืนจริง</label>
            <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} max={TODAY}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">หมายเหตุการคืน</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="สภาพอุปกรณ์, หมายเหตุ..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 transition">
              ยกเลิก
            </button>
            <button onClick={() => onConfirm(returnDate, notes)}
              className="flex-1 bg-green-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-green-700 transition">
              ยืนยันการคืน
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function LoanManagement({ computers = [], readOnly = false }) {
  const { records, addRecord, updateRecord, returnRecord, deleteRecord } = useLoanRecords()
  const { currentUser } = useAuth()

  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editRecord, setEditRecord] = useState(null)
  const [returnRec, setReturnRec] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  // Stats
  const stats = useMemo(() => {
    const now = new Date(); now.setHours(0,0,0,0)
    const thisMonth = now.toISOString().slice(0,7)
    let active = 0, overdue = 0, returnedMonth = 0
    records.forEach(r => {
      const s = getLoanStatus(r)
      if (s === 'active') active++
      else if (s === 'overdue') overdue++
      else if (s === 'returned' && r.returnDate?.startsWith(thisMonth)) returnedMonth++
    })
    return { active, overdue, returnedMonth }
  }, [records])

  // Filtered records
  const filtered = useMemo(() => {
    return records
      .filter(r => {
        const s = getLoanStatus(r)
        if (filter !== 'all' && s !== filter) return false
        if (search) {
          const q = search.toLowerCase()
          return (
            r.equipmentName?.toLowerCase().includes(q) ||
            r.borrowerName?.toLowerCase().includes(q) ||
            r.borrowerDept?.toLowerCase().includes(q) ||
            r.serial?.toLowerCase().includes(q)
          )
        }
        return true
      })
      .sort((a, b) => {
        // active/overdue first, then by date desc
        const sa = getLoanStatus(a), sb = getLoanStatus(b)
        if (sa !== sb) {
          const order = { overdue: 0, active: 1, returned: 2 }
          return order[sa] - order[sb]
        }
        return new Date(b.borrowDate) - new Date(a.borrowDate)
      })
  }, [records, filter, search])

  const handleSave = (data) => {
    if (editRecord) updateRecord(editRecord.id, data)
    else addRecord(data)
    setShowModal(false)
    setEditRecord(null)
  }

  const handleReturn = (returnDate, notes) => {
    returnRecord(returnRec.id, returnDate)
    if (notes) updateRecord(returnRec.id, { returnNotes: notes })
    setReturnRec(null)
  }

  const openEdit = (r) => { setEditRecord(r); setShowModal(true) }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs font-medium text-blue-600 opacity-80">กำลังยืมอยู่</p>
          <p className="text-3xl font-bold text-blue-700 mt-1">{stats.active}</p>
          <p className="text-xs text-blue-500 mt-1">รายการ</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs font-medium text-red-600 opacity-80">เกินกำหนด</p>
          <p className="text-3xl font-bold text-red-700 mt-1">{stats.overdue}</p>
          <p className="text-xs text-red-500 mt-1">รายการ</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs font-medium text-green-600 opacity-80">คืนแล้วเดือนนี้</p>
          <p className="text-3xl font-bold text-green-700 mt-1">{stats.returnedMonth}</p>
          <p className="text-xs text-green-500 mt-1">รายการ</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-3">
        {/* Filter tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          {[
            { key: 'all', label: 'ทั้งหมด' },
            { key: 'active', label: 'กำลังยืม' },
            { key: 'overdue', label: 'เกินกำหนด' },
            { key: 'returned', label: 'คืนแล้ว' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                filter === f.key ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {f.label}
              {f.key !== 'all' && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  f.key === 'overdue' ? 'bg-red-100 text-red-600' :
                  f.key === 'active'  ? 'bg-blue-100 text-blue-600' :
                  'bg-green-100 text-green-600'
                }`}>
                  {f.key === 'active' ? stats.active : f.key === 'overdue' ? stats.overdue : records.filter(r => getLoanStatus(r) === 'returned').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 min-w-48">
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาชื่ออุปกรณ์, ชื่อผู้ยืม, serial..."
            className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Add button */}
        {!readOnly && (
          <button onClick={() => { setEditRecord(null); setShowModal(true) }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-2 whitespace-nowrap">
            ➕ เพิ่มรายการยืม
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">📋</div>
            <p className="font-medium">ไม่มีรายการยืม</p>
            {!readOnly && <p className="text-sm mt-1">กด "+ เพิ่มรายการยืม" เพื่อเริ่มต้น</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">#</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">อุปกรณ์</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">ผู้ยืม</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">วันยืม</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">กำหนดคืน</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">วันคืนจริง</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">สถานะ</th>
                  {!readOnly && <th className="text-center px-4 py-3 font-semibold text-gray-600">จัดการ</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((r, i) => {
                  const status = getLoanStatus(r)
                  const cfg = STATUS_CFG[status]
                  const overdueDays = status === 'overdue' ? diffDays(r.dueDate, TODAY) : 0
                  return (
                    <tr key={r.id} className={`hover:bg-gray-50 transition ${status === 'overdue' ? 'bg-red-50/30' : ''}`}>
                      <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800 max-w-48 truncate" title={r.equipmentName}>
                          {r.equipmentName}
                        </div>
                        <div className="flex gap-2 mt-0.5">
                          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{r.equipmentType}</span>
                          {r.serial && <span className="text-xs text-gray-400">{r.serial}</span>}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-700">{r.borrowerName}</div>
                        {r.borrowerDept && <div className="text-xs text-gray-400">{r.borrowerDept}</div>}
                        {r.borrowerPhone && <div className="text-xs text-gray-400">{r.borrowerPhone}</div>}
                      </td>

                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmt(r.borrowDate)}</td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={status === 'overdue' ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                          {fmt(r.dueDate)}
                        </span>
                        {status === 'overdue' && (
                          <div className="text-xs text-red-500">เกิน {overdueDays} วัน</div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {r.returnDate ? fmt(r.returnDate) : <span className="text-gray-300">-</span>}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>

                      {!readOnly && (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            {status !== 'returned' && (
                              <button onClick={() => setReturnRec(r)}
                                className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-2.5 py-1.5 rounded-lg font-medium transition">
                                คืน
                              </button>
                            )}
                            <button onClick={() => openEdit(r)}
                              className="text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 px-2.5 py-1.5 rounded-lg font-medium transition">
                              แก้ไข
                            </button>
                            <button onClick={() => setDeleteId(r.id)}
                              className="text-xs bg-red-50 text-red-500 hover:bg-red-100 px-2.5 py-1.5 rounded-lg font-medium transition">
                              ลบ
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
            แสดง {filtered.length} จาก {records.length} รายการ
          </div>
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <LoanModal
          record={editRecord}
          computers={computers}
          currentUser={currentUser}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditRecord(null) }}
        />
      )}

      {returnRec && (
        <ReturnModal
          record={returnRec}
          onConfirm={handleReturn}
          onClose={() => setReturnRec(null)}
        />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="text-4xl mb-3">🗑️</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">ลบรายการนี้?</h3>
            <p className="text-sm text-gray-500 mb-6">การลบไม่สามารถกู้คืนได้</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 transition">
                ยกเลิก
              </button>
              <button onClick={() => { deleteRecord(deleteId); setDeleteId(null) }}
                className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-red-700 transition">
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
