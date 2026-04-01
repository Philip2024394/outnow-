import { OverlayViewF } from '@react-google-maps/api'
import styles from './MyLocationDot.module.css'

export default function MyLocationDot({ lat, lng }) {
  return (
    <OverlayViewF
      position={{ lat, lng }}
      mapPaneName="overlayLayer"
      getPixelPositionOffset={(w, h) => ({ x: -w / 2, y: -h / 2 })}
    >
      <div className={styles.dot}>
        <div className={styles.ring} />
        <div className={styles.ring2} />
        <div className={styles.center} />
      </div>
    </OverlayViewF>
  )
}
