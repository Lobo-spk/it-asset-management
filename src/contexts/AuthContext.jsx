import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const USERS_KEY = 'it_users'
const SESSION_KEY = 'it_session'

function hashPassword(pw) {
  // simple deterministic hash for localStorage-only auth
  let h = 0
  for (let i = 0; i < pw.length; i++) {
    h = Math.imul(31, h) + pw.charCodeAt(i) | 0
  }
  return h.toString(36)
}

const DEFAULT_USERS = [
  { id: 1, email: 'phothisan@lobo.co.th', name: 'Phothisan (Admin)', role: 'admin', passwordHash: hashPassword('03020911') },
  { id: 2, email: 'admin@company.com', name: 'Administrator', role: 'admin', passwordHash: hashPassword('admin1234') },
]

function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? JSON.parse(raw) : DEFAULT_USERS
  } catch { return DEFAULT_USERS }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(loadUsers)
  const [currentUser, setCurrentUser] = useState(loadSession)

  useEffect(() => { saveUsers(users) }, [users])

  const login = (email, password) => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (!user) return { ok: false, error: 'ไม่พบ email นี้ในระบบ' }
    if (user.passwordHash !== hashPassword(password)) return { ok: false, error: 'รหัสผ่านไม่ถูกต้อง' }
    const session = { id: user.id, email: user.email, name: user.name, role: user.role }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
    setCurrentUser(session)
    return { ok: true }
  }

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY)
    setCurrentUser(null)
  }

  const addUser = (data) => {
    const exists = users.find(u => u.email.toLowerCase() === data.email.toLowerCase())
    if (exists) return { ok: false, error: 'Email นี้มีอยู่แล้ว' }
    const newUser = {
      id: Math.max(...users.map(u => u.id), 0) + 1,
      email: data.email,
      name: data.name,
      role: data.role,
      passwordHash: hashPassword(data.password),
    }
    setUsers(p => [...p, newUser])
    return { ok: true }
  }

  const updateUser = (id, data) => {
    const dupEmail = users.find(u => u.email.toLowerCase() === data.email.toLowerCase() && u.id !== id)
    if (dupEmail) return { ok: false, error: 'Email นี้มีอยู่แล้ว' }
    setUsers(p => p.map(u => u.id === id ? {
      ...u,
      email: data.email,
      name: data.name,
      role: data.role,
      ...(data.password ? { passwordHash: hashPassword(data.password) } : {}),
    } : u))
    // refresh session if editing self
    if (currentUser?.id === id) {
      const updated = { ...currentUser, email: data.email, name: data.name, role: data.role }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated))
      setCurrentUser(updated)
    }
    return { ok: true }
  }

  const deleteUser = (id) => {
    setUsers(p => p.filter(u => u.id !== id))
  }

  const isAdmin = currentUser?.role === 'admin'

  return (
    <AuthContext.Provider value={{ currentUser, users, login, logout, addUser, updateUser, deleteUser, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
