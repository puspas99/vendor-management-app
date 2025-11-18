import React from 'react'
import Sidebar from './Sidebar'
import styles from './Dashboard.module.css'

export default function Help(){
  return (
    <div className={styles.dashboardLayout}>
      <Sidebar />
      <div className={styles.mainContent}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h1 className={styles.title}>Help & Documentation</h1>
          <p className={styles.subtitle}>Resources to help your procurement team use Vendor Management.</p>

          <section style={{ marginTop: 20 }}>
            <h2>Getting Started</h2>
            <ol>
              <li>Create vendor requests from "Vendor List" &gt; "Invite Vendor".</li>
              <li>Use the "Follow-ups" tab to track outstanding items.</li>
              <li>Use "Analytics" for procurement insights.</li>
            </ol>
          </section>

          <section style={{ marginTop: 20 }}>
            <h2>FAQ</h2>
            <div className={styles.detailCard}>
              <strong>Q: How do I resend an invitation?</strong>
              <p>Open the Vendor detail and click "Resend Invitation".</p>

              <strong>Q: How are vendor categories used?</strong>
              <p>Categories help filter and report vendors across procurement areas.</p>
            </div>
          </section>

          <section style={{ marginTop: 20 }}>
            <h2>Support</h2>
            <div className={styles.detailCard}>
              <p>If you need help, email <a href="mailto:support@devxcelerate.com">support@devxcelerate.com</a> or open a ticket.</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
