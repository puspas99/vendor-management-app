import React, { useState, Suspense } from "react";
import styles from "./Dashboard.module.css";

const StatDetails = React.lazy(() => import("./StatDetails"));

export default function Dashboard() {
  const [selectedStat, setSelectedStat] = useState(null);
  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <h2 className={styles.logo}>DevXcelerate</h2>
        <nav className={styles.menu}>
          <MenuItem label="Dashboard" active />
          <MenuItem label="Tasks" />
          <MenuItem label="Vendor Details Form" onClick={() => window.location.href='/vendor-form'} />
          <MenuItem label="Analytics" />
        </nav>
        <div className={styles.menuSection}>
          <MenuItem label="Settings" />
          <MenuItem label="Help" />
          <MenuItem label="Logout" />
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Top Bar */}
        <div className={styles.topBar}>
          <input className={styles.search} placeholder="Search task" />

          <div className={styles.topRight}>
            <span className={styles.icon}>🔔</span>
            <span className={styles.icon}>✉️</span>

            <div className={styles.profile}>
              <img
                src="https://i.pravatar.cc/100"
                className={styles.avatar}
                alt="avatar"
              />
              <div>
                <p className={styles.profileName}>Totok Michael</p>
                <p className={styles.profileEmail}>tmichael20@mail.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>
          Plan, prioritize, and accomplish your tasks with ease.
        </p>

        {/* Top Stats */}
        <div className={styles.statsGrid}>
          <StatCard
            title="Total Vendors"
            value="24"
            color="green1"
            onClick={() => setSelectedStat({ title: "Total Vendors", value: 24, color: "green1" })}
          />
          <StatCard
            title="Ended Projects"
            value="10"
            color="green2"
            onClick={() => setSelectedStat({ title: "Ended Projects", value: 10, color: "green2" })}
          />
          <StatCard
            title="Running Projects"
            value="12"
            color="blue"
            onClick={() => setSelectedStat({ title: "Running Projects", value: 12, color: "blue" })}
          />
          <StatCard
            title="Pending Project"
            value="2"
            color="yellow"
            onClick={() => setSelectedStat({ title: "Pending Project", value: 2, color: "yellow" })}
          />
        </div>

        {/* Lazy-loaded details modal */}
        {selectedStat && (
          <div className={styles.modalOverlay} role="dialog" aria-modal="true">
            <div className={styles.modalContent}>
              <button
                className={styles.modalClose}
                aria-label="Close details"
                onClick={() => setSelectedStat(null)}
              >
                ×
              </button>
              <Suspense fallback={<div className={styles.modalLoading}>Loading...</div>}>
                <StatDetails stat={selectedStat} onClose={() => setSelectedStat(null)} />
              </Suspense>
            </div>
          </div>
        )}

        {/* Middle Section */}
        <div className={styles.middleGrid}>
          {/* Analytics */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Project Analytics</h3>
            <AnalyticsBars />
          </div>

          {/* Reminder */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Reminders</h3>
            <p className={styles.reminderTitle}>Meeting with Arc Company</p>
            <p className={styles.reminderTime}>02:00 PM - 04:00 PM</p>
            <button className={styles.startBtn}>Start Meeting</button>
          </div>

          {/* Project List */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Project</h3>
              <button className={styles.newBtn}>+ New</button>
            </div>
            <ProjectList />
          </div>
        </div>

        {/* Bottom Section */}
        <div className={styles.bottomGrid}>
          {/* Progress + Timer */}
          <div className={styles.progressSection}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Project Progress</h3>
              <ProgressCircle />
            </div>

            <div className={styles.timerCard}>
              <h3 className={styles.timerTitle}>Time Tracker</h3>
              <p className={styles.timerValue}>01:24:08</p>

              <div className={styles.timerButtons}>
                <button className={styles.pauseBtn}>⏸️</button>
                <button className={styles.stopBtn}>⏹️</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* Components */

function MenuItem({ label, active }) {
  return (
    <div
      className={`${styles.menuItem} ${active ? styles.active : ""}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : undefined }}
    >
      <span>{label}</span>
    </div>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div className={`${styles.statCard} ${styles[color]}`}>
      <p className={styles.statTitle}>{title}</p>
      <p className={styles.statValue}>{value}</p>
      <p className={styles.statSub}>↑ Increased from last month</p>
    </div>
  );
}

function AnalyticsBars() {
  const bars = [50, 70, 80, 100, 60, 40, 30];

  return (
    <div className={styles.analyticsBars}>
      {bars.map((h, i) => (
        <div
          key={i}
          className={styles.analyticsBar}
          style={{ height: `${h}%` }}
        ></div>
      ))}
    </div>
  );
}

function ProjectList() {
  const projects = [
    "Develop API Endpoints",
    "Onboarding Flow",
    "Build Dashboard",
    "Optimize Page Load",
    "Cross-Browser Testing",
  ];

  return (
    <ul className={styles.projectList}>
      {projects.map((p, i) => (
        <li key={i} className={styles.projectItem}>
          {p}
        </li>
      ))}
    </ul>
  );
}

function ProgressCircle() {
  return (
    <div className={styles.progressContainer}>
      <div className={styles.progressCircle}></div>
      <p className={styles.progressPercent}>41%</p>
      <p className={styles.progressLabel}>Project Ended</p>
    </div>
  );
}
