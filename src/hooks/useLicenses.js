import { useState, useCallback } from 'react'

const STORAGE_KEY = 'it_licenses_data'

const DEFAULT_LICENSES = [
  { id: 1,  name: 'Gmail Google Workspace', type: 'รายปี', totalLicense: 255, usedLicense: 254, expiryDate: '2027-02-15', vendor: 'บริษัท แทนเจอรีน จำกัด', category: 'software', renew: true },
  { id: 2,  name: 'antivirus', type: 'รายปี', totalLicense: 270, usedLicense: 270, expiryDate: '2027-06-02', vendor: 'บริษัท skysoft', category: 'software', renew: true },
  { id: 3,  name: 'Panda Systems Management', type: 'รายปี', totalLicense: 270, usedLicense: 270, expiryDate: '2026-10-16', vendor: 'บริษัท skysoft', category: 'software', renew: true },
  { id: 4,  name: 'Microsoft 365 Business Standard', type: 'รายปี', totalLicense: 5, usedLicense: 5, expiryDate: '2027-06-16', vendor: 'RAFA Technology Co., Ltd.', category: 'software', renew: true },
  { id: 5,  name: 'Power BI Pro', type: 'รายปี', totalLicense: 9, usedLicense: 9, expiryDate: '2027-06-16', vendor: 'RAFA Technology Co., Ltd.', category: 'software', renew: true },
  { id: 6,  name: 'Power Automate Premium', type: 'รายปี', totalLicense: 1, usedLicense: 1, expiryDate: '2027-06-16', vendor: 'RAFA Technology Co., Ltd.', category: 'software', renew: true },
  { id: 7,  name: 'Adobe Creative Cloud', type: 'รายปี', totalLicense: 2, usedLicense: 2, expiryDate: '2027-04-27', vendor: 'I.T. Solution Computer (Thailand) Co., Ltd.', category: 'software', renew: true },
  { id: 8,  name: 'AutoCAD LT (eng_globofoods@lobo.co.th)', type: 'รายปี', totalLicense: 1, usedLicense: 1, expiryDate: '2027-07-04', vendor: 'I.T. Solution Computer (Thailand) Co., Ltd.', category: 'software', renew: true },
  { id: 9,  name: 'AutoCAD LT (energy@lobo.co.th)', type: 'รายปี', totalLicense: 1, usedLicense: 1, expiryDate: '2027-07-04', vendor: 'I.T. Solution Computer (Thailand) Co., Ltd.', category: 'software', renew: true },
  { id: 10, name: 'AutoCAD LT (surasak@globofoods.com)', type: 'รายปี', totalLicense: 1, usedLicense: 1, expiryDate: '2027-03-19', vendor: 'I.T. Solution Computer (Thailand) Co., Ltd.', category: 'software', renew: true },
  { id: 11, name: 'SketchUp Pro ใช้เครื่องคุณเอ็ม ผจก.EEE', type: 'รายปี', totalLicense: 1, usedLicense: 1, expiryDate: '2027-02-02', vendor: '2Beshop', category: 'software', renew: true },
  { id: 12, name: 'MA ปริ้นเตอร์ epson', type: 'รายปี', totalLicense: 30, usedLicense: 1, expiryDate: '2027-06-29', vendor: 'The Best Print service จำกัด', category: 'ma', renew: true },
  { id: 13, name: 'MA ปริ้นเตอร์ junimake QC (20410008V9)', type: 'รายปี', totalLicense: 1, usedLicense: 1, expiryDate: '2027-06-30', vendor: 'บริษัท คอมพิวเตอร์ เพอริเฟอรัล แอนด์ ซัพพลายส์ จำกัด', category: 'ma', renew: true },
  { id: 14, name: 'MA ปริ้นเตอร์ junimake คลัง (20410009V9)', type: 'รายปี', totalLicense: 1, usedLicense: 1, expiryDate: '2027-07-01', vendor: 'บริษัท คอมพิวเตอร์ เพอริเฟอรัล แอนด์ ซัพพลายส์ จำกัด', category: 'ma', renew: true },
  { id: 15, name: 'MA ปริ้นเตอร์ junimake คลัง สพ. (23110006AYB)', type: 'รายปี', totalLicense: 1, usedLicense: 1, expiryDate: '2027-07-02', vendor: 'บริษัท คอมพิวเตอร์ เพอริเฟอรัล แอนด์ ซัพพลายส์ จำกัด', category: 'ma', renew: true },
  { id: 16, name: 'MA ปริ้นเตอร์ BP-9000 ACF', type: 'รายปี', totalLicense: 1, usedLicense: 1, expiryDate: null, vendor: 'บริษัท เอ็ม ซีเซลส์แอนด์ซอร์วิสจำกัด', category: 'ma', renew: true },
  { id: 17, name: 'MA ปริ้นเตอร์ FB-600 คุณชวัลลักษณ์ (EA01126)', type: 'รายปี', totalLicense: 1, usedLicense: 1, expiryDate: null, vendor: 'บริษัท เอ็ม ซีเซลส์แอนด์ซอร์วิสจำกัด', category: 'ma', renew: true },
  { id: 18, name: 'MA ปริ้นเตอร์ FB-600 คุณส่งศรี (EA02225)', type: 'รายปี', totalLicense: 1, usedLicense: 1, expiryDate: null, vendor: 'บริษัท เอ็ม ซีเซลส์แอนด์ซอร์วิสจำกัด', category: 'ma', renew: true },
  { id: 19, name: 'MA ปริ้นเตอร์ FB-600 แนน (EA02459)', type: 'รายปี', totalLicense: 1, usedLicense: 1, expiryDate: null, vendor: 'บริษัท เอ็ม ซีเซลส์แอนด์ซอร์วิสจำกัด', category: 'ma', renew: true },
  { id: 20, name: 'MA ปริ้นเตอร์ FB-630E จ๋า (EA05060)', type: 'รายปี', totalLicense: 1, usedLicense: 1, expiryDate: null, vendor: 'บริษัท เอ็ม ซีเซลส์แอนด์ซอร์วิสจำกัด', category: 'ma', renew: true },
  { id: 21, name: 'MA ปริ้นเตอร์ FB-630E 2M03/2M01 (EA05052)', type: 'รายปี', totalLicense: 1, usedLicense: 1, expiryDate: null, vendor: 'บริษัท เอ็ม ซีเซลส์แอนด์ซอร์วิสจำกัด', category: 'ma', renew: true },
  { id: 22, name: 'MA ปริ้นเตอร์ FB-630E คุณแลง (EA05044)', type: 'รายปี', totalLicense: 1, usedLicense: 1, expiryDate: null, vendor: 'บริษัท เอ็ม ซีเซลส์แอนด์ซอร์วิสจำกัด', category: 'ma', renew: true },
  { id: 23, name: 'MA ปริ้นเตอร์ FB-600 คุณเยาวรัตน์ (EA02451)', type: 'รายปี', totalLicense: 1, usedLicense: 1, expiryDate: null, vendor: 'บริษัท เอ็ม ซีเซลส์แอนด์ซอร์วิสจำกัด', category: 'ma', renew: true },
  { id: 24, name: 'MA ปริ้นเตอร์ FB-600 คุณเยาวรัตน์ (EA02582)', type: 'รายปี', totalLicense: 1, usedLicense: 1, expiryDate: null, vendor: 'บริษัท เอ็ม ซีเซลส์แอนด์ซอร์วิสจำกัด', category: 'ma', renew: true },
  { id: 25, name: 'MA ปริ้นเตอร์ FB-600 สำนักงานฝ่ายขาย (EA02579)', type: 'รายปี', totalLicense: 1, usedLicense: 1, expiryDate: null, vendor: 'บริษัท เอ็ม ซีเซลส์แอนด์ซอร์วิสจำกัด', category: 'ma', renew: true },
  { id: 26, name: 'MA ปริ้นเตอร์ FB-600 ICT (EA00823)', type: 'รายปี', totalLicense: 1, usedLicense: 1, expiryDate: null, vendor: 'บริษัท เอ็ม ซีเซลส์แอนด์ซอร์วิสจำกัด', category: 'ma', renew: true },
  { id: 27, name: 'MA ปริ้นเตอร์ FB-600 ICT (EA02206)', type: 'รายปี', totalLicense: 1, usedLicense: 1, expiryDate: null, vendor: 'บริษัท เอ็ม ซีเซลส์แอนด์ซอร์วิสจำกัด', category: 'ma', renew: true },
  { id: 28, name: 'MA ปริ้นเตอร์ FB-600 คลังสำนักงาน (EA02577)', type: 'รายปี', totalLicense: 1, usedLicense: 1, expiryDate: null, vendor: 'บริษัท เอ็ม ซีเซลส์แอนด์ซอร์วิสจำกัด', category: 'ma', renew: true },
  { id: 29, name: 'MA ปริ้นเตอร์ FB-600 Batching (EA02585)', type: 'รายปี', totalLicense: 1, usedLicense: 1, expiryDate: null, vendor: 'บริษัท เอ็ม ซีเซลส์แอนด์ซอร์วิสจำกัด', category: 'ma', renew: true },
  { id: 30, name: 'MA ปริ้นเตอร์ FB-630 Batching2 (EA05063)', type: 'รายปี', totalLicense: 1, usedLicense: 1, expiryDate: null, vendor: 'บริษัท เอ็ม ซีเซลส์แอนด์ซอร์วิสจำกัด', category: 'ma', renew: true },
  { id: 31, name: 'MA ปริ้นเตอร์ FB-600 วางแผน สพ (EA05036)', type: 'รายปี', totalLicense: 1, usedLicense: 1, expiryDate: null, vendor: 'บริษัท เอ็ม ซีเซลส์แอนด์ซอร์วิสจำกัด', category: 'ma', renew: true },
  { id: 32, name: 'MA ปริ้นเตอร์ FB-600 สนง.เครื่องแกง สพ. (EA02460)', type: 'รายปี', totalLicense: 1, usedLicense: 1, expiryDate: null, vendor: 'บริษัท เอ็ม ซีเซลส์แอนด์ซอร์วิสจำกัด', category: 'ma', renew: true },
  { id: 33, name: 'MA ปริ้นเตอร์ FB-600 สำนักงานผลิต ABW (EA02329)', type: 'รายปี', totalLicense: 1, usedLicense: 1, expiryDate: null, vendor: 'บริษัท เอ็ม ซีเซลส์แอนด์ซอร์วิสจำกัด', category: 'ma', renew: true },
  { id: 34, name: 'MA ปริ้นเตอร์ FB-630 คลังวัตถุดิบ สพ (EA02313)', type: 'รายปี', totalLicense: 1, usedLicense: 1, expiryDate: null, vendor: 'บริษัท เอ็ม ซีเซลส์แอนด์ซอร์วิสจำกัด', category: 'ma', renew: true },
]

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getLicenseStatus(expiryDate) {
  if (!expiryDate) return 'no-date'
  const exp = new Date(expiryDate)
  const now = new Date()
  const diffDays = (exp - now) / (1000 * 60 * 60 * 24)
  if (diffDays < 0) return 'expired'
  if (diffDays <= 90) return 'expiring'
  return 'ok'
}

export function useLicenses() {
  const [licenses, setLicenses] = useState(() => load() || DEFAULT_LICENSES)

  const persist = useCallback((data) => {
    save(data)
    setLicenses(data)
  }, [])

  const addLicense = useCallback((item) => {
    setLicenses(prev => {
      const maxId = prev.reduce((m, x) => Math.max(m, x.id), 0)
      const next = [...prev, { ...item, id: maxId + 1 }]
      save(next)
      return next
    })
  }, [])

  const updateLicense = useCallback((id, updated) => {
    setLicenses(prev => {
      const next = prev.map(x => x.id === id ? { ...x, ...updated } : x)
      save(next)
      return next
    })
  }, [])

  const deleteLicense = useCallback((id) => {
    setLicenses(prev => {
      const next = prev.filter(x => x.id !== id)
      save(next)
      return next
    })
  }, [])

  const resetToDefault = useCallback(() => {
    persist(DEFAULT_LICENSES)
  }, [persist])

  return { licenses, addLicense, updateLicense, deleteLicense, resetToDefault }
}
