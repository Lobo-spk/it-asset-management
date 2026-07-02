import { useState } from 'react'

export default function EditModal({ computer, onSave, onClose }) {
  const [form, setForm] = useState({ ...computer })

  const fields = [
    { key: 'status', label: 'Status' },
    { key: 'hostname', label: 'Hostname' },
    { key: 'lastUser', label: 'Last User' },
    { key: 'groups', label: 'Groups' },
    { key: 'ip', label: 'Internal IP' },
    { key: 'os', label: 'OS' },
    { key: 'serial', label: 'Serial Number' },
    { key: 'room', label: 'Room' },
    { key: 'shipDate', label: 'ShipDate' },
    { key: 'warrantyExp', label: 'Warranty Expiration' },
    { key: 'model', label: 'Model' },
    { key: 'type', label: 'Type' },
    { key: 'assetsTag', label: 'Assets Tag' },
    { key: 'notes', label: 'Notes' },
  ]

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-gray-800">แก้ไขข้อมูลเครื่อง</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="overflow-y-auto p-5 space-y-3 flex-1">
          {fields.map(f => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-gray-500 mb-1">{f.label}</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form[f.key] || ''}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <div className="p-5 border-t flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
            ยกเลิก
          </button>
          <button
            onClick={() => { onSave(computer.id, form); onClose() }}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            บันทึก
          </button>
        </div>
      </div>
    </div>
  )
}
