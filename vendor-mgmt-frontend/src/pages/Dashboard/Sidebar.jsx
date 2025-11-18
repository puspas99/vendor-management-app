import React from 'react'
import { NavLink } from 'react-router-dom'
import { FiHome, FiGrid, FiCheckCircle, FiBell, FiActivity, FiUsers, FiBarChart2, FiZap } from 'react-icons/fi'
import styles from './Dashboard.module.css'

export default function Sidebar(){
  const navItems = [
    { to: '/', label: 'Home', icon: FiHome, end: true },
    { to: '/dashboard', label: 'Dashboard', icon: FiGrid },
    { to: '/vendors', label: 'Vendors', icon: FiUsers },
    { to: '/follow-ups', label: 'Follow-ups', icon: FiCheckCircle },
    { to: '/activity-log', label: 'Activity Log', icon: FiActivity },
    { to: '/analytics', label: 'Analytics', icon: FiBarChart2 },
    { to: '/notifications', label: 'Notifications', icon: FiBell },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoSection}>
        <div className={styles.logoIconWrapper}>
          <FiZap className={styles.logoImage} />
        </div>
        <div>
          <h2 className={styles.logoTitle}>DevXcelerate</h2>
          <p className={styles.logoSubtitle}>Vendor Management</p>
        </div>
      </div>
      
      <nav className={styles.menu}>
        <div className={styles.menuLabel}>MAIN MENU</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink 
              key={item.to}
              to={item.to} 
              className={({isActive}) => isActive ? `${styles.menuItem} ${styles.active}` : styles.menuItem}
              end={item.end}
            >
              <Icon className={styles.menuIcon} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className={styles.sidebarFooter}>
        <div className={styles.footerCard}>
          <div className={styles.footerIcon}>✨</div>
          <p className={styles.footerText}>Need help?</p>
          <p className={styles.footerSubtext}>Check our documentation</p>
        </div>
      </div>
    </aside>
  )
}
