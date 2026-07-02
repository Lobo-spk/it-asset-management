import { useState } from 'react'
import { useComputers } from './hooks/useComputers'
import { useAuth } from './contexts/AuthContext'
import Dashboard from './components/Dashboard'
import ComputerTable from './components/ComputerTable'
import WarrantyAlerts from './components/WarrantyAlerts'
import BudgetAnalysis from './components/BudgetAnalysis'
import Inventory from './components/Inventory'
import UserManagement from './components/UserManagement'
import LoginPage from './components/LoginPage'
import WarrantyReport from './components/WarrantyReport'
import ImportCSV from './components/ImportCSV'
import SoftwareLicense from './components/SoftwareLicense'

const TABS = [
  { key: 'dashboard', label: 'Dashboard', roles: ['admin', 'user'] },
  { key: 'computers', label: 'รายการเครื่อง', roles: ['admin', 'user'] },
  { key: 'warranty', label: 'แจ้งเตือน Warranty', roles: ['admin', 'user'] },
  { key: 'budget', label: '📊 วิเคราะห์งบประมาณ', roles: ['admin', 'user'] },
  { key: 'inventory', label: '📦 คลังอะไหล่', roles: ['admin', 'user'] },
  { key: 'license', label: '🪪 License & MA', roles: ['admin', 'user'] },
  { key: 'report', label: '📋 รายงาน', roles: ['admin', 'user'] },
  { key: 'import', label: '📥 นำเข้าข้อมูล', roles: ['admin'] },
  { key: 'users', label: '👥 จัดการผู้ใช้', roles: ['admin'] },
]

const ROLE_BADGE = {
  admin: 'bg-purple-100 text-purple-700',
  user: 'bg-blue-100 text-blue-700',
}
const ROLE_LABEL = { admin: '👑 Admin', user: '👤 User' }

function AppContent() {
  const { computers, loading, error, importMeta, updateComputer, importData, resetToOriginal, exportCSV } = useComputers()
  const { currentUser, logout, isAdmin } = useAuth()
  const [tab, setTab] = useState('dashboard')
  const [showUserMenu, setShowUserMenu] = useState(false)

  const visibleTabs = TABS.filter(t => t.roles.includes(currentUser?.role))

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">กำลังโหลดข้อมูล...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
        <p className="font-medium">เกิดข้อผิดพลาด</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="shrink-0">
            <h1 className="text-lg font-bold text-gray-800">🖥 IT Asset Management</h1>
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              {computers.length} เครื่อง
              {importMeta && (
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  📂 {importMeta.filename}
                </span>
              )}
            </p>
          </div>

          <nav className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
            {visibleTabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  tab === t.key ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>

          {/* User menu */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowUserMenu(p => !p)}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 rounded-xl px-3 py-2 transition"
            >
              <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {currentUser?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold text-gray-700 leading-tight">{currentUser?.name}</div>
                <div className={`text-xs px-1.5 py-0.5 rounded-full inline-block mt-0.5 ${ROLE_BADGE[currentUser?.role]}`}>
                  {ROLE_LABEL[currentUser?.role]}
                </div>
              </div>
              <span className="text-gray-400 text-xs">▾</span>
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 w-56 z-30 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="font-semibold text-gray-800 text-sm">{currentUser?.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{currentUser?.email}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1.5 ${ROLE_BADGE[currentUser?.role]}`}>
                      {ROLE_LABEL[currentUser?.role]}
                    </span>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => { setTab('users'); setShowUserMenu(false) }}
                      className="w-full text-left px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                    >
                      👥 จัดการผู้ใช้งาน
                    </button>
                  )}
                  <button
                    onClick={() => { logout(); setShowUserMenu(false) }}
                    className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100"
                  >
                    🚪 ออกจากระบบ
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Read-only banner for users */}
      {!isAdmin && (
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-2 text-center text-xs text-blue-600">
          คุณกำลังใช้งานในโหมด <strong>อ่านอย่างเดียว</strong> — ติดต่อ Admin เพื่อขอสิทธิ์แก้ไขข้อมูล
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {tab === 'dashboard' && <Dashboard computers={computers} />}
        {tab === 'computers' && (
          <ComputerTable
            computers={computers}
            onUpdate={isAdmin ? updateComputer : null}
            onExport={exportCSV}
            readOnly={!isAdmin}
          />
        )}
        {tab === 'warranty' && <WarrantyAlerts computers={computers} />}
        {tab === 'budget' && <BudgetAnalysis computers={computers} onBack={() => setTab('dashboard')} />}
        {tab === 'inventory' && <Inventory onBack={() => setTab('dashboard')} readOnly={!isAdmin} />}
        {tab === 'license' && <SoftwareLicense />}
        {tab === 'report' && <WarrantyReport computers={computers} onBack={() => setTab('dashboard')} />}
        {tab === 'import' && isAdmin && (
          <ImportCSV
            currentMeta={importMeta}
            onImport={(data, meta) => {
              if (data === null) { resetToOriginal() }
              else { importData(data, meta) }
              setTab('dashboard')
            }}
            onBack={() => setTab('dashboard')}
          />
        )}
        {tab === 'users' && isAdmin && <UserManagement onBack={() => setTab('dashboard')} />}
      </main>
    </div>
  )
}

export default function App() {
  const { currentUser } = useAuth()
  if (!currentUser) return <LoginPage />
  return <AppContent />
}
