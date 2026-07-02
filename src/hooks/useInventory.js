import { useState, useEffect } from 'react'

const STORAGE_KEY = 'it_inventory'

const DEMO_DATA = [
  { id: 1, name: 'RAM DDR4 8GB', code: 'RAM-001', category: 'ram', quantity: 15, minQuantity: 5, unitPrice: 800, unit: 'ชิ้น', notes: '' },
  { id: 2, name: 'Mouse USB Optical', code: 'MSE-001', category: 'เมาส์', quantity: 1, minQuantity: 3, unitPrice: 350, unit: 'ชิ้น', notes: '' },
  { id: 3, name: 'Keyboard USB TH/EN', code: 'KBD-001', category: 'แป้นพิมพ์', quantity: 5, minQuantity: 3, unitPrice: 450, unit: 'ชิ้น', notes: '' },
]

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function useInventory() {
  const [items, setItems] = useState(() => load() ?? DEMO_DATA)
  const [nextId, setNextId] = useState(() => {
    const d = load()
    return d ? Math.max(...d.map(i => i.id), 0) + 1 : DEMO_DATA.length + 1
  })

  useEffect(() => { save(items) }, [items])

  const addItem = (item) => {
    const newItem = { ...item, id: nextId, code: item.code || `ITM-${String(nextId).padStart(3, '0')}` }
    setItems(p => [...p, newItem])
    setNextId(p => p + 1)
  }

  const updateItem = (id, updated) => {
    setItems(p => p.map(i => i.id === id ? { ...i, ...updated } : i))
  }

  const deleteItem = (id) => {
    setItems(p => p.filter(i => i.id !== id))
  }

  const adjustStock = (id, delta) => {
    setItems(p => p.map(i => i.id === id
      ? { ...i, quantity: Math.max(0, i.quantity + delta) }
      : i
    ))
  }

  return { items, addItem, updateItem, deleteItem, adjustStock }
}
