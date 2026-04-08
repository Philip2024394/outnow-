import { useState, useEffect } from 'react'
import {
  fetchPricingZones, upsertPricingZone, deletePricingZone,
  fetchGlobalSettings, saveGlobalSettings,
  estimateFare, formatRp, DEFAULT_ZONES, DEFAULT_SETTINGS,
} from '@/services/pricingService'
import styles from './PricingTab.module.css'

const BLANK_ZONE = { city_name: '', zone_id: '', car_base_fare: 6000, car_per_km: 3000, bike_base_fare: 5000, bike_per_km: 2500, is_active: true }

function ZoneRow({ zone, onEdit, onDelete }) {
  const [confirming, setConfirming] = useState(false)
  return (
    <tr className={styles.row}>
      <td className={styles.td}>{zone.city_name}</td>
      <td className={styles.td}>{zone.zone_id}</td>
      <td className={styles.td}>{formatRp(zone.car_base_fare)}</td>
      <td className={styles.td}>{formatRp(zone.car_per_km)}</td>
      <td className={styles.td}>{formatRp(zone.bike_base_fare)}</td>
      <td className={styles.td}>{formatRp(zone.bike_per_km)}</td>
      <td className={styles.tdActions}>
        <button className={styles.editBtn} onClick={() => onEdit(zone)}>Edit</button>
        {confirming
          ? <>
              <button className={styles.confirmDeleteBtn} onClick={() => onDelete(zone.id)}>Confirm</button>
              <button className={styles.cancelBtn} onClick={() => setConfirming(false)}>Cancel</button>
            </>
          : <button className={styles.deleteBtn} onClick={() => setConfirming(true)}>Delete</button>
        }
      </td>
    </tr>
  )
}

