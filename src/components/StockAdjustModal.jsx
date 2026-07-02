import { useState } from 'react'

export default function StockAdjustModal({ item, onSave, onClose }) {
  const [delta, setDelta] = useState(1)
  const [mode, setMode] = useState('add') // 'add' | 'remove'

  const realDelta = mode === 'add' ? delta : -delta
  const preview = Math.max(0, item.quantity + realDelta)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">ปรับสต็อก</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <p className="font-semibold text-gray-700">{item.name}</p>
            <p className="text-sm text-gray-400">รหัส: {item.code}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setMode('add')}
              className={`flex-1 py-2 rounded-xl font-medium text-sm border-2 transition-colors ${mode === 'add' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500'}`}
            >
              + รับเข้า
            </button>
            <button
              onClick={() => setMode('remove')}
              className={`flex-1 py-2 rounded-xl font-medium text-sm border-2 transition-colors ${mode === 'remove' ? 'border-red-400 bg-red-50 text-red-600' : 'border-gray-200 text-gray-500'}`}
            >
              − เบิกออก
            </button>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">จำนวน ({item.unit})</label>
            <input
              type="number" min={1}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={delta}
              onChange={e => setDelta(Math.max(1, Number(e.target.value)))}
            />
          </div>
          <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
            <div className="text-center">
              <div className="text-xs text-gray-400">ก่อน</div>
              <div className="text-2xl font-bold text-gray-700">{item.quantity}</div>
            </div>
            <div className={`text-2xl font-bold ${mode === 'add' ? 'text-green-500' : 'text-red-500'}`}>
              {mode === 'add' ? `+${delta}` : `−${delta}`}
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400">หลัง</div>
              <div className={`text-2xl font-bold ${preview <= item.minQuantity ? 'text-red-500' : 'text-green-600'}`}>{preview}</div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
            ยกเลิก
          </button>
          <button
            onClick={() => { onSave(item.id, realDelta); onClose() }}
            className={`px-4 py-2 rounded-lg text-white text-sm font-medium ${mode === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'}`}
          >
            ยืนยัน
          </button>
        </div>
      </div>
    </div>
  )
}
