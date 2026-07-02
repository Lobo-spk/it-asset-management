import { useMemo } from 'react'
import { getWarrantyStatus } from '../hooks/useComputers'

export default function WarrantyAlerts({ computers }) {
  const alerts = useMemo(() => {
    const expired = []
    const expiring = []
    computers.forEach(c => {
      const s = getWarrantyStatus(c.warrantyExp)
      if (s === 'expired') expired.push(c)
      else if (s === 'expiring') expiring.push(c)
    })
    expired.sort((a, b) => new Date(a.warrantyExp) - new Date(b.warrantyExp))
    expiring.sort((a, b) => new Date(a.warrantyExp) - new Date(b.warrantyExp))
    return { expired, expiring }
  }, [computers])

  const formatDate = (d) => {
    if (!d) return '-'
    try { return new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) }
    catch { return d }
  }

  const diffDays = (d) => {
    if (!d) return null
    const days = Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24))
    return days
  }

  const Section = ({ title, items, color }) => (
    <div className={`rounded-xl border p-5 ${color}`}>
      <h3 className="font-bold text-base mb-4 flex items-center gap-2">
        {color.includes('red') ? '🔴' : '🟡'} {title}
        <span className="ml-auto text-2xl font-bold">{items.length}</span>
      </h3>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {items.length === 0 && <p className="text-sm opacity-60">ไม่มีรายการ</p>}
        {items.map(c => {
          const days = diffDays(c.warrantyExp)
          return (
            <div key={c.id} className="flex items-start justify-between bg-white/60 rounded-lg px-3 py-2 text-sm">
              <div>
                <div className="font-medium font-mono">{c.hostname}</div>
                <div className="text-xs opacity-60">{c.room} · {c.model}</div>
              </div>
              <div className="text-right text-xs shrink-0 ml-4">
                <div className="font-medium">{formatDate(c.warrantyExp)}</div>
                <div className="opacity-60">
                  {days === null ? '-' : days < 0 ? `หมดไปแล้ว ${Math.abs(days)} วัน` : `อีก ${days} วัน`}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Section title="Warranty หมดอายุแล้ว" items={alerts.expired} color="bg-red-50 border-red-200 text-red-800" />
      <Section title="หมดอายุภายใน 6 เดือน" items={alerts.expiring} color="bg-yellow-50 border-yellow-200 text-yellow-800" />
    </div>
  )
}
