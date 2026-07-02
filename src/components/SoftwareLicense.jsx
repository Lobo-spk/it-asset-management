import { useState, useMemo, useEffect, useRef } from 'react'
import emailjs from '@emailjs/browser'
import { useLicenses, getLicenseStatus } from '../hooks/useLicenses'
import { useAuth } from '../contexts/AuthContext'

const STATUS_CONFIG = {
  expired:  { label: 'หมดอายุ',        bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500' },
  expiring: { label: 'ใกล้หมดอายุ',    bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500' },
  ok:       { label: 'ปกติ',            bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500' },
  'no-date':{ label: 'ไม่ระบุวันหมดอายุ', bg: 'bg-gray-100', text: 'text-gray-500',  dot: 'bg-gray-400' },
}

const CATEGORY_LABEL = { software: '💻 Software', ma: '🔧 MA' }
const EMPTY_FORM = { name: '', type: 'รายปี', totalLicense: 1, usedLicense: 0, expiryDate: '', vendor: '', category: 'software', renew: true }

function RenewBadge({ renew }) {
  if (renew === true)
    return <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-green-100 text-green-700">✅ ต่อสัญญา</span>
  if (renew === false)
    return <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-red-100 text-red-700">❌ ไม่ต่อ</span>
  return <span className="text-xs text-gray-400">-</span>
}

function StatusBadge({ expiryDate }) {
  const s = getLicenseStatus(expiryDate)
  const cfg = STATUS_CONFIG[s]
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function formatDate(d) {
  if (!d) return '-'
  try {
    return new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch { return d }
}

function daysUntil(d) {
  if (!d) return null
  const diff = Math.round((new Date(d) - new Date()) / (1000 * 60 * 60 * 24))
  return diff
}

// ---- Modal Form ----
function LicenseModal({ item, onSave, onClose }) {
  const [form, setForm] = useState(item || EMPTY_FORM)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = () => {
    if (!form.name.trim()) return
    onSave({
      ...form,
      totalLicense: Number(form.totalLicense) || 0,
      usedLicense: Number(form.usedLicense) || 0,
      expiryDate: form.expiryDate || null,
      renew: form.renew ?? true,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-lg">{item ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อโปรแกรม / อุปกรณ์ *</label>
              <input
                value={form.name}
                onChange={e => set('name', e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="เช่น Microsoft 365, MA ปริ้นเตอร์ Epson"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ประเภท</label>
              <select
                value={form.category}
                onChange={e => set('category', e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="software">💻 Software License</option>
                <option value="ma">🔧 MA (Maintenance)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทลิขสิทธิ์</label>
              <select
                value={form.type}
                onChange={e => set('type', e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="รายปี">รายปี</option>
                <option value="ถาวร">ถาวร</option>
                <option value="รายเดือน">รายเดือน</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">จำนวน License ทั้งหมด</label>
              <input
                type="number" min="0"
                value={form.totalLicense}
                onChange={e => set('totalLicense', e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนที่ใช้งานแล้ว</label>
              <input
                type="number" min="0"
                value={form.usedLicense}
                onChange={e => set('usedLicense', e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">วันหมดอายุ</label>
              <input
                type="date"
                value={form.expiryDate || ''}
                onChange={e => set('expiryDate', e.target.value || null)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">บริษัท / ผู้ขาย</label>
              <input
                value={form.vendor}
                onChange={e => set('vendor', e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="ชื่อบริษัทผู้จำหน่าย"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">การต่อสัญญา</label>
              <div className="flex gap-3">
                {[{ v: true, label: '✅ ต่อสัญญา', on: 'bg-green-100 border-green-400 text-green-800' }, { v: false, label: '❌ ไม่ต่อสัญญา', on: 'bg-red-100 border-red-400 text-red-800' }].map(opt => (
                  <button
                    key={String(opt.v)}
                    type="button"
                    onClick={() => set('renew', opt.v)}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${form.renew === opt.v ? opt.on : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 font-medium">ยกเลิก</button>
          <button
            onClick={handleSave}
            disabled={!form.name.trim()}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40"
          >
            {item ? '💾 บันทึก' : '➕ เพิ่มรายการ'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---- Dashboard View ----
function LicenseDashboardView({ licenses, alertDays = 90 }) {
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchQ, setSearchQ] = useState('')

  const getStatus = (expiryDate) => {
    if (!expiryDate) return 'no-date'
    const exp = new Date(expiryDate)
    const now = new Date()
    const diffDays = (exp - now) / (1000 * 60 * 60 * 24)
    if (diffDays < 0) return 'expired'
    if (diffDays <= alertDays) return 'expiring'
    return 'ok'
  }

  const stats = useMemo(() => {
    const total = licenses.length
    const software = licenses.filter(x => x.category === 'software').length
    const ma = licenses.filter(x => x.category === 'ma').length
    const expired = licenses.filter(x => getStatus(x.expiryDate) === 'expired').length
    const expiring = licenses.filter(x => getStatus(x.expiryDate) === 'expiring').length
    const noDate = licenses.filter(x => !x.expiryDate).length
    return { total, software, ma, expired, expiring, noDate }
  }, [licenses, alertDays])

  const alertItems = useMemo(() =>
    licenses.filter(x => ['expired', 'expiring'].includes(getStatus(x.expiryDate)))
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate)),
  [licenses, alertDays])

  const filtered = useMemo(() => {
    let list = licenses
    if (categoryFilter !== 'all') list = list.filter(x => x.category === categoryFilter)
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase()
      list = list.filter(x => x.name.toLowerCase().includes(q) || x.vendor.toLowerCase().includes(q))
    }
    return list
  }, [licenses, categoryFilter, searchQ])

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-blue-600 text-white rounded-2xl p-4">
          <div className="text-xs opacity-75">รายการทั้งหมด</div>
          <div className="text-3xl font-bold mt-1">{stats.total}</div>
          <div className="text-xs opacity-60 mt-0.5">Software {stats.software} · MA {stats.ma}</div>
        </div>
        <div className={`rounded-2xl p-4 ${stats.expired > 0 ? 'bg-red-500 text-white' : 'bg-white border border-gray-200'}`}>
          <div className={`text-xs ${stats.expired > 0 ? 'opacity-75' : 'text-gray-500'}`}>หมดอายุแล้ว</div>
          <div className="text-3xl font-bold mt-1">{stats.expired}</div>
          <div className={`text-xs mt-0.5 ${stats.expired > 0 ? 'opacity-60' : 'text-gray-400'}`}>รายการ</div>
        </div>
        <div className={`rounded-2xl p-4 ${stats.expiring > 0 ? 'bg-amber-400 text-white' : 'bg-white border border-gray-200'}`}>
          <div className={`text-xs ${stats.expiring > 0 ? 'opacity-75' : 'text-gray-500'}`}>ใกล้หมดอายุ ({alertDays} วัน)</div>
          <div className="text-3xl font-bold mt-1">{stats.expiring}</div>
          <div className={`text-xs mt-0.5 ${stats.expiring > 0 ? 'opacity-60' : 'text-gray-400'}`}>รายการ</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="text-xs text-gray-500">ไม่ระบุวันหมดอายุ</div>
          <div className="text-3xl font-bold text-gray-700 mt-1">{stats.noDate}</div>
          <div className="text-xs text-gray-400 mt-0.5">รายการ</div>
        </div>
      </div>

      {/* Alert banner */}
      {alertItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🔔</span>
            <div>
              <div className="font-bold text-red-800">แจ้งเตือน: มี {alertItems.length} รายการที่ต้องดำเนินการ</div>
              <div className="text-xs text-red-600 mt-0.5">หมดอายุแล้วหรือกำลังจะหมดอายุภายใน {alertDays} วัน</div>
            </div>
          </div>
          <div className="space-y-2">
            {alertItems.map(x => {
              const days = daysUntil(x.expiryDate)
              const s = getStatus(x.expiryDate)
              return (
                <div key={x.id} className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${s === 'expired' ? 'bg-red-100' : 'bg-amber-50 border border-amber-100'}`}>
                  <div className="flex items-center gap-2">
                    <span>{x.category === 'ma' ? '🔧' : '💻'}</span>
                    <span className="font-medium text-gray-800 truncate max-w-xs">{x.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-gray-500 text-xs">{formatDate(x.expiryDate)}</span>
                    <span className={`text-xs font-semibold ${s === 'expired' ? 'text-red-700' : 'text-amber-700'}`}>
                      {days < 0 ? `เกิน ${Math.abs(days)} วัน` : `อีก ${days} วัน`}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filter + search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {[['all', 'ทั้งหมด'], ['software', '💻 Software'], ['ma', '🔧 MA']].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setCategoryFilter(v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${categoryFilter === v ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {l}
            </button>
          ))}
        </div>
        <input
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          placeholder="ค้นหาชื่อโปรแกรมหรือผู้ขาย..."
          className="border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-64"
        />
        <span className="text-sm text-gray-400">{filtered.length} รายการ</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">#</th>
                <th className="px-4 py-3 text-left font-semibold">ชื่อโปรแกรม / อุปกรณ์</th>
                <th className="px-4 py-3 text-left font-semibold">ประเภท</th>
                <th className="px-4 py-3 text-center font-semibold">License</th>
                <th className="px-4 py-3 text-center font-semibold">ใช้งาน</th>
                <th className="px-4 py-3 text-center font-semibold">คงเหลือ</th>
                <th className="px-4 py-3 text-left font-semibold">วันหมดอายุ</th>
                <th className="px-4 py-3 text-left font-semibold">สถานะ</th>
                <th className="px-4 py-3 text-center font-semibold">ต่อสัญญา</th>
                <th className="px-4 py-3 text-left font-semibold">ผู้จำหน่าย</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((x, idx) => {
                const remaining = x.totalLicense - x.usedLicense
                const usePct = x.totalLicense > 0 ? (x.usedLicense / x.totalLicense) * 100 : 0
                return (
                  <tr key={x.id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800 max-w-xs">{x.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${x.category === 'software' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {CATEGORY_LABEL[x.category]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-700">{x.totalLicense}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-medium text-gray-700">{x.usedLicense}</span>
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${usePct >= 100 ? 'bg-red-500' : usePct >= 80 ? 'bg-amber-400' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(usePct, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-semibold ${remaining <= 0 ? 'text-red-600' : remaining <= 5 ? 'text-amber-600' : 'text-green-600'}`}>
                        {remaining}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                      {formatDate(x.expiryDate)}
                      {x.expiryDate && (
                        <div className="text-gray-400 mt-0.5">
                          {(() => { const d = daysUntil(x.expiryDate); return d < 0 ? `เกิน ${Math.abs(d)} วัน` : `อีก ${d} วัน` })()}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3"><StatusBadge expiryDate={x.expiryDate} /></td>
                    <td className="px-4 py-3 text-center">
                      <RenewBadge renew={x.renew} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-48 truncate" title={x.vendor}>{x.vendor || '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-gray-400">
              <div className="text-4xl mb-3">🔍</div>
              <p>ไม่พบรายการ</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---- Management View ----
function LicenseManageView({ licenses, onAdd, onUpdate, onDelete, onReset }) {
  const [modal, setModal] = useState(null) // null | 'add' | { item }
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [searchQ, setSearchQ] = useState('')

  const filtered = useMemo(() => {
    if (!searchQ.trim()) return licenses
    const q = searchQ.toLowerCase()
    return licenses.filter(x => x.name.toLowerCase().includes(q) || x.vendor.toLowerCase().includes(q))
  }, [licenses, searchQ])

  const handleSave = (form) => {
    if (modal === 'add') {
      onAdd(form)
    } else {
      onUpdate(modal.item.id, form)
    }
    setModal(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          placeholder="ค้นหา..."
          className="border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-64"
        />
        <div className="flex gap-2">
          <button
            onClick={() => { if (window.confirm('รีเซ็ตข้อมูลกลับเป็นค่าเริ่มต้น?')) onReset() }}
            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-xl text-sm hover:bg-gray-50"
          >
            🔄 Reset ข้อมูล
          </button>
          <button
            onClick={() => setModal('add')}
            className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 flex items-center gap-2"
          >
            ➕ เพิ่มรายการ
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">#</th>
                <th className="px-4 py-3 text-left font-semibold">ชื่อโปรแกรม / อุปกรณ์</th>
                <th className="px-4 py-3 text-left font-semibold">ประเภท</th>
                <th className="px-4 py-3 text-center font-semibold">License</th>
                <th className="px-4 py-3 text-center font-semibold">ใช้งาน</th>
                <th className="px-4 py-3 text-left font-semibold">วันหมดอายุ</th>
                <th className="px-4 py-3 text-left font-semibold">สถานะ</th>
                <th className="px-4 py-3 text-center font-semibold">ต่อสัญญา</th>
                <th className="px-4 py-3 text-left font-semibold">ผู้จำหน่าย</th>
                <th className="px-4 py-3 text-center font-semibold">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((x, idx) => (
                <tr key={x.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 max-w-xs">
                    <div className="truncate" title={x.name}>{x.name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${x.category === 'software' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {x.category === 'software' ? '💻' : '🔧'} {x.category === 'software' ? 'Software' : 'MA'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-medium">{x.totalLicense}</td>
                  <td className="px-4 py-3 text-center">{x.usedLicense}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{formatDate(x.expiryDate)}</td>
                  <td className="px-4 py-3"><StatusBadge expiryDate={x.expiryDate} /></td>
                  <td className="px-4 py-3 text-center">
                    <RenewBadge renew={x.renew} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-40 truncate" title={x.vendor}>{x.vendor || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setModal({ item: x })}
                        className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => setConfirmDelete(x)}
                        className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium"
                      >
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-gray-400">
              <div className="text-4xl mb-3">📭</div>
              <p>ไม่พบรายการ</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {modal && (
        <LicenseModal
          item={modal === 'add' ? null : modal.item}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-800 mb-2">ยืนยันการลบ</h3>
            <p className="text-sm text-gray-500 mb-5">
              ต้องการลบ <strong className="text-gray-700">"{confirmDelete.name}"</strong> ออกจากระบบ?
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 border rounded-xl text-sm text-gray-600 hover:bg-gray-50">ยกเลิก</button>
              <button
                onClick={() => { onDelete(confirmDelete.id); setConfirmDelete(null) }}
                className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600"
              >
                ลบรายการ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---- Email config (localStorage) ----
const EMAIL_CFG_KEY = 'it_license_email_cfg'
const AUTO_SENT_KEY = 'it_license_auto_sent_date'

const DEFAULT_CFG = {
  recipients: [],
  alertDays: 30,
  senderName: 'ฝ่าย ICT',
  serviceId: '',
  templateId: '',
  publicKey: '',
  autoSend: true,
}

function loadEmailCfg() {
  try {
    const raw = localStorage.getItem(EMAIL_CFG_KEY)
    return raw ? { ...DEFAULT_CFG, ...JSON.parse(raw) } : DEFAULT_CFG
  } catch { return DEFAULT_CFG }
}

function saveEmailCfg(cfg) {
  localStorage.setItem(EMAIL_CFG_KEY, JSON.stringify(cfg))
}

// ---- HTML email builder (matches screenshot style) ----
function buildHtmlEmail(alertItems, alertDays, senderName) {
  const rows = alertItems.map(x => {
    const days = daysUntil(x.expiryDate)
    const isExpired = days !== null && days < 0
    const daysText = isExpired
      ? `<span style="color:#dc2626;font-weight:bold">หมดอายุแล้ว</span>`
      : `<span style="color:#d97706;font-weight:bold">อีก ${days} วัน</span>`
    return `<tr>
      <td style="border:1px solid #e5e7eb;padding:10px 14px;font-size:14px">${x.name}</td>
      <td style="border:1px solid #e5e7eb;padding:10px 14px;font-size:14px;text-align:center;white-space:nowrap">${formatDate(x.expiryDate)}</td>
      <td style="border:1px solid #e5e7eb;padding:10px 14px;font-size:14px;text-align:center">${daysText}</td>
    </tr>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="th"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Sarabun,Arial,sans-serif">
  <div style="max-width:640px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08)">
    <div style="background:#fff;padding:28px 32px 20px">
      <div style="font-size:22px;font-weight:bold;color:#dc2626;margin-bottom:6px">
        🚨 รายงานแจ้งเตือนลิขสิทธิ์ซอฟต์แวร์
      </div>
      <p style="color:#374151;font-size:15px;margin:0 0 20px">
        ตรวจสอบพบรายการที่กำลังจะหมดอายุภายใน <strong>${alertDays} วัน</strong> ดังนี้:
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <thead>
          <tr style="background:#f3f4f6">
            <th style="border:1px solid #e5e7eb;padding:10px 14px;text-align:left;font-weight:600;color:#374151">ชื่อซอฟต์แวร์</th>
            <th style="border:1px solid #e5e7eb;padding:10px 14px;text-align:center;font-weight:600;color:#374151;white-space:nowrap">วันหมดอายุ</th>
            <th style="border:1px solid #e5e7eb;padding:10px 14px;text-align:center;font-weight:600;color:#374151;white-space:nowrap">คงเหลือ (วัน)</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin:20px 0 4px;color:#6b7280;font-size:13px">
        กรุณาดำเนินการต่ออายุโดยด่วน หากมีข้อสงสัยติดต่อ${senderName || 'ฝ่าย ICT'}
      </p>
    </div>
    <div style="background:#f3f4f6;padding:14px 32px;font-size:12px;color:#9ca3af">
      ส่งโดยระบบ EDP IT Asset Management · ${senderName || 'ฝ่าย ICT'}
    </div>
  </div>
</body></html>`
}

// ---- Email Settings View ----
function EmailSettingsView({ cfg, onChange, onTestSend, testStatus }) {
  const [newEmail, setNewEmail] = useState('')
  const [saved, setSaved] = useState(false)
  const [localCfg, setLocalCfg] = useState(cfg)

  const set = (k, v) => setLocalCfg(p => ({ ...p, [k]: v }))

  const addRecipient = () => {
    const email = newEmail.trim().toLowerCase()
    if (!email || !email.includes('@')) return
    if (localCfg.recipients.includes(email)) { setNewEmail(''); return }
    set('recipients', [...localCfg.recipients, email])
    setNewEmail('')
  }

  const removeRecipient = (e) => set('recipients', localCfg.recipients.filter(r => r !== e))

  const handleSave = () => {
    onChange(localCfg)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const isEmailJsReady = localCfg.serviceId && localCfg.templateId && localCfg.publicKey && localCfg.recipients.length > 0

  return (
    <div className="space-y-5 max-w-2xl">

      {/* Step guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <div className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
          <span>📋</span> วิธีตั้งค่าส่งอีเมลอัตโนมัติ (EmailJS — ฟรี 200 อีเมล/เดือน)
        </div>
        <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
          <li>สมัครที่ <strong>emailjs.com</strong> → Login</li>
          <li>Email Services → Add New Service → เลือก <strong>Gmail</strong> → Connect Account → Copy <strong>Service ID</strong></li>
          <li>Email Templates → Create New Template → วางโค้ดด้านล่าง → Save → Copy <strong>Template ID</strong></li>
          <li>Account → General → Copy <strong>Public Key</strong></li>
          <li>กรอก 3 ค่าด้านล่าง → บันทึก → กดทดสอบส่ง</li>
        </ol>
      </div>

      {/* EmailJS Template code */}
      <div className="bg-gray-900 rounded-2xl p-4">
        <div className="text-gray-400 text-xs mb-2 flex items-center gap-2">
          <span>📄</span> EmailJS Template Content (วาง HTML นี้ในช่อง Content ของ Template)
        </div>
        <pre className="text-green-400 text-xs overflow-x-auto leading-relaxed whitespace-pre-wrap">{`Subject: {{subject}}
To Email: {{to_email}}

Body (HTML):
{{{html_content}}}`}</pre>
        <div className="text-gray-500 text-xs mt-2">* ใน Template ให้เลือก "HTML Editor" แล้วใส่ <code className="text-yellow-400">{'{{{html_content}}}'}</code> ในช่อง Body</div>
      </div>

      {/* EmailJS credentials */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2"><span>🔑</span> EmailJS Credentials</h3>
        {[
          { k: 'serviceId',  label: 'Service ID',  placeholder: 'service_xxxxxxx' },
          { k: 'templateId', label: 'Template ID', placeholder: 'template_xxxxxxx' },
          { k: 'publicKey',  label: 'Public Key',  placeholder: 'xxxxxxxxxxxxxxxxx' },
        ].map(({ k, label, placeholder }) => (
          <div key={k}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
              value={localCfg[k]}
              onChange={e => set(k, e.target.value.trim())}
              placeholder={placeholder}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        ))}
      </div>

      {/* Recipients */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2"><span>👥</span> ผู้รับอีเมล</h3>
        {localCfg.recipients.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">⚠️ ยังไม่มีผู้รับ</div>
        ) : (
          <div className="space-y-2">
            {localCfg.recipients.map(email => (
              <div key={email} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">{email.charAt(0).toUpperCase()}</span>
                  <span className="text-sm text-gray-700">{email}</span>
                </div>
                <button onClick={() => removeRecipient(email)} className="text-red-400 hover:text-red-600 text-xl leading-none px-1">×</button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="email"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addRecipient()}
            placeholder="กรอก email เช่น admin@company.com"
            className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button onClick={addRecipient} disabled={!newEmail.includes('@')} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40">
            ➕ เพิ่ม
          </button>
        </div>
      </div>

      {/* Auto-send settings */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2"><span>⏰</span> การตั้งค่าแจ้งเตือน</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">แจ้งเตือนล่วงหน้า (วัน)</label>
            <div className="flex items-center gap-2">
              <input
                type="number" min="1" max="365"
                value={localCfg.alertDays}
                onChange={e => set('alertDays', Number(e.target.value) || 30)}
                className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <span className="text-sm text-gray-500">วัน</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อผู้ส่ง</label>
            <input
              value={localCfg.senderName}
              onChange={e => set('senderName', e.target.value)}
              placeholder="ฝ่าย ICT"
              className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => set('autoSend', !localCfg.autoSend)}
            className={`relative w-11 h-6 rounded-full transition-colors ${localCfg.autoSend ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${localCfg.autoSend ? 'translate-x-5' : ''}`} />
          </button>
          <span className="text-sm text-gray-700">ส่งอัตโนมัติเมื่อเปิดแอป (วันละ 1 ครั้ง)</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          {testStatus === 'sending' && <span className="text-sm text-blue-600 flex items-center gap-2"><span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin inline-block" />กำลังส่งทดสอบ...</span>}
          {testStatus === 'ok' && <span className="text-sm text-green-600 font-medium">✅ ส่งทดสอบสำเร็จ — ตรวจสอบ inbox</span>}
          {testStatus === 'error' && <span className="text-sm text-red-600 font-medium">❌ ส่งไม่สำเร็จ — ตรวจสอบ credentials</span>}
          {!isEmailJsReady && testStatus === 'idle' && <span className="text-xs text-gray-400">กรอก Service ID / Template ID / Public Key และผู้รับก่อน</span>}
        </div>
        <div className="flex gap-2">
          {isEmailJsReady && (
            <button
              onClick={() => onTestSend(localCfg)}
              disabled={testStatus === 'sending'}
              className="px-5 py-2.5 border border-blue-300 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-50 disabled:opacity-40"
            >
              📤 ทดสอบส่ง Email
            </button>
          )}
          <button
            onClick={handleSave}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${saved ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            {saved ? '✅ บันทึกแล้ว' : '💾 บันทึกการตั้งค่า'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---- EmailJS send helper ----
async function sendViaEmailJS(cfg, alertItems) {
  const html = buildHtmlEmail(alertItems, cfg.alertDays, cfg.senderName)
  const subject = `⚠️ แจ้งเตือน: ลิขสิทธิ์ซอฟต์แวร์ใกล้หมดอายุ (EDP System)`
  await emailjs.send(
    cfg.serviceId,
    cfg.templateId,
    { to_email: cfg.recipients.join(', '), subject, html_content: html },
    cfg.publicKey
  )
}

function getAlertItems(licenses, alertDays) {
  return licenses.filter(x => {
    if (!x.expiryDate) return false
    const d = daysUntil(x.expiryDate)
    return d !== null && d <= alertDays
  }).sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
}

// ---- Main Component ----
export default function SoftwareLicense() {
  const { licenses, addLicense, updateLicense, deleteLicense, resetToDefault } = useLicenses()
  const { isAdmin } = useAuth()
  const [view, setView] = useState('dashboard')
  const [emailCfg, setEmailCfg] = useState(loadEmailCfg)
  const [autoSendStatus, setAutoSendStatus] = useState(null) // null | 'sent' | 'error'
  const [testStatus, setTestStatus] = useState('idle')
  const autoSentRef = useRef(false)

  // Auto-send on mount (once per day)
  useEffect(() => {
    if (autoSentRef.current) return
    autoSentRef.current = true

    const cfg = loadEmailCfg()
    if (!cfg.autoSend || !cfg.serviceId || !cfg.templateId || !cfg.publicKey || !cfg.recipients.length) return

    const today = new Date().toDateString()
    if (localStorage.getItem(AUTO_SENT_KEY) === today) return

    const alertItems = getAlertItems(licenses, cfg.alertDays)
    if (alertItems.length === 0) return

    sendViaEmailJS(cfg, alertItems)
      .then(() => {
        localStorage.setItem(AUTO_SENT_KEY, today)
        setAutoSendStatus('sent')
        setTimeout(() => setAutoSendStatus(null), 8000)
      })
      .catch(() => setAutoSendStatus('error'))
  }, [licenses])

  const handleEmailCfgChange = (cfg) => {
    saveEmailCfg(cfg)
    setEmailCfg(cfg)
  }

  const handleTestSend = async (cfg) => {
    setTestStatus('sending')
    const alertItems = getAlertItems(licenses, cfg.alertDays)
    const items = alertItems.length > 0 ? alertItems : [{ name: 'ตัวอย่าง: Microsoft 365', expiryDate: new Date(Date.now() + 10 * 86400000).toISOString().slice(0,10), vendor: 'Microsoft', category: 'software' }]
    try {
      await sendViaEmailJS(cfg, items)
      setTestStatus('ok')
    } catch {
      setTestStatus('error')
    }
    setTimeout(() => setTestStatus('idle'), 5000)
  }

  const handleManualSendEmail = (alertItems) => {
    const cfg = emailCfg
    if (cfg.serviceId && cfg.templateId && cfg.publicKey && cfg.recipients.length) {
      sendViaEmailJS(cfg, alertItems).catch(() => {})
    } else {
      // fallback to mailto
      const subject = encodeURIComponent(`[แจ้งเตือน] Software License / MA ที่ต้องต่ออายุ`)
      const body = encodeURIComponent(alertItems.map((x,i) => `${i+1}. ${x.name} — หมดอายุ ${formatDate(x.expiryDate)}`).join('\n'))
      window.open(`mailto:${cfg.recipients.join(',')}?subject=${subject}&body=${body}`)
    }
  }

  const VIEWS = [
    { key: 'dashboard', label: '📊 Dashboard' },
    ...(isAdmin ? [
      { key: 'manage', label: '⚙️ จัดการข้อมูล' },
      { key: 'settings', label: '📧 ตั้งค่า Email' },
    ] : []),
  ]

  return (
    <div className="space-y-5">
      {/* Auto-send notification */}
      {autoSendStatus === 'sent' && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-3 flex items-center gap-3 text-green-800 text-sm">
          <span className="text-xl">✅</span>
          <span>ส่งอีเมลแจ้งเตือนอัตโนมัติสำเร็จแล้ว — ตรวจสอบ inbox ของผู้รับ</span>
        </div>
      )}
      {autoSendStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-3 flex items-center gap-3 text-red-800 text-sm">
          <span className="text-xl">❌</span>
          <span>ส่งอีเมลอัตโนมัติไม่สำเร็จ — ตรวจสอบ EmailJS credentials ในหน้าตั้งค่า Email</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-3xl">🪪</span> Software License & MA
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">ระบบติดตาม Software License และ Maintenance Agreement</p>
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {VIEWS.map(v => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${view === v.key ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {view === 'dashboard' && (
        <LicenseDashboardView
          licenses={licenses}
          alertDays={emailCfg.alertDays}
        />
      )}
      {view === 'manage' && isAdmin && (
        <LicenseManageView
          licenses={licenses}
          onAdd={addLicense}
          onUpdate={updateLicense}
          onDelete={deleteLicense}
          onReset={resetToDefault}
        />
      )}
      {view === 'settings' && isAdmin && (
        <EmailSettingsView
          cfg={emailCfg}
          onChange={handleEmailCfgChange}
          onTestSend={handleTestSend}
          testStatus={testStatus}
        />
      )}
    </div>
  )
}
