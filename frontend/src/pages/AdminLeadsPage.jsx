// src/pages/AdminLeadsPage.jsx
// ADMIN‑only Lead Intelligence dashboard

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../services/api';

// Simple badge styling – could be moved to CSS
const badgeStyle = (type) => {
  const base = {
    padding: '0.2rem 0.6rem',
    borderRadius: '0.4rem',
    fontWeight: '600',
    color: '#fff',
    fontSize: '0.8rem',
  };
  switch (type) {
    case 'HOT':
      return { ...base, backgroundColor: '#e53935' }; // red
    case 'WARM':
      return { ...base, backgroundColor: '#fb8c00' }; // orange
    case 'COLD':
      return { ...base, backgroundColor: '#43a047' }; // green
    default:
      return { ...base, backgroundColor: '#777' };
  }
};

const AdminLeadsPage = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const resp = await apiRequest('/leads');
        if (resp.ok && resp.data?.success) {
          const data = resp.data?.data?.data || [];
          setLeads(data);
        } else {
          const msg = resp.data?.error?.message || resp.data?.message || 'Failed to load leads';
          setError(msg);
        }
      } catch (e) {
        setError(e.message || 'Network error while loading leads');
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, []);

  const filteredLeads = leads.filter((l) => {
    if (filter === 'ALL') return true;
    return l.classification === filter;
  });

  const counts = leads.reduce(
    (acc, l) => {
      const cls = l.classification || 'UNKNOWN';
      if (!acc[cls]) acc[cls] = 0;
      acc[cls] += 1;
      return acc;
    },
    { HOT: 0, WARM: 0, COLD: 0 }
  );

  if (loading) {
    return (
      <section className="page-section">
        <div className="container" style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Loading leads...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page-section">
        <div className="container">
          <p className="error">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="container">
        <h2 className="section-title">Lead Intelligence</h2>
        <p>
          AI‑powered analysis of buyer intent, helping administrators prioritize outreach and improve conversion.
        </p>
        {/* Summary counts */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <div className="card" style={{ flex: 1, padding: '0.8rem' }}>
            <strong>HOT Leads:</strong> {counts.HOT}
          </div>
          <div className="card" style={{ flex: 1, padding: '0.8rem' }}>
            <strong>WARM Leads:</strong> {counts.WARM}
          </div>
          <div className="card" style={{ flex: 1, padding: '0.8rem' }}>
            <strong>COLD Leads:</strong> {counts.COLD}
          </div>
        </div>
        {/* Filter controls */}
        <div style={{ marginBottom: '1rem' }}>
          <label>
            Classification Filter:{' '}
            <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ marginLeft: '0.5rem' }}>
              <option value="ALL">All</option>
              <option value="HOT">HOT</option>
              <option value="WARM">WARM</option>
              <option value="COLD">COLD</option>
            </select>
          </label>
        </div>
        {/* Table or empty state */}
        {filteredLeads.length === 0 ? (
          <p>No leads match the current filter.</p>
        ) : (
          <table className="admin-leads-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ borderBottom: '1px solid #ddd', padding: '0.5rem' }}>Lead ID</th>
                <th style={{ borderBottom: '1px solid #ddd', padding: '0.5rem' }}>Score</th>
                <th style={{ borderBottom: '1px solid #ddd', padding: '0.5rem' }}>Classification</th>
                <th style={{ borderBottom: '1px solid #ddd', padding: '0.5rem' }}>Engagement</th>
                <th style={{ borderBottom: '1px solid #ddd', padding: '0.5rem' }}>Intent</th>
                <th style={{ borderBottom: '1px solid #ddd', padding: '0.5rem' }}>Recency</th>
                <th style={{ borderBottom: '1px solid #ddd', padding: '0.5rem' }}>Last Active</th>
                <th style={{ borderBottom: '1px solid #ddd', padding: '0.5rem' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '0.5rem' }}>{String(lead.id).slice(0, 8)}…</td>
                  <td style={{ padding: '0.5rem' }}>{lead.current_score ?? '-'} </td>
                  <td style={{ padding: '0.5rem' }}>
                    <span style={badgeStyle(lead.classification)}>{lead.classification || 'N/A'}</span>
                  </td>
                  <td style={{ padding: '0.5rem' }}>{lead.engagement_score ?? '-'} </td>
                  <td style={{ padding: '0.5rem' }}>{lead.intent_score ?? '-'} </td>
                  <td style={{ padding: '0.5rem' }}>{lead.recency_score ?? '-'} </td>
                  <td style={{ padding: '0.5rem' }}>
                    {lead.last_active_at ? new Date(lead.last_active_at).toLocaleString() : '-'}
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <Link to={`/admin/leads/${lead.user_id}`} className="btn-primary" style={{ fontSize: '0.9rem' }}>
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};

export default AdminLeadsPage;

