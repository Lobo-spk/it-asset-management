import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts'

const CE_TO_BE = 543

function toBuddhistYear(dateStr) {
  if (!dateStr) return null
  try {
    const year = new Date(dateStr).getFullYear()
    if (isNaN(year)) return null
    return year + CE_TO_BE
  } catch { return null }
}

function getShipYear(shipDate) {
  if (!shipDate) return null
  const y = parseInt(shipDate.split('-')[0])
  return isNaN(y) ? null : y
}

export default function BudgetAnalysis({ computers, onBack }) {
  const [price, setPrice] = useState(30000)
  const [highlightYear, setHighlightYear] = useState(null)

  const currentYearBE = new Date().getFullYear() + CE_TO_BE
  const nextYearBE = currentYearBE + 1

  const stats = useMemo(() => {
    const total = computers.length
    const desktops = computers.filter(c => c.type === 'Desktop').length
    const laptops = computers.filter(c => c.type === 'Laptop').length

    // Machines older than 5 years (based on ShipDate)
    const fiveYearsAgo = new Date().getFullYear() - 5
    const oldMachines = computers.filter(c => {
      const y = getShipYear(c.shipDate)
      return y !== null && y <= fiveYearsAgo
    })

    // Budget next year = machines with warranty expiring next year
    const nextYearMachines = computers.filter(c => toBuddhistYear(c.warrantyExp) === nextYearBE)
    const budgetNextYear = nextYearMachines.length * price

    // Group by warranty expiration year (BE)
    const yearMap = {}
    computers.forEach(c => {
      const yr = toBuddhistYear(c.warrantyExp)
      const key = yr ? `ปี พ.ศ. ${yr}` : 'ปี พ.ศ. ไม่ระบุ'
      if (!yearMap[key]) yearMap[key] = { year: key, yearNum: yr || 0, Desktop: 0, Laptop: 0 }
      if (c.type === 'Desktop') yearMap[key].Desktop++
      else if (c.type === 'Laptop') yearMap[key].Laptop++
    })

    const chartData = Object.values(yearMap)
      .sort((a, b) => a.yearNum - b.yearNum)
      .map(d => ({ ...d, total: d.Desktop + d.Laptop }))

    return { total, desktops, laptops, oldMachines, budgetNextYear, nextYearMachines, chartData }
  }, [computers, price, nextYearBE])

  const tableData = stats.chartData.filter(d => d.total > 0)

  const highlightedMachines = useMemo(() => {
    if (!highlightYear) return []
    return computers.filter(c => {
      const yr = toBuddhistYear(c.warrantyExp)
      return yr && `ปี พ.ศ. ${yr}` === highlightYear
    })
  }, [highlightYear, computers])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            🚀 ระบบวิเคราะห์ข้อมูลคอมพิวเตอร์อัจฉริยะ
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600 font-medium">ราคาต่อเครื่อง (บาท)</label>
          <input
            type="number"
            min={0}
            step={1000}
            value={price}
            onChange={e => setPrice(Number(e.target.value) || 0)}
            className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center gap-2"
          >
            ⬅ กลับหน้าหลัก
          </button>
        </div>
      </div>

      {/* Stat Cards Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-600 text-white rounded-2xl p-5">
          <div className="text-sm opacity-80 font-medium mb-1">งบประมาณปีหน้า ({nextYearBE})</div>
          <div className="text-3xl font-bold">{stats.budgetNextYear.toLocaleString()} บาท</div>
          <div className="text-xs opacity-60 mt-1">{stats.nextYearMachines.length} เครื่อง × {price.toLocaleString()} บาท</div>
        </div>

        <div
          className="bg-amber-500 text-white rounded-2xl p-5 cursor-pointer hover:bg-amber-600 transition-colors"
          onClick={() => setHighlightYear(highlightYear === '__old__' ? null : '__old__')}
        >
          <div className="text-sm opacity-80 font-medium mb-1 flex items-center gap-1">
            ⚠ เครื่องอายุเกิน 5 ปี <span className="text-xs">(คลิกเพื่อดูรายชื่อ)</span>
          </div>
          <div className="text-3xl font-bold">{stats.oldMachines.length} เครื่อง</div>
          <div className="text-xs opacity-60 mt-1 underline">คลิกเพื่อดูรายละเอียด</div>
        </div>

        <div className="bg-green-600 text-white rounded-2xl p-5">
          <div className="text-sm opacity-80 font-medium mb-1">จำนวนเครื่องรวมทั้งหมด</div>
          <div className="text-3xl font-bold">{stats.total} เครื่อง</div>
        </div>
      </div>

      {/* Stat Cards Row 2 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-purple-600 text-white rounded-2xl p-5 flex items-center gap-4">
          <div className="text-3xl">💻</div>
          <div>
            <div className="text-sm opacity-80 font-medium">Laptop / Notebook</div>
            <div className="text-3xl font-bold">{stats.laptops} เครื่อง</div>
          </div>
        </div>
        <div className="bg-blue-500 text-white rounded-2xl p-5 flex items-center gap-4">
          <div className="text-3xl">🖥</div>
          <div>
            <div className="text-sm opacity-80 font-medium">Desktop PC</div>
            <div className="text-3xl font-bold">{stats.desktops} เครื่อง</div>
          </div>
        </div>
      </div>

      {/* Old machines detail */}
      {highlightYear === '__old__' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h3 className="font-bold text-amber-800 mb-3">
            เครื่องอายุเกิน 5 ปี ({stats.oldMachines.length} เครื่อง)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-amber-100 text-amber-800">
                <tr>
                  {['Hostname', 'User', 'Room', 'Type', 'Model', 'ShipDate'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {stats.oldMachines.map(c => (
                  <tr key={c.id} className="hover:bg-amber-50">
                    <td className="px-3 py-2 font-mono text-xs text-blue-700">{c.hostname}</td>
                    <td className="px-3 py-2 text-gray-600">{c.lastUser.split('\\')[1] || c.lastUser}</td>
                    <td className="px-3 py-2"><span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{c.room}</span></td>
                    <td className="px-3 py-2 text-gray-600">{c.type}</td>
                    <td className="px-3 py-2 text-gray-600 max-w-48 truncate" title={c.model}>{c.model}</td>
                    <td className="px-3 py-2 text-gray-500">{c.shipDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-700 mb-4 text-center">
          สถิติเครื่องแยกตามปีโดยแยกตามประเภท (Stacked)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              angle={-30}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
            <Tooltip
              formatter={(v, name) => [`${v} เครื่อง`, name]}
              labelStyle={{ fontWeight: 'bold' }}
            />
            <Legend />
            <Bar dataKey="Desktop" stackId="a" fill="#3b82f6" name="Desktop" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Laptop" stackId="a" fill="#a855f7" name="Laptop / Notebook" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-5 py-3 text-left font-semibold">ปี พ.ศ. ที่หมดอายุ</th>
              <th className="px-5 py-3 text-center font-semibold text-blue-600">Desktop</th>
              <th className="px-5 py-3 text-center font-semibold text-purple-600">Laptop</th>
              <th className="px-5 py-3 text-center font-semibold">รวม</th>
              <th className="px-5 py-3 text-right font-semibold text-green-700">งบประมาณ (@{price.toLocaleString()})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tableData.map(row => {
              const isNext = row.yearNum === nextYearBE
              return (
                <tr
                  key={row.year}
                  className={`cursor-pointer transition-colors ${
                    isNext ? 'bg-blue-50 font-semibold' :
                    highlightYear === row.year ? 'bg-yellow-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setHighlightYear(highlightYear === row.year ? null : row.year)}
                >
                  <td className="px-5 py-3 text-gray-700">
                    {row.year}
                    {isNext && <span className="ml-2 text-xs bg-blue-200 text-blue-700 px-2 py-0.5 rounded-full">ปีหน้า</span>}
                  </td>
                  <td className="px-5 py-3 text-center text-blue-600">{row.Desktop || 0}</td>
                  <td className="px-5 py-3 text-center text-purple-600">{row.Laptop || 0}</td>
                  <td className="px-5 py-3 text-center font-medium">{row.total}</td>
                  <td className="px-5 py-3 text-right text-green-700 font-medium">
                    {(row.total * price).toLocaleString()} บาท
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className="bg-gray-50 border-t-2 border-gray-200">
            <tr>
              <td className="px-5 py-3 font-bold text-gray-700">รวมทั้งหมด</td>
              <td className="px-5 py-3 text-center font-bold text-blue-600">{stats.desktops}</td>
              <td className="px-5 py-3 text-center font-bold text-purple-600">{stats.laptops}</td>
              <td className="px-5 py-3 text-center font-bold">{stats.total}</td>
              <td className="px-5 py-3 text-right font-bold text-green-700">
                {(stats.total * price).toLocaleString()} บาท
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Drill-down detail */}
      {highlightYear && highlightYear !== '__old__' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
          <h3 className="font-bold text-yellow-800 mb-3">
            รายชื่อเครื่องที่หมดอายุ {highlightYear} ({highlightedMachines.length} เครื่อง)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-yellow-100 text-yellow-800">
                <tr>
                  {['Hostname', 'User', 'Room', 'Type', 'Model', 'Warranty หมด'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-yellow-100">
                {highlightedMachines.map(c => (
                  <tr key={c.id} className="hover:bg-yellow-50/50">
                    <td className="px-3 py-2 font-mono text-xs text-blue-700">{c.hostname}</td>
                    <td className="px-3 py-2 text-gray-600">{c.lastUser.split('\\')[1] || c.lastUser}</td>
                    <td className="px-3 py-2"><span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{c.room}</span></td>
                    <td className="px-3 py-2 text-gray-600">{c.type}</td>
                    <td className="px-3 py-2 text-gray-600 max-w-48 truncate" title={c.model}>{c.model}</td>
                    <td className="px-3 py-2 text-gray-500">
                      {c.warrantyExp ? new Date(c.warrantyExp).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
