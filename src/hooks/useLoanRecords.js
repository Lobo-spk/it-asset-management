import { useState, useEffect } from 'react'

const STORAGE_KEY = 'it_loan_records'

export function getLoanStatus(record) {
  if (record.returnDate) return 'returned'
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const due = new Date(record.dueDate)
  return due < today ? 'overdue' : 'active'
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function useLoanRecords() {
  const [records, setRecords] = useState(load)

  useEffect(() => { save(records) }, [records])

  const addRecord = (data) => {
    setRecords(prev => {
      const maxId = prev.reduce((m, r) => Math.max(m, r.id), 0)
      const next = [...prev, { ...data, id: maxId + 1, createdAt: new Date().toISOString() }]
      save(next); return next
    })
  }

  const updateRecord = (id, data) => {
    setRecords(prev => {
      const next = prev.map(r => r.id === id ? { ...r, ...data } : r)
      save(next); return next
    })
  }

  const returnRecord = (id, returnDate) => {
    setRecords(prev => {
      const next = prev.map(r => r.id === id ? { ...r, returnDate } : r)
      save(next); return next
    })
  }

  const deleteRecord = (id) => {
    setRecords(prev => {
      const next = prev.filter(r => r.id !== id)
      save(next); return next
    })
  }

  return { records, addRecord, updateRecord, returnRecord, deleteRecord }
}
