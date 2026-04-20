import { useState } from 'react'
import { createPortal } from 'react-dom'
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
  { id: 'rentals',    labelKey: 'icons.rentals', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsadasdasdasdasddfssdfasdasdfsasdfsdffasdf-removebg-preview.png', vehicle: false },
]

export default function FloatingIcons({ sessions = [], serviceCounts = {}, onSelectSession, onFoodClick, onRideClick, onShoppingClick, onDatingClick, onMassageClick, onRentalsClick }) {
  const { t } = useLanguage()
  const [activeActivity, setActiveActivity] = useState(null)

  const handleIconClick = (icon) => {
    if (icon.id === 'food' && onFoodClick)                                    { onFoodClick();     return }
    if (icon.id === 'bike_ride' && onRideClick)   { onRideClick('bike_ride');  return }
    if (icon.id === 'car_taxi' && onRideClick)    { onRideClick('car_taxi');   return }
    if (icon.id === 'shopping' && onShoppingClick)                            { onShoppingClick(); return }
    if (icon.id === 'dating' && onDatingClick)                                { onDatingClick();   return }
    if (icon.id === 'massage' && onMassageClick)                              { onMassageClick();  return }
    if (icon.id === 'rentals' && onRentalsClick)                              { onRentalsClick();  return }
    setActiveActivity(icon)
  }

  return createPortal(
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
                  {/* Icon — offset left, overlapping circle edge */}
                  <img
                    src={icon.img}
                    alt={icon.label}
                    className={icon.vehicle ? styles.dockImgVehicle : styles.dockImgSquare}
                  />
                  {/* Arched text on the right half */}
                  <svg className={styles.arcLabel} viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <path id={`arc-${icon.id}`} d="M 35,8 a 32,32 0 0,1 0,64" />
                    </defs>
                    <text>
                      <textPath href={`#arc-${icon.id}`} startOffset="50%" textAnchor="middle">
                        {t(icon.labelKey)}
                      </textPath>
                    </text>
                  </svg>
                  {/* Red notification badge — takes priority over session count */}
                  {(serviceCounts[icon.id] ?? 0) > 0 ? (
                    <span className={styles.notifBadge}>{serviceCounts[icon.id]}</span>
                  ) : count > 0 ? (
                    <span className={styles.badge}>{count}</span>
                  ) : null}
                </div>
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
    </>,
    document.body
  )
}
