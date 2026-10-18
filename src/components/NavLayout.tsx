import { Outlet } from 'react-router-dom'
import { AppNav } from './AppNav.tsx'
import styles from './NavLayout.module.css'

/** Pages with the bottom nav (Activity, Shop, Me, Settings). The plaza draws its own, edge to edge. */
export function NavLayout() {
  return (
    <div className={styles.shell}>
      <div className={styles.content}>
        <Outlet />
      </div>
      <div className={styles.nav}>
        <AppNav />
      </div>
    </div>
  )
}
