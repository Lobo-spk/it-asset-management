export function getRoomDepartment(room) {
  const cleanRoom = (room || '').trim()
  if (!cleanRoom) return 'ไม่ระบุ'

  const prodPlanningGroup = ['PRO Mix', 'QC', 'PRO Sauce', 'office planning', 'office planning\t',
    'Equipment', 'Matchin', 'sticker', '2M01', '2M03', '2218', 'PRO Sauce']
  if (prodPlanningGroup.map(s => s.trim()).includes(cleanRoom)) return 'ผลิต / วางแผน'

  const qaGroup = ['QAD F.1', 'QAD F.2', 'QAD F.3', 'QA-Micro', 'QA-RAWMATERRIA', 'QC']
  if (qaGroup.includes(cleanRoom)) return 'ประกันคุณภาพ'

  const warehouseGroup = ['WAH K', 'BATCHING', 'WAH Office', 'WAH Checking', 'WAH Finished', 'WAH Package']
  if (warehouseGroup.includes(cleanRoom)) return 'คลัง'

  const ictGroup = ['ICT', '1M-1', '1M-3', '1M-4', 'Meeting-SP']
  if (ictGroup.includes(cleanRoom)) return 'ICT'

  const mapping = {
    'ACF': 'บัญชีและการเงิน',
    'HR': 'ทรัพยากรมนุษย์',
    'HR-SP': 'ทรัพยากรมนุษย์ สพ.',
    'QA-SP': 'ประกันคุณภาพ สพ.',
    'QS': 'ระบบคุณภาพ',
    'PRO-SP': 'ผลิต สพ.',
    'PUR': 'จัดซื้อ',
    'PUR-SP': 'จัดซื้อ สพ.',
    'RD': 'วิจัยและพัฒนาฯ',
    'RD-SPB': 'วิจัยและพัฒนาฯ สพ.',
    'SMK': 'ขายและการตลาด',
    'EEE-SP': 'วิศวกรรม-พลังงานและสิ่งแวดล้อม สพ.',
    'EEE': 'วิศวกรรม-พลังงานและสิ่งแวดล้อม',
    'ECM': 'ขายและการตลาด',
    'EEE-SM': 'วิศวกรรม-พลังงานและสิ่งแวดล้อม',
  }
  return mapping[cleanRoom] || cleanRoom
}

export function extractAssetCode(assetsTag) {
  if (!assetsTag) return ''
  const parts = assetsTag.trim().split(/\s+/)
  for (const p of parts) {
    if (/^\d{6,8}$/.test(p)) return p
  }
  return assetsTag.trim()
}

export function formatDateTH(dateStr) {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  } catch { return dateStr }
}

export function formatShipDate(shipDate) {
  if (!shipDate) return '-'
  // format: "2024-05" => "01/05/2024"
  const [y, m] = shipDate.split('-')
  if (!y || !m) return shipDate
  return `01/${m.padStart(2, '0')}/${y}`
}

export function getCurrentYearBE() {
  return new Date().getFullYear() + 543
}
