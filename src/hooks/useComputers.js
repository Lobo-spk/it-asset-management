import { useState, useEffect, useCallback } from 'react'
import Papa from 'papaparse'

const STORAGE_KEY = 'it_computers_data'
const META_KEY    = 'it_computers_meta'

function parseRows(rawData) {
  return rawData.map((row, i) => ({
    id: i,
    status:     row['Status']?.trim() || '',
    hostname:   row['Hostname']?.trim() || '',
    lastUser:   row['Last User']?.trim() || '',
    groups:     row['Groups']?.trim() || '',
    ip:         row['Internal IP']?.trim() || '',
    os:         row['OS']?.trim() || '',
    serial:     row['Serial Number']?.trim() || '',
    room:       row['Room']?.trim() || '',
    shipDate:   row['ShipDate']?.trim() || '',
    warrantyExp:row['Warranty Expiration']?.trim() || '',
    model:      row['Model']?.trim() || '',
    type:       row['Type']?.trim() || '',
    assetsTag:  row['AssetsTag']?.trim() || '',
    notes:      row['Notes']?.trim() || '',
  }))
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function getImportMeta() {
  try {
    const raw = localStorage.getItem(META_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function saveImport(data, meta) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  localStorage.setItem(META_KEY, JSON.stringify(meta))
}

export function clearImport() {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(META_KEY)
}

export function parseCsvText(text) {
  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: h => h.trim(),
  })
  return parseRows(result.data)
}

export function useComputers() {
  const [computers, setComputers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [importMeta, setImportMeta] = useState(getImportMeta)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    const stored = loadFromStorage()
    if (stored) {
      setComputers(stored)
      setImportMeta(getImportMeta())
      setLoading(false)
      return
    }
    fetch(import.meta.env.BASE_URL + 'computer.csv')
      .then(r => r.text())
      .then(text => {
        const result = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: h => h.trim(),
        })
        setComputers(parseRows(result.data))
        setLoading(false)
      })
      .catch(e => {
        setError(e.message)
        setLoading(false)
      })
  }, [])

  useEffect(() => { load() }, [load])

  const updateComputer = (id, updated) => {
    setComputers(prev => {
      const next = prev.map(c => c.id === id ? { ...c, ...updated } : c)
      // persist edits to localStorage if we're in imported mode
      if (loadFromStorage()) localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const importData = (data, meta) => {
    saveImport(data, meta)
    setComputers(data)
    setImportMeta(meta)
  }

  const resetToOriginal = () => {
    clearImport()
    setImportMeta(null)
    load()
  }

  const exportCSV = (data) => {
    const headers = ['Status','Hostname','Last User','Groups','Internal IP','OS','Serial Number','Room','ShipDate','Warranty Expiration','Model','Type','AssetsTag','Notes']
    const rows = data.map(c => [
      c.status, c.hostname, c.lastUser, c.groups, c.ip, c.os,
      c.serial, c.room, c.shipDate, c.warrantyExp, c.model, c.type,
      c.assetsTag, c.notes
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${(v||'').replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'computers_export.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return { computers, loading, error, importMeta, updateComputer, importData, resetToOriginal, exportCSV }
}

export function getWarrantyStatus(warrantyExp) {
  if (!warrantyExp) return 'unknown'
  const exp = new Date(warrantyExp)
  const now = new Date()
  const diffDays = (exp - now) / (1000 * 60 * 60 * 24)
  if (diffDays < 0) return 'expired'
  if (diffDays <= 180) return 'expiring'
  return 'ok'
}
