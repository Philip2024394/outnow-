import { useState } from 'react'
import ActivityProfileGrid from './ActivityProfileGrid'
import { useLanguage } from '@/i18n'
import styles from './FloatingIcons.module.css'

const ICONS = [
  { id: 'bike_ride',  labelKey: 'icons.ride',    img: 'https://ik.imagekit.io/nepgaxllc/Untitledsadasdasd-removebg-preview.png',                  vehicle: true },
  { id: 'food',       labelKey: 'icons.street',  img: 'https://ik.imagekit.io/nepgaxllc/Untitledsadasdasdasdasddfssdf-removebg-preview.png',        vehicle: false },
  { id: 'dating',     labelKey: 'icons.dating',  img: 'https://ik.imagekit.io/nepgaxllc/Untitledsadasdasdasdasddfssdfasdasdfsasdf-removebg-preview.png', vehicle: false },
  { id: 'car_taxi',   labelKey: 'icons.car',     img: 'https://ik.imagekit.io/nepgaxllc/Untitledsadasdasdasdasd-removebg-preview.png',              vehicle: true },
  { id: 'shopping',   labelKey: 'icons.shop',    img: 'https://ik.imagekit.io/nepgaxllc/Untitledsadasdasdasdasddfssdfasdasd-removebg-preview.png',  vehicle: false },
  { id: 'massage',    labelKey: 'icons.massage', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsadasdasdasdasddfssdfasdasdfsasdfsdffasdf-removebg-preview.png', vehicle: false },
]

export default function FloatingIcons({ sessions = [], serviceCounts = {}, onSelectSession, onFoodClick, onRideClick, onShoppingClick, onDatingClick, onMassageClick }) {
  const { t } = useLanguage()
  const [activeActivity, setActiveActivity] = useState(null)

  const handleIconClick = (icon) => {
    if (icon.id === 'food' && onFoodClick)                                    { onFoodClick();     return }
    if (icon.id === 'bike_ride' && onRideClick)   { onRideClick('bike_ride');  return }
    if (icon.id === 'car_taxi' && onRideClick)    { onRideClick('car_taxi');   return }
    if (icon.id === 'shopping' && onShoppingClick)                            { onShoppingClick(); return }
    if (icon.id === 'dating' && onDatingClick)                                { onDatingClick();   return }
    if (icon.id === 'massage' && onMassageClick)                              { onMassageClick();  return }
    setActiveActivity(icon)
  }

  return (
    <>
      <div className={styles.dock}>
        <div className={styles.dockInner}>
          {ICONS.map(icon => {
            const count = sessions.filter(s =>
              s.activityType === icon.id || (s.activities ?? []).includes(icon.id)
            ).length

            return (
              <button
                key={icon.id}
                className={styles.dockBtn}
                onClick={() => handleIconClick(icon)}
                aria-label={icon.label}
              >
                <div className={styles.iconWrap}>
                  <img
                    src={icon.img}
                    alt={icon.label}
                    className={icon.vehicle ? styles.dockImgVehicle : styles.dockImgSquare}
                  />
                  {/* Red notification badge — takes priority over session count */}
                  {(serviceCounts[icon.id] ?? 0) > 0 ? (
                    <span className={styles.notifBadge}>{serviceCounts[icon.id]}</span>
                  ) : count > 0 ? (
                    <span className={styles.badge}>{count}</span>
                  ) : null}
                </div>
                <span className={styles.dockLabel}>{t(icon.labelKey)}</span>
              </button>
            )
          })}
        </div>
      </div>

      <ActivityProfileGrid
        open={!!activeActivity}
        activity={activeActivity}
        sessions={sessions.filter(s =>
          activeActivity &&
          (s.activityType === activeActivity.id || (s.activities ?? []).includes(activeActivity.id))
        )}
        onClose={() => setActiveActivity(null)}
        onSelectSession={(s) => { setActiveActivity(null); onSelectSession?.(s) }}
      />
    </>
  )
}
