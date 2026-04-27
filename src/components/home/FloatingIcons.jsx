import { useState } from 'react'
import { createPortal } from 'react-dom'
import ActivityProfileGrid from './ActivityProfileGrid'
import { useLanguage } from '@/i18n'
import styles from './FloatingIcons.module.css'

const ICONS = [
  { id: 'bike_ride',  labelKey: 'icons.ride',    label: 'Bike Ride',    img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2028,%202026,%2005_49_30%20AM.png',   vehicle: true },
  { id: 'car_taxi',   labelKey: 'icons.car',     label: 'Car Ride',     img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdvvvdsdsdsdas-removebg-preview.png',              vehicle: true },
  { id: 'food',       labelKey: 'icons.street',  label: 'Food',         img: 'https://ik.imagekit.io/nepgaxllc/Untitledsadasdasdasdasddfssdf-removebg-preview.png',        vehicle: false },
  { id: 'dealhunt',   labelKey: 'icons.deals',   label: 'Deal Hunt',    img: 'https://ik.imagekit.io/nepgaxllc/Untitledsadasdasdasdasddfssdfasdasd-removebg-preview.png', vehicle: false },
  // Hidden for launch — enable later:
  // { id: 'dating',     labelKey: 'icons.dating',  label: 'Dating',       img: '...', vehicle: false },
  // { id: 'shopping',   labelKey: 'icons.shop',    label: 'Market',       img: '...', vehicle: false },
  // { id: 'massage',    labelKey: 'icons.massage', label: 'Massage',      img: '...', vehicle: false },
  // { id: 'rentals',    labelKey: 'icons.rentals', label: 'Rentals',      img: '...', vehicle: false },
]

export default function FloatingIcons({ sessions = [], serviceCounts = {}, onSelectSession, onFoodClick, onRideClick, onShoppingClick, onDatingClick, onMassageClick, onRentalsClick, onDealHuntClick }) {
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
    if (icon.id === 'dealhunt' && onDealHuntClick)                            { onDealHuntClick(); return }
    setActiveActivity(icon)
  }

  return createPortal(
    <>
      <div className={styles.dock}>
        <div className={styles.dockContainer}>
          <div className={styles.dockGrid}>
            {ICONS.map(icon => {
              const count = sessions.filter(s =>
                s.activityType === icon.id || (s.activities ?? []).includes(icon.id)
              ).length
              const notifCount = serviceCounts[icon.id] ?? 0

              return (
                <button
                  key={icon.id}
                  className={styles.dockBtn}
                  onClick={() => handleIconClick(icon)}
                  aria-label={t(icon.labelKey)}
                >
                  <div className={styles.iconBox}>
                    <img
                      src={icon.img}
                      alt=""
                      className={styles.iconImg}
                    />
                    {notifCount > 0 ? (
                      <span className={styles.notifBadge}>{notifCount}</span>
                    ) : count > 0 ? (
                      <span className={styles.badge}>{count}</span>
                    ) : null}
                  </div>
                  <span className={styles.iconLabel}>{t(icon.labelKey)}</span>
                </button>
              )
            })}
          </div>
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
