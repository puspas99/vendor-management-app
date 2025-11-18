import React from "react";

export default function StatDetails({ stat, onClose }) {
  if (!stat) return null;

  // In a real app you'd fetch details from an API here based on stat.title or id
  return (
    <div style={{ padding: 18 }}>
      <h2 style={{ marginTop: 0 }}>{stat.title}</h2>
      <p style={{ fontSize: 42, margin: '10px 0', fontWeight: 700 }}>{stat.value}</p>
      <p style={{ color: '#666' }}>This panel shows more details for the selected statistic. Replace with charts or table data as needed.</p>

      <div style={{ marginTop: 18 }}>
        <button onClick={onClose} style={{ padding: '8px 12px', borderRadius: 10, border: 'none', background: '#0a5f3f', color: 'white', cursor: 'pointer' }}>Close</button>
      </div>
    </div>
  );
}
