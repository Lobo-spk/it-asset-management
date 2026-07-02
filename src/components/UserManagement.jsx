import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const EMPTY_FORM = { email: '', name: '', role: 'user', password: '', confirmPassword: '' }

function UserFormModal({ initial, onSave, onClose }) {
  const isEdit = !!initial
  const [form, setForm] = useState(initial
    ? { email: initial.email, name: initial.name, role: initial.role, password: '', confirmPassword: '' }
    : { ...EMPTY_FORM })
  const [error, setError] = useState('')

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError('') }

  const handleSave = () => {
    if (!form.email.trim() || !form.name.trim()) { setError('กรุณากรอกชื่อและ Email'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('รูปแบบ Email ไม่ถูกต้อง'); return }
    if (!isEdit && !form.password) { setError('กรุณากรอกรหัสผ่าน'); return }
    if (form.password && form.password.length < 6) { setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return }
    if (form.password && form.password !== form.confirmPassword) { setError('รหัสผ่านไม่ตรงกัน'); return }
    const result = onSave(form)
    if (result && !result.ok) { setError(result.error); return }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">{isEdit ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">ชื่อ-นามสกุล <span className="text-red-400">*</span></label>
            <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="ชื่อผู้ใช้..." value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Email <span className="text-red-400">*</span></label>
            <input type="email" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="email@company.com" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">สิทธิ์การใช้งาน</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {[['admin', '👑 Admin', 'เข้าถึงและแก้ไขได้ทุกอย่าง'], ['user', '👤 User', 'ดูข้อมูลได้อย่างเดียว']].map(([val, label, desc]) => (
                <button key={val} type="button"
                  onClick={() => set('role', val)}
                  className={`border-2 rounded-xl px-3 py-2.5 text-left transition ${form.role === val
                    ? val === 'admin' ? 'border-purple-500 bg-purple-50' : 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className={`text-sm font-semibold ${form.role === val ? (val === 'admin' ? 'text-purple-700' : 'text-blue-700') : 'text-gray-600'}`}>{label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              รหัสผ่าน {isEdit && <span className="text-gray-400">(เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยน)</span>}
              {!isEdit && <span className="text-red-400">*</span>}
            </label>
            <input type="password" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="อย่างน้อย 6 ตัวอักษร" value={form.password} onChange={e => set('password', e.target.value)} />
          </div>
          {form.password && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">ยืนยันรหัสผ่าน</label>
              <input type="password" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="พิมพ์รหัสผ่านอีกครั้ง" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} />
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">ยกเลิก</button>
          <button onClick={handleSave} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">บันทึก</button>
        </div>
      </div>
    </div>
  )
}

export default function UserManagement({ onBack }) {
  const { users, currentUser, addUser, updateUser, deleteUser } = useAuth()
  const [showAdd, setShowAdd] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const ROLE_STYLE = {
    admin: 'bg-purple-100 text-purple-700 border-purple-200',
    user: 'bg-blue-100 text-blue-700 border-blue-200',
  }
  const ROLE_LABEL = { admin: '👑 Admin', user: '👤 User' }

  return (
    <div className="space-y-6">
      {showAdd && (
        <UserFormModal onSave={addUser} onClose={() => setShowAdd(false)} />
      )}
      {editTarget && (
        <UserFormModal initial={editTarget} onSave={d => updateUser(editTarget.id, d)} onClose={() => setEditTarget(null)} />
      )}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-800 mb-2">ยืนยันการลบ</h3>
            <p className="text-sm text-gray-500 mb-5">ต้องการลบ <span className="font-semibold text-gray-700">"{confirmDelete.name}"</span> ออกจากระบบใช่ไหม?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-lg border text-sm text-gray-600 hover:bg-gray-50">ยกเลิก</button>
              <button onClick={() => { deleteUser(confirmDelete.id); setConfirmDelete(null) }} className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600">ลบ</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-3xl">👥</span> จัดการผู้ใช้งาน
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">กำหนดสิทธิ์การเข้าถึงระบบ</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowAdd(true)} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 flex items-center gap-2">
            + เพิ่มผู้ใช้ใหม่
          </button>
          <button onClick={onBack} className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 flex items-center gap-2">
            🏠 กลับหน้าหลัก
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between shadow-sm">
          <div><div className="text-sm text-gray-500">ผู้ใช้ทั้งหมด</div><div className="text-3xl font-bold text-gray-800 mt-1">{users.length}</div></div>
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">👥</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between shadow-sm">
          <div><div className="text-sm text-gray-500">Admin</div><div className="text-3xl font-bold text-purple-700 mt-1">{users.filter(u => u.role === 'admin').length}</div></div>
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">👑</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-700">รายชื่อผู้ใช้งานทั้งหมด</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-gray-500 font-medium">ชื่อ</th>
              <th className="px-6 py-3 text-left text-gray-500 font-medium">Email</th>
              <th className="px-6 py-3 text-center text-gray-500 font-medium">สิทธิ์</th>
              <th className="px-6 py-3 text-center text-gray-500 font-medium">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map(u => (
              <tr key={u.id} className={`hover:bg-gray-50/60 ${u.id === currentUser?.id ? 'bg-blue-50/30' : ''}`}>
                <td className="px-6 py-4">
                  <div className="font-semibold text-gray-800">{u.name}</div>
                  {u.id === currentUser?.id && <span className="text-xs text-blue-500">(คุณ)</span>}
                </td>
                <td className="px-6 py-4 text-gray-500">{u.email}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`border text-xs font-semibold px-3 py-1 rounded-full ${ROLE_STYLE[u.role]}`}>
                    {ROLE_LABEL[u.role]}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => setEditTarget(u)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-yellow-400 hover:text-yellow-600 transition-colors" title="แก้ไข">✏</button>
                    <button
                      disabled={u.id === currentUser?.id}
                      onClick={() => setConfirmDelete(u)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-red-400 hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="ลบ"
                    >🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700 flex gap-3">
        <span className="text-lg">💡</span>
        <div>
          <strong>หมายเหตุ:</strong> ไม่สามารถลบบัญชีของตัวเองได้ หากต้องการเปลี่ยนสิทธิ์ตัวเองให้ใช้ Admin คนอื่นแก้ไขให้
        </div>
      </div>
    </div>
  )
}
