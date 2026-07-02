import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { parseCsvText } from '../hooks/useComputers'

const REQUIRED_HEADERS = ['Hostname', 'Warranty Expiration', 'Model', 'Type', 'Room']

function validateHeaders(text) {
  const result = Papa.parse(text, { preview: 1, header: true, transformHeader: h => h.trim() })
  const found = result.meta?.fields || []
  const missing = REQUIRED_HEADERS.filter(h => !found.includes(h))
  return { found, missing }
}

export default function ImportCSV({ onImport, onBack, currentMeta }) {
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [step, setStep] = useState('upload') // upload | preview | done
  const [confirmReset, setConfirmReset] = useState(false)
  const inputRef = useRef()

  const processFile = (f) => {
    if (!f) return
    if (!f.name.endsWith('.csv')) { setError('กรุณาเลือกไฟล์ .csv เท่านั้น'); return }
    setFile(f)
    setError('')
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      const { found, missing } = validateHeaders(text)
      if (missing.length > 0) {
        setError(`ไม่พบคอลัมน์: ${missing.join(', ')} — กรุณาตรวจสอบไฟล์`)
        return
      }
      const data = parseCsvText(text)
      setPreview({ data, found, text })
      setStep('preview')
    }
    reader.readAsText(f, 'UTF-8')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    processFile(e.dataTransfer.files[0])
  }

  const handleConfirm = () => {
    const meta = {
      filename: file.name,
      rows: preview.data.length,
      importedAt: new Date().toISOString(),
    }
    onImport(preview.data, meta)
    setStep('done')
  }

  const handleReset = () => {
    setStep('upload')
    setFile(null)
    setPreview(null)
    setError('')
  }

  if (step === 'done') {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl">✅</div>
        <h2 className="text-2xl font-bold text-gray-800">นำเข้าข้อมูลสำเร็จ</h2>
        <p className="text-gray-500">โหลดข้อมูลจาก <span className="font-medium text-gray-700">{file?.name}</span> จำนวน <strong>{preview?.data.length}</strong> เครื่อง</p>
        <button onClick={onBack} className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">
          กลับหน้าหลัก
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-3xl">📥</span> นำเข้าข้อมูล CSV
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">อัปโหลดไฟล์ CSV ชุดใหม่เพื่อแทนที่ข้อมูลปัจจุบัน</p>
        </div>
        <button onClick={onBack} className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50">
          🏠 กลับหน้าหลัก
        </button>
      </div>

      {/* Current data banner */}
      {currentMeta ? (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📂</span>
            <div>
              <div className="font-semibold text-blue-800 text-sm">ข้อมูลปัจจุบัน: {currentMeta.filename}</div>
              <div className="text-xs text-blue-600 mt-0.5">
                {currentMeta.rows} เครื่อง · นำเข้าเมื่อ {new Date(currentMeta.importedAt).toLocaleString('th-TH')}
              </div>
            </div>
          </div>
          <button
            onClick={() => setConfirmReset(true)}
            className="px-4 py-2 bg-white border border-red-300 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50"
          >
            🔄 Reset กลับ dataset เดิม
          </button>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">📂</span>
          <div className="text-sm text-gray-600">
            <span className="font-medium">ข้อมูลปัจจุบัน:</span> computer.csv (ไฟล์เริ่มต้น)
          </div>
        </div>
      )}

      {/* Reset confirm modal */}
      {confirmReset && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-800 mb-2">ยืนยัน Reset ข้อมูล</h3>
            <p className="text-sm text-gray-500 mb-5">จะลบข้อมูลที่นำเข้ามาออกทั้งหมด และกลับไปใช้ไฟล์ <strong>computer.csv</strong> เดิม</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmReset(false)} className="px-4 py-2 rounded-xl border text-sm text-gray-600 hover:bg-gray-50">ยกเลิก</button>
              <button onClick={() => { onImport(null, null); setConfirmReset(false) }} className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600">Reset</button>
            </div>
          </div>
        </div>
      )}

      {step === 'upload' && (
        <div className="space-y-4">
          {/* Drag & drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-colors ${
              dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'
            }`}
          >
            <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={e => processFile(e.target.files[0])} />
            <div className="text-5xl mb-4">{dragOver ? '📂' : '📄'}</div>
            <p className="text-lg font-semibold text-gray-600">ลากไฟล์ CSV มาวางที่นี่</p>
            <p className="text-sm text-gray-400 mt-2">หรือคลิกเพื่อเลือกไฟล์</p>
            <p className="text-xs text-gray-400 mt-4">รองรับไฟล์ .csv เท่านั้น</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm flex items-start gap-2">
              <span className="text-lg leading-none mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Required columns info */}
          <div className="bg-gray-50 rounded-2xl p-5">
            <h3 className="font-semibold text-gray-700 text-sm mb-3">คอลัมน์ที่จำเป็นในไฟล์ CSV</h3>
            <div className="flex flex-wrap gap-2">
              {['Status','Hostname','Last User','Groups','Internal IP','OS','Serial Number',
                'Room','ShipDate','Warranty Expiration','Model','Type','AssetsTag','Notes'].map(h => (
                <span key={h} className={`text-xs px-3 py-1 rounded-full border font-mono ${
                  REQUIRED_HEADERS.includes(h)
                    ? 'bg-blue-100 border-blue-300 text-blue-700 font-semibold'
                    : 'bg-gray-100 border-gray-200 text-gray-500'
                }`}>{h}</span>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              <span className="inline-block w-3 h-3 bg-blue-100 border border-blue-300 rounded-full mr-1" />
              คอลัมน์จำเป็น · คอลัมน์อื่นถ้าไม่มีจะถูกเว้นว่าง
            </p>
          </div>
        </div>
      )}

      {step === 'preview' && preview && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <div className="font-semibold text-green-800">{file?.name}</div>
              <div className="text-sm text-green-600">พบ {preview.data.length} รายการ · {preview.found.length} คอลัมน์</div>
            </div>
          </div>

          {/* Preview table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="font-semibold text-gray-700">ตัวอย่างข้อมูล (10 แถวแรก)</span>
              <span className="text-sm text-gray-400">ทั้งหมด {preview.data.length} เครื่อง</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    {['#','Hostname','Last User','Model','Type','Room','Warranty Exp'].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {preview.data.slice(0, 10).map((c, i) => (
                    <tr key={i} className="hover:bg-gray-50/60">
                      <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                      <td className="px-3 py-2 font-mono text-blue-700 whitespace-nowrap">{c.hostname}</td>
                      <td className="px-3 py-2 text-gray-600">{c.lastUser.split('\\')[1] || c.lastUser}</td>
                      <td className="px-3 py-2 text-gray-600 max-w-48 truncate" title={c.model}>{c.model}</td>
                      <td className="px-3 py-2 text-gray-500">{c.type}</td>
                      <td className="px-3 py-2"><span className="bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">{c.room}</span></td>
                      <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                        {c.warrantyExp ? new Date(c.warrantyExp).toLocaleDateString('th-TH') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview.data.length > 10 && (
              <div className="px-5 py-2 border-t border-gray-100 text-xs text-gray-400 text-center">
                + อีก {preview.data.length - 10} รายการ
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <button onClick={handleReset} className="px-5 py-2.5 border border-gray-300 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">
              ← เลือกไฟล์ใหม่
            </button>
            <button onClick={handleConfirm} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 flex items-center gap-2">
              ✅ ยืนยันนำเข้าข้อมูล {preview.data.length} เครื่อง
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
