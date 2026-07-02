import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) { setError('กรุณากรอกข้อมูลให้ครบ'); return }
    setLoading(true)
    setError('')
    await new Promise(r => setTimeout(r, 400))
    const result = login(email, password)
    setLoading(false)
    if (!result.ok) setError(result.error)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg mb-4">
            <span className="text-3xl">🖥</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">IT Asset Management</h1>
          <p className="text-sm text-gray-400 mt-1">ระบบจัดการทรัพย์สินไอที</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-lg font-bold text-gray-700 mb-6">เข้าสู่ระบบ</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Email</label>
              <input
                type="email"
                autoComplete="email"
                placeholder="example@company.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">รหัสผ่าน</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
                >
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> กำลังเข้าสู่ระบบ...</>
                : 'เข้าสู่ระบบ'}
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center mb-3">บัญชีทดสอบ</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setEmail('admin@company.com'); setPassword('admin1234'); setError('') }}
                className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl px-3 py-2.5 text-left transition"
              >
                <div className="font-semibold flex items-center gap-1"><span>👑</span> Admin</div>
                <div className="opacity-60 mt-0.5">admin@company.com</div>
              </button>
              <button
                type="button"
                onClick={() => { setEmail('user@company.com'); setPassword('user1234'); setError('') }}
                className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl px-3 py-2.5 text-left transition"
              >
                <div className="font-semibold flex items-center gap-1"><span>👤</span> User</div>
                <div className="opacity-60 mt-0.5">user@company.com</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
