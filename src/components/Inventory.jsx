import { useState, useMemo } from 'react'
import { useInventory } from '../hooks/useInventory'
import InventoryFormModal from './InventoryFormModal'
import StockAdjustModal from './StockAdjustModal'

const MONTHS_TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
function fmtDate(d) {
  if (!d) return '-'
  const [y, m, day] = d.split('-')
  return `${parseInt(day)} ${MONTHS_TH[parseInt(m)-1]} ${parseInt(y)+543}`
}

function StatusBadge({ quantity, minQuantity }) {
  if (quantity === 0)
    return <span className="bg-gray-200 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">OUT OF STOCK</span>
  if (quantity <= minQuantity)
    return <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">LOW STOCK</span>
  return <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">AVAILABLE</span>
}

export default function Inventory({ onBack, readOnly = false }) {
  const { items, history, addItem, updateItem, deleteItem, adjustStock, deleteHistory } = useInventory()
  const [activeTab, setActiveTab] = useState('stock') // 'stock' | 'history'
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [histSearch, setHistSearch] = useState('')
  const [histDept, setHistDept] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [adjustTarget, setAdjustTarget] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmDelHist, setConfirmDelHist] = useState(null)

  const categories = useMemo(() => [...new Set(items.map(i => i.category).filter(Boolean))].sort(), [items])
  const departments = useMemo(() => [...new Set(history.map(r => r.department).filter(Boolean))].sort(), [history])

  const filtered = useMemo(() => {
    let d = items
    if (search) {
      const s = search.toLowerCase()
      d = d.filter(i => i.name.toLowerCase().includes(s) || i.code.toLowerCase().includes(s) || i.category.toLowerCase().includes(s))
    }
    if (filterCat) d = d.filter(i => i.category === filterCat)
    return d
  }, [items, search, filterCat])

  const filteredHistory = useMemo(() => {
    let d = history
    if (histSearch) {
      const s = histSearch.toLowerCase()
      d = d.filter(r =>
        r.itemName?.toLowerCase().includes(s) ||
        r.requesterName?.toLowerCase().includes(s) ||
        r.recipientName?.toLowerCase().includes(s) ||
        r.department?.toLowerCase().includes(s)
      )
    }
    if (histDept) d = d.filter(r => r.department === histDept)
    return d
  }, [history, histSearch, histDept])

  const totalValue = useMemo(() => items.reduce((s, i) => s + i.quantity * i.unitPrice, 0), [items])
  const lowStockCount = useMemo(() => items.filter(i => i.quantity <= i.minQuantity).length, [items])
  const histThisMonth = useMemo(() => {
    const m = new Date().toISOString().slice(0, 7)
    return history.filter(r => r.date?.startsWith(m)).length
  }, [history])

  return (
    <div className="space-y-6">
      {showAdd && (
        <InventoryFormModal title="เพิ่มสินค้าใหม่" initial={null} onSave={addItem} onClose={() => setShowAdd(false)} />
      )}
      {editTarget && (
        <InventoryFormModal title="แก้ไขข้อมูล" initial={editTarget} onSave={d => updateItem(editTarget.id, d)} onClose={() => setEditTarget(null)} />
      )}
      {adjustTarget && (
        <StockAdjustModal item={adjustTarget} onSave={adjustStock} onClose={() => setAdjustTarget(null)} />
      )}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-800 mb-2">ยืนยันการลบ</h3>
            <p className="text-sm text-gray-500 mb-5">ต้องการลบ <span className="font-semibold text-gray-700">"{confirmDelete.name}"</span> ออกจากคลังใช่ไหม?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-lg border text-sm text-gray-600 hover:bg-gray-50">ยกเลิก</button>
              <button onClick={() => { deleteItem(confirmDelete.id); setConfirmDelete(null) }} className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600">ลบ</button>
            </div>
          </div>
        </div>
      )}
      {confirmDelHist && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-800 mb-2">ลบประวัติการเบิก?</h3>
            <p className="text-sm text-gray-500 mb-5">รายการเบิก <span className="font-semibold text-gray-700">"{confirmDelHist.itemName}"</span> จะถูกลบถาวร</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelHist(null)} className="px-4 py-2 rounded-lg border text-sm text-gray-600 hover:bg-gray-50">ยกเลิก</button>
              <button onClick={() => { deleteHistory(confirmDelHist.id); setConfirmDelHist(null) }} className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600">ลบ</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-3xl">📦</span> คลังอะไหล่อุปกรณ์ไอที
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">บริหารจัดการและติดตามสถานะอะไหล่คลังแบบ Real-time</p>
        </div>
        <div className="flex gap-3">
          {!readOnly && activeTab === 'stock' && (
            <button
              onClick={() => setShowAdd(true)}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 flex items-center gap-2 shadow-sm"
            >
              + เพิ่มสินค้าใหม่
            </button>
          )}
          <button
            onClick={onBack}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 flex items-center gap-2"
          >
            🏠 กลับหน้าหลัก
          </button>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('stock')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'stock' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          📦 รายการสต็อก
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${activeTab === 'history' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          📋 สรุปการเบิก
          {history.length > 0 && (
            <span className="bg-orange-100 text-orange-600 text-xs px-1.5 py-0.5 rounded-full">{history.length}</span>
          )}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500 font-medium">รายการอะไหล่ทั้งหมด</div>
            <div className="text-4xl font-bold text-gray-800 mt-1">{items.length}</div>
          </div>
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl">📋</div>
        </div>

        <div className={`rounded-2xl p-5 flex items-center justify-between ${lowStockCount > 0 ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
          <div>
            <div className="text-sm opacity-80 font-medium">รายการที่ควรสั่งเพิ่ม</div>
            <div className="text-4xl font-bold mt-1">{lowStockCount}</div>
            {lowStockCount > 0 && <div className="text-xs opacity-70 mt-0.5">สต็อกต่ำกว่าขั้นต่ำ</div>}
          </div>
          <div className="text-4xl opacity-50">{lowStockCount > 0 ? '⚠️' : '✅'}</div>
        </div>

        <div className="bg-blue-600 text-white rounded-2xl p-5 flex items-center justify-between">
          <div>
            <div className="text-sm opacity-80 font-medium">มูลค่ารวมพัสดุ</div>
            <div className="text-3xl font-bold mt-1">{totalValue.toLocaleString()} .-</div>
          </div>
          <div className="text-4xl opacity-50">💰</div>
        </div>

        <div className="bg-orange-500 text-white rounded-2xl p-5 flex items-center justify-between">
          <div>
            <div className="text-sm opacity-80 font-medium">เบิกเดือนนี้</div>
            <div className="text-4xl font-bold mt-1">{histThisMonth}</div>
            <div className="text-xs opacity-70 mt-0.5">รายการ</div>
          </div>
          <div className="text-4xl opacity-50">📤</div>
        </div>
      </div>

      {/* ── Stock Table ── */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-wrap gap-3">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
              <span className="text-orange-500">📋</span> ประวัติการเบิกอะไหล่
            </h3>
            <div className="flex items-center gap-3 flex-wrap">
              {departments.length > 0 && (
                <select
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  value={histDept}
                  onChange={e => setHistDept(e.target.value)}
                >
                  <option value="">ทุกฝ่าย</option>
                  {departments.map(d => <option key={d}>{d}</option>)}
                </select>
              )}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                <input
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm w-56 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="ชื่ออะไหล่, ชื่อผู้เบิก, ฝ่าย..."
                  value={histSearch}
                  onChange={e => setHistSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <div className="text-4xl mb-3">📭</div>
              <p className="font-medium">ยังไม่มีประวัติการเบิก</p>
              <p className="text-sm mt-1">เมื่อมีการเบิกอะไหล่ออกจากคลัง รายการจะปรากฏที่นี่</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-3 text-left text-gray-500 font-medium">วันที่</th>
                    <th className="px-4 py-3 text-left text-gray-500 font-medium">อะไหล่</th>
                    <th className="px-4 py-3 text-center text-gray-500 font-medium">จำนวน</th>
                    <th className="px-4 py-3 text-left text-gray-500 font-medium">ผู้เบิก</th>
                    <th className="px-4 py-3 text-left text-gray-500 font-medium">เบิกให้</th>
                    <th className="px-4 py-3 text-left text-gray-500 font-medium">ฝ่าย / แผนก</th>
                    <th className="px-4 py-3 text-left text-gray-500 font-medium">หมายเหตุ</th>
                    {!readOnly && <th className="px-4 py-3 text-center text-gray-500 font-medium">ลบ</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredHistory.map(r => (
                    <tr key={r.id} className="hover:bg-orange-50/40 transition-colors">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{fmtDate(r.date)}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-800">{r.itemName}</div>
                        <div className="text-xs text-blue-500">{r.itemCode}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-lg font-bold text-orange-600">{r.quantity}</span>
                        <span className="text-xs text-gray-400 ml-1">{r.unit}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-700">{r.requesterName || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{r.recipientName || <span className="text-gray-300">-</span>}</td>
                      <td className="px-4 py-3">
                        {r.department
                          ? <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-lg font-medium">{r.department}</span>
                          : <span className="text-gray-300">-</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 italic">{r.notes || '-'}</td>
                      {!readOnly && (
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => setConfirmDelHist(r)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-red-400 hover:text-red-500 transition-colors mx-auto">
                            🗑
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 font-bold text-gray-600">รวม {filteredHistory.length} รายการ</td>
                    <td className="px-4 py-3 text-center font-bold text-orange-600">
                      {filteredHistory.reduce((s, r) => s + r.quantity, 0)}
                    </td>
                    <td colSpan={readOnly ? 4 : 5} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'stock' && <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-wrap gap-3">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <span className="text-blue-500">≡</span> รายการพัสดุในคลังปัจจุบัน
          </h3>
          <div className="flex items-center gap-3">
            {categories.length > 0 && (
              <select
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={filterCat}
                onChange={e => setFilterCat(e.target.value)}
              >
                <option value="">ทุกหมวดหมู่</option>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            )}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="พิมพ์ชื่ออะไหล่เพื่อค้นหา..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <div className="text-4xl mb-3">📭</div>
            <p className="font-medium">ไม่พบรายการ</p>
            <p className="text-sm mt-1">ลองเปลี่ยนคำค้นหา หรือเพิ่มสินค้าใหม่</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3 text-left text-gray-500 font-medium">ชื่ออะไหล่ / รหัส</th>
                <th className="px-6 py-3 text-left text-gray-500 font-medium">หมวดหมู่</th>
                <th className="px-6 py-3 text-center text-gray-500 font-medium">คงเหลือ</th>
                <th className="px-6 py-3 text-right text-gray-500 font-medium">ราคา/หน่วย</th>
                <th className="px-6 py-3 text-right text-gray-500 font-medium">มูลค่า</th>
                <th className="px-6 py-3 text-center text-gray-500 font-medium">สถานะ</th>
                <th className="px-6 py-3 text-center text-gray-500 font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(item => (
                <tr key={item.id} className={`hover:bg-gray-50/60 transition-colors ${item.quantity === 0 ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-800">{item.name}</div>
                    <div className="text-xs text-blue-500 mt-0.5">{item.code}</div>
                    {item.notes && <div className="text-xs text-gray-400 mt-0.5 italic">{item.notes}</div>}
                  </td>
                  <td className="px-6 py-4">
                    {item.category && (
                      <span className="border border-gray-300 text-gray-600 text-xs px-3 py-1 rounded-lg">{item.category}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className={`text-2xl font-bold ${item.quantity <= item.minQuantity ? 'text-red-500' : 'text-blue-600'}`}>
                      {item.quantity}
                    </div>
                    <div className="text-xs text-gray-400">{item.unit}</div>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600 font-medium">
                    {item.unitPrice.toLocaleString()} .-
                  </td>
                  <td className="px-6 py-4 text-right text-gray-700 font-semibold">
                    {(item.quantity * item.unitPrice).toLocaleString()} .-
                  </td>
                  <td className="px-6 py-4 text-center">
                    <StatusBadge quantity={item.quantity} minQuantity={item.minQuantity} />
                    <div className="text-xs text-gray-400 mt-1">ขั้นต่ำ: {item.minQuantity} {item.unit}</div>
                  </td>
                  <td className="px-6 py-4">
                    {readOnly ? (
                      <span className="text-xs text-gray-400 italic">อ่านอย่างเดียว</span>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setAdjustTarget(item)} title="ปรับสต็อก"
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">⊕</button>
                        <button onClick={() => setEditTarget(item)} title="แก้ไข"
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-yellow-400 hover:text-yellow-600 transition-colors">✏</button>
                        <button onClick={() => setConfirmDelete(item)} title="ลบ"
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-red-400 hover:text-red-500 transition-colors">🗑</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-gray-200 bg-gray-50">
              <tr>
                <td colSpan={4} className="px-6 py-3 font-bold text-gray-600">รวม {filtered.length} รายการ</td>
                <td className="px-6 py-3 text-right font-bold text-gray-800">
                  {filtered.reduce((s, i) => s + i.quantity * i.unitPrice, 0).toLocaleString()} .-
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
      }
    </div>
  )
}