function ZoneModal({ zone, onSave, onClose }) {
  const [form, setForm] = useState({ ...BLANK_ZONE, ...(zone ?? {}) })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(null)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.city_name.trim()) return setError('City name is required')
    if (!form.zone_id) return setError('Zone ID is required')
    setSaving(true); setError(null)
    try {
      await onSave({
        ...form,
        zone_id:        Number(form.zone_id),
        car_base_fare:  Number(form.car_base_fare),
        car_per_km:     Number(form.car_per_km),
        bike_base_fare: Number(form.bike_base_fare),
        bike_per_km:    Number(form.bike_per_km),
      })
      onClose()
    } catch (e) { setError(e.message) }
    setSaving(false)
  }

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>{zone?.id ? 'Edit' : 'Add'} Pricing Zone</h3>

        <div className={styles.formGrid}>
          <label className={styles.formLabel}>City Name
            <input className={styles.input} value={form.city_name} onChange={e => set('city_name', e.target.value)} placeholder="e.g. Yogyakarta" />
          </label>
          <label className={styles.formLabel}>Zone ID
            <input className={styles.input} type="number" value={form.zone_id} onChange={e => set('zone_id', e.target.value)} placeholder="1–99" />
          </label>
          <label className={styles.formLabel}>🚗 Base Fare (Rp)
            <input className={styles.input} type="number" value={form.car_base_fare} onChange={e => set('car_base_fare', e.target.value)} />
          </label>
          <label className={styles.formLabel}>🚗 Per KM (Rp)
            <input className={styles.input} type="number" value={form.car_per_km} onChange={e => set('car_per_km', e.target.value)} />
          </label>
          <label className={styles.formLabel}>🛵 Base Fare (Rp)
            <input className={styles.input} type="number" value={form.bike_base_fare} onChange={e => set('bike_base_fare', e.target.value)} />
          </label>
          <label className={styles.formLabel}>🛵 Per KM (Rp)
            <input className={styles.input} type="number" value={form.bike_per_km} onChange={e => set('bike_per_km', e.target.value)} />
          </label>
        </div>

        {error && <p className={styles.formError}>{error}</p>}

        <div className={styles.modalActions}>
          <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Zone'}</button>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default function PricingTab() {
  const [zones,    setZones]    = useState([])
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(null)     // null | zone object (or {} for new)
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsSaved,  setSettingsSaved]  = useState(false)
  // Fare estimator state
  const [estCity,     setEstCity]     = useState('Yogyakarta')
  const [estType,     setEstType]     = useState('bike_ride')
  const [estDistance, setEstDistance] = useState(5)
  const estimatedFare = estimateFare(estType, estCity, Number(estDistance), zones.length ? zones : DEFAULT_ZONES, settings)

  useEffect(() => {
    Promise.all([fetchPricingZones(), fetchGlobalSettings()])
      .then(([z, s]) => { setZones(z); setSettings(s) })
      .finally(() => setLoading(false))
  }, [])

  const handleSaveZone = async (zone) => {
    const saved = await upsertPricingZone(zone)
    setZones(prev => {
      const exists = prev.find(z => z.id === saved.id)
      return exists ? prev.map(z => z.id === saved.id ? saved : z) : [...prev, saved]
    })
  }

  const handleDeleteZone = async (id) => {
    await deletePricingZone(id)
    setZones(prev => prev.filter(z => z.id !== id))
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      await saveGlobalSettings(settings)
      setSettingsSaved(true)
      setTimeout(() => setSettingsSaved(false), 2500)
    } catch (e) { alert('Failed: ' + e.message) }
    setSavingSettings(false)
  }

  if (loading) return <div className={styles.loading}>Loading pricing data…</div>

  return (
    <div className={styles.root}>

      {/* ── Global settings ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Global Ride Settings</h2>
        <div className={styles.settingsRow}>
          <label className={styles.settingLabel}>
            Minimum Fare (Rp)
            <input
              className={styles.settingInput}
              type="number"
              value={settings.minimum_fare}
              onChange={e => setSettings(s => ({ ...s, minimum_fare: Number(e.target.value) }))}
            />
          </label>
          <label className={styles.settingLabel}>
            Maximum Fare (Rp)
            <input
              className={styles.settingInput}
              type="number"
              step="1000"
              value={settings.max_fare ?? 100000}
              onChange={e => setSettings(s => ({ ...s, max_fare: Number(e.target.value) }))}
            />
          </label>
          <label className={styles.settingLabel}>
            Max Distance (km)
            <input
              className={styles.settingInput}
              type="number"
              value={settings.max_distance_km}
              onChange={e => setSettings(s => ({ ...s, max_distance_km: Number(e.target.value) }))}
            />
          </label>
          <label className={styles.settingLabel}>
            Driver Timeout (seconds)
            <input
              className={styles.settingInput}
              type="number"
              value={settings.driver_timeout_seconds}
              onChange={e => setSettings(s => ({ ...s, driver_timeout_seconds: Number(e.target.value) }))}
            />
          </label>
          <button className={styles.saveSettingsBtn} onClick={handleSaveSettings} disabled={savingSettings}>
            {settingsSaved ? '✓ Saved' : savingSettings ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </section>

      {/* ── Fare estimator ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Fare Estimator</h2>
        <div className={styles.estimatorRow}>
          <label className={styles.settingLabel}>City
            <select className={styles.settingInput} value={estCity} onChange={e => setEstCity(e.target.value)}>
              {zones.map(z => <option key={z.id} value={z.city_name}>{z.city_name}</option>)}
            </select>
          </label>
          <label className={styles.settingLabel}>Vehicle
            <select className={styles.settingInput} value={estType} onChange={e => setEstType(e.target.value)}>
              <option value="car_taxi">🚗 Car Taxi</option>
              <option value="bike_ride">🛵 Bike Ride</option>
            </select>
          </label>
          <label className={styles.settingLabel}>Distance (km)
            <input className={styles.settingInput} type="number" min="0.5" step="0.5" value={estDistance} onChange={e => setEstDistance(e.target.value)} />
          </label>
          <div className={styles.fareResult}>
            <span className={styles.fareLabel}>Estimated Fare</span>
            <span className={styles.fareValue}>{formatRp(estimatedFare)}</span>
          </div>
        </div>
      </section>

      {/* ── Zones table ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>City Pricing Zones</h2>
          <button className={styles.addBtn} onClick={() => setModal({})}>+ Add City</button>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>City</th>
                <th className={styles.th}>Zone</th>
                <th className={styles.th}>🚗 Base</th>
                <th className={styles.th}>🚗 /km</th>
                <th className={styles.th}>🛵 Base</th>
                <th className={styles.th}>🛵 /km</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {zones.map(z => (
                <ZoneRow key={z.id} zone={z} onEdit={(z) => setModal(z)} onDelete={handleDeleteZone} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {modal !== null && (
        <ZoneModal zone={modal?.id ? modal : null} onSave={handleSaveZone} onClose={() => setModal(null)} />
      )}
    </div>
  )
}
