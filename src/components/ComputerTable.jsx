import { useState, useMemo } from 'react'
import { getWarrantyStatus } from '../hooks/useComputers'
import EditModal from './EditModal'

const WARRANTY_BADGE = {
  expired: 'bg-red-100 text-red-700',
  expiring: 'bg-yellow-100 text-yellow-700',
  ok: 'bg-green-100 text-green-700',
  unknown: 'bg-gray-100 text-gray-500',
}
const WARRANTY_LABEL = { expired: 'หมดแล้ว', expiring: 'ใกล้หมด', ok: 'ปกติ', unknown: '-' }

export default function ComputerTable({ computers, onUpdate, onExport, readOnly = false }) {
  const [search, setSearch] = useState('')
  const [filterRoom, setFilterRoom] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterWarranty, setFilterWarranty] = useState('')
  const [sortKey, setSortKey] = useState('hostname')
  const [sortDir, setSortDir] = useState('asc')
  const [editTarget, setEditTarget] = useState(null)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  const rooms = useMemo(() => [...new Set(computers.map(c => c.room).filter(Boolean))].sort(), [computers])
  const types = useMemo(() => [...new Set(computers.map(c => c.type).filter(Boolean))].sort(), [computers])

  const filtered = useMemo(() => {
    let data = computers
    if (search) {
      const s = search.toLowerCase()
      data = data.filter(c =>
        c.hostname.toLowerCase().includes(s) ||
        c.lastUser.toLowerCase().includes(s) ||
        c.room.toLowerCase().includes(s) ||
        c.model.toLowerCase().includes(s) ||
        c.serial.toLowerCase().includes(s) ||
        c.ip.includes(s) ||
        c.assetsTag.toLowerCase().includes(s)
      )
    }
    if (filterRoom) data = data.filter(c => c.room === filterRoom)
    if (filterType) data = data.filter(c => c.type === filterType)
    if (filterWarranty) data = data.filter(c => getWarrantyStatus(c.warrantyExp) === filterWarranty)
    return data.slice().sort((a, b) => {
      const av = a[sortKey] || ''
      const bv = b[sortKey] || ''
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }, [computers, search, filterRoom, filterType, filterWarranty, sortKey, sortDir])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <span className="opacity-20">↕</span>
    return <span>{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  const clearFilters = () => { setSearch(''); setFilterRoom(''); setFilterType(''); setFilterWarranty(''); setPage(1) }

  const formatDate = (d) => {
    if (!d) return '-'
    try { return new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) }
    catch { return d }
  }

  return (
    <div className="space-y-4">
      {editTarget && (
        <EditModal
          computer={editTarget}
          onSave={onUpdate}
          onClose={() => setEditTarget(null)}
        />
      )}

      <div className="flex flex-wrap gap-3 items-center">
        <input
          className="flex-1 min-w-48 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="ค้นหา hostname, user, IP, serial, model..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={filterRoom} onChange={e => { setFilterRoom(e.target.value); setPage(1) }}>
          <option value="">ทุก Room</option>
          {rooms.map(r => <option key={r}>{r}</option>)}
        </select>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1) }}>
          <option value="">ทุก Type</option>
          {types.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={filterWarranty} onChange={e => { setFilterWarranty(e.target.value); setPage(1) }}>
          <option value="">ทุก Warranty</option>
          <option value="expired">หมดแล้ว</option>
          <option value="expiring">ใกล้หมด (6 เดือน)</option>
          <option value="ok">ปกติ</option>
        </select>
        {(search || filterRoom || filterType || filterWarranty) && (
          <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-red-500 underline">ล้างตัวกรอง</button>
        )}
        <div className="ml-auto flex gap-2">
          <span className="text-sm text-gray-400">{filtered.length} รายการ</span>
          <button
            onClick={() => onExport(filtered)}
            className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 font-medium"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              {[
                ['hostname', 'Hostname'], ['lastUser', 'User'], ['room', 'Room'],
                ['type', 'Type'], ['model', 'Model'], ['ip', 'IP'],
                ['warrantyExp', 'Warranty'], ['status', 'Status'],
              ].map(([key, label]) => (
                <th
                  key={key}
                  className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap"
                  onClick={() => handleSort(key)}
                >
                  {label} <SortIcon col={key} />
                </th>
              ))}
              {!readOnly && <th className="px-4 py-3 text-center font-medium">แก้ไข</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paged.map(c => {
              const ws = getWarrantyStatus(c.warrantyExp)
              const rowBg = ws === 'expired' ? 'bg-red-50/50' : ws === 'expiring' ? 'bg-yellow-50/50' : ''
              return (
                <tr key={c.id} className={`hover:bg-blue-50/30 ${rowBg}`}>
                  <td className="px-4 py-3 font-mono font-medium text-blue-700 whitespace-nowrap">{c.hostname}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-36 truncate" title={c.lastUser}>
                    {c.lastUser.split('\\')[1] || c.lastUser}
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{c.room || '-'}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.type}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-48 truncate" title={c.model}>{c.model}</td>
                  <td className="px-4 py-3 font-mono text-gray-500 text-xs">{c.ip}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${WARRANTY_BADGE[ws]}`}>
                      {WARRANTY_LABEL[ws]}
                    </span>
                    <div className="text-xs text-gray-400 mt-0.5">{formatDate(c.warrantyExp)}</div>
                  </td>
                  <td className="px-4 py-3">
                    {c.status && (
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{c.status}</span>
                    )}
                  </td>
                  {!readOnly && (
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setEditTarget(c)}
                        className="text-xs text-blue-500 hover:text-blue-700 hover:underline"
                      >
                        แก้ไข
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2 justify-center">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1 rounded border text-sm disabled:opacity-30 hover:bg-gray-100"
          >←</button>
          <span className="text-sm text-gray-500">หน้า {page} / {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1 rounded border text-sm disabled:opacity-30 hover:bg-gray-100"
          >→</button>
        </div>
      )}
    </div>
  )
}
