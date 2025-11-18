import React from 'react'
import Sidebar from './Sidebar'
import styles from './Dashboard.module.css'

export default function Settings() {
  return (
    <div className={styles.dashboardLayout}>
      <Sidebar />
      <div className={styles.mainContent}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>Manage application and procurement settings for your team.</p>

          <section style={{ marginTop: 20 }}>
            <h2 style={{ marginBottom: 10 }}>User & Team</h2>
            <div className={styles.detailCard}>
              <label className={styles.formLabel}>Default Role</label>
              <select className={styles.formInput}>
                <option>Procurement Officer</option>
                <option>Procurement Manager</option>
                <option>Viewer</option>
              </select>

              <label className={styles.formLabel}>Default Notification Preferences</label>
              <div className="compactRow">
                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" /> Email</label>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" /> In-app</label>
              </div>
            </div>
          </section>

          <section style={{ marginTop: 20 }}>
            <h2 style={{ marginBottom: 10 }}>Vendor Onboarding</h2>
            <div className={styles.detailCard}>
              <label className={styles.formLabel}>Invitation Expiry (days)</label>
              <input className={styles.formInput} defaultValue={7} />

              <label className={styles.formLabel} style={{ marginTop: 12 }}>Require Manual Approval</label>
              <div style={{ display: 'flex', gap: 12 }}>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="radio" name="approval" /> Yes</label>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="radio" name="approval" /> No</label>
              </div>
            </div>
          </section>

          <section style={{ marginTop: 20 }}>
            <h2 style={{ marginBottom: 10 }}>Integrations</h2>
            <div className={styles.detailCard}>
              <label className={styles.formLabel}>Email Provider</label>
              <input className={styles.formInput} placeholder="SMTP / Sendgrid / etc." />

              <label className={styles.formLabel} style={{ marginTop: 12 }}>Webhook URL</label>
              <input className={styles.formInput} placeholder="https://" />
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
