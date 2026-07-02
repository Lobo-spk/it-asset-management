import { useMemo } from 'react'
import { getWarrantyStatus } from '../hooks/useComputers'

function StatCard({ title, value, sub, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  }
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <div className="text-sm font-medium opacity-70">{title}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
      {sub && <div className="text-xs mt-1 opacity-60">{sub}</div>}
    </div>
  )
}

export default function Dashboard({ computers }) {
  const stats = useMemo(() => {
    const total = computers.length
    const desktops = computers.filter(c => c.type === 'Desktop').length
    const laptops = computers.filter(c => c.type === 'Laptop').length
    const newComputers = computers.filter(c => c.status === 'New Computer').length

    const warrantyCount = { expired: 0, expiring: 0, ok: 0, unknown: 0 }
    computers.forEach(c => {
      warrantyCount[getWarrantyStatus(c.warrantyExp)]++
    })

    const roomMap = {}
    computers.forEach(c => {
      const r = c.room || 'Unknown'
      roomMap[r] = (roomMap[r] || 0) + 1
    })
    const rooms = Object.entries(roomMap).sort((a, b) => b[1] - a[1])

    const modelMap = {}
    computers.forEach(c => {
      if (c.model) modelMap[c.model] = (modelMap[c.model] || 0) + 1
    })
    const topModels = Object.entries(modelMap).sort((a, b) => b[1] - a[1]).slice(0, 5)

    return { total, desktops, laptops, newComputers, warrantyCount, rooms, topModels }
  }, [computers])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="เครื่องทั้งหมด" value={stats.total} color="blue" />
        <StatCard title="Desktop" value={stats.desktops} sub={`${Math.round(stats.desktops/stats.total*100)}%`} color="purple" />
        <StatCard title="Laptop" value={stats.laptops} sub={`${Math.round(stats.laptops/stats.total*100)}%`} color="purple" />
        <StatCard title="New Computer" value={stats.newComputers} color="green" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Warranty หมดแล้ว" value={stats.warrantyCount.expired} color="red" />
        <StatCard title="หมดภายใน 6 เดือน" value={stats.warrantyCount.expiring} color="yellow" />
        <StatCard title="Warranty ปกติ" value={stats.warrantyCount.ok} color="green" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-700 mb-3">เครื่องแยกตาม Room</h3>
          <div className="space-y-2">
            {stats.rooms.map(([room, count]) => (
              <div key={room} className="flex items-center gap-2">
                <div className="w-28 text-sm text-gray-600 truncate">{room}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                  <div
                    className="bg-blue-400 h-5 rounded-full flex items-center justify-end pr-2"
                    style={{ width: `${(count / stats.rooms[0][1]) * 100}%` }}
                  >
                    <span className="text-xs text-white font-medium">{count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-700 mb-3">Top 5 รุ่นที่ใช้มากสุด</h3>
          <div className="space-y-2">
            {stats.topModels.map(([model, count]) => (
              <div key={model} className="flex items-center gap-2">
                <div className="flex-1 text-sm text-gray-600 truncate">{model}</div>
                <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
