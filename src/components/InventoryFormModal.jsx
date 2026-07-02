import { useState, useEffect } from 'react'

const EMPTY = { name: '', code: '', category: '', quantity: 0, minQuantity: 3, unitPrice: 0, unit: 'ชิ้น', notes: '' }

const CATEGORIES = ['RAM', 'HDD/SSD', 'Monitor', 'Keyboard', 'Mouse', 'Cable', 'Adapter', 'UPS', 'Printer', 'Network', 'อื่นๆ']

export default function InventoryFormModal({ initial, onSave, onClose, title }) {
  const [form, setForm] = useState(initial ? { ...initial } : { ...EMPTY })

  useEffect(() => { setForm(initial ? { ...initial } : { ...EMPTY }) }, [initial])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const valid = form.name.trim() !== ''

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">ชื่ออะไหล่ <span className="text-red-400">*</span></label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="ชื่ออะไหล่..."
                value={form.name}
                onChange={e => set('name', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">รหัส (ถ้าไม่กรอกจะสร้างอัตโนมัติ)</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="ITM-001"
                value={form.code}
                onChange={e => set('code', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">หมวดหมู่</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                list="cat-list"
                placeholder="เลือกหรือพิมพ์..."
                value={form.category}
                onChange={e => set('category', e.target.value)}
              />
              <datalist id="cat-list">{CATEGORIES.map(c => <option key={c} value={c} />)}</datalist>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">จำนวนคงเหลือ</label>
              <input
                type="number" min={0}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.quantity}
                onChange={e => set('quantity', Math.max(0, Number(e.target.value)))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">จำนวนขั้นต่ำ (Low Stock)</label>
              <input
                type="number" min={0}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.minQuantity}
                onChange={e => set('minQuantity', Math.max(0, Number(e.target.value)))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">ราคาต่อหน่วย (บาท)</label>
              <input
                type="number" min={0}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.unitPrice}
                onChange={e => set('unitPrice', Math.max(0, Number(e.target.value)))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">หน่วย</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                list="unit-list"
                value={form.unit}
                onChange={e => set('unit', e.target.value)}
              />
              <datalist id="unit-list">
                {['ชิ้น','อัน','ตัว','เส้น','แผ่น','กล่อง','ชุด'].map(u => <option key={u} value={u} />)}
              </datalist>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">หมายเหตุ</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="หมายเหตุเพิ่มเติม..."
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
            ยกเลิก
          </button>
          <button
            disabled={!valid}
            onClick={() => { onSave(form); onClose() }}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40"
          >
            บันทึก
          </button>
        </div>
      </div>
    </div>
  )
}
