// src/pages/AgentEnquiriesPage.jsx
// Agent Enquiries Management page (accessible to AGENT and ADMIN users).
// Implements fetching, summary statistics, search / status filter, status updates,
// and editable agent notes.

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AgentEnquiriesPage = () => {
  const { user } = useAuth();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // UI state for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Loading flags for per‑enquiry actions
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [savingNotesId, setSavingNotesId] = useState(null);

  // Local editable notes state (maps enquiry.id -> notes string)
  const [notesMap, setNotesMap] = useState({});

  // Fetch enquiries on mount
  useEffect(() => {
    const fetchEnquiries = async () => {
      try {
        const resp = await apiRequest('/enquiries/agent');
        if (resp.ok && resp.data && resp.data.success) {
          const data = resp.data.data || [];
          setEnquiries(data);
          // initialise notes map
          const initMap = {};
          data.forEach((e) => {
            initMap[e.id] = e.agent_notes || '';
          });
          setNotesMap(initMap);
        } else {
          const msg = resp.data?.error?.message || resp.data?.message || 'Failed to load enquiries';
          setError(msg);
        }
      } catch (e) {
        setError(e.message || 'Error loading enquiries');
      } finally {
        setLoading(false);
      }
    };
    fetchEnquiries();
  }, []);

  // Helper formatters
  const formatPrice = (price) => (price ? `$${Number(price).toLocaleString()}` : '');
  const formatDate = (dateStr) => new Date(dateStr).toLocaleString();

  // Summary statistics
  const total = enquiries.length;
  const pending = enquiries.filter((e) => e.status === 'PENDING').length;
  const contacted = enquiries.filter((e) => e.status === 'CONTACTED').length;
  const closed = enquiries.filter((e) => e.status === 'CLOSED').length;

  // Filtering logic
  const filtered = enquiries.filter((e) => {
    const lower = searchTerm.toLowerCase();
    const matchesSearch =
      e.property_title?.toLowerCase().includes(lower) ||
      e.property_city?.toLowerCase().includes(lower) ||
      e.property_state?.toLowerCase().includes(lower) ||
      e.property_address?.toLowerCase().includes(lower) ||
      e.buyer_name?.toLowerCase().includes(lower) ||
      e.buyer_email?.toLowerCase().includes(lower);
    const matchesStatus = statusFilter ? e.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  // Handlers
  const handleStatusChange = async (enquiryId, newStatus) => {
    setUpdatingStatusId(enquiryId);
    try {
      const resp = await apiRequest(`/enquiries/${enquiryId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      if (resp.ok && resp.data?.success) {
        setEnquiries((prev) =>
          prev.map((e) => (e.id === enquiryId ? { ...e, status: newStatus } : e))
        );
      } else {
        const msg = resp.data?.error?.message || resp.data?.message || 'Failed to update status';
        setError(msg);
      }
    } catch (e) {
      setError(e.message || 'Error updating status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleNotesSave = async (enquiryId) => {
    const notes = notesMap[enquiryId] || '';
    setSavingNotesId(enquiryId);
    try {
      const resp = await apiRequest(`/enquiries/${enquiryId}`, {
        method: 'PATCH',
        body: JSON.stringify({ agent_notes: notes }),
      });
      if (resp.ok && resp.data?.success) {
        setEnquiries((prev) =>
          prev.map((e) => (e.id === enquiryId ? { ...e, agent_notes: notes } : e))
        );
      } else {
        const msg = resp.data?.error?.message || resp.data?.message || 'Failed to save notes';
        setError(msg);
      }
    } catch (e) {
      setError(e.message || 'Error saving notes');
    } finally {
      setSavingNotesId(null);
    }
  };

  // Render
  if (loading) {
    return (
      <section className="page-section">
        <div className="container">
          <p>Loading enquiries...</p>
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
        <h2 className="section-title">Agent Enquiries</h2>
        {/* Summary cards */}
        <div className="summary-cards" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <div className="card" style={{ flex: 1, padding: '1rem' }}>
            <strong>Total</strong>: {total}
          </div>
          <div className="card" style={{ flex: 1, padding: '1rem' }}>
            <strong>Pending</strong>: {pending}
          </div>
          <div className="card" style={{ flex: 1, padding: '1rem' }}>
            <strong>Contacted</strong>: {contacted}
          </div>
          <div className="card" style={{ flex: 1, padding: '1rem' }}>
            <strong>Closed</strong>: {closed}
          </div>
        </div>

        {/* Filters */}
        <div className="filters" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
          <input
            type="text"
            placeholder="Search by property or buyer"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 2, padding: '0.5rem' }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ flex: 1, padding: '0.5rem' }}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONTACTED">Contacted</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        {/* Enquiries list */}
        {filtered.length === 0 ? (
          <p>No enquiries match the current filters.</p>
        ) : (
          <div className="grid">
            {filtered.map((enquiry) => (
              <div key={enquiry.id} className="card" style={{ marginBottom: '1rem' }}>
                {enquiry.property_image_url && (
                  <img src={enquiry.property_image_url} alt={enquiry.property_title} className="card-image" />
                )}
                <div className="card-body">
                  <h3 className="card-title">{enquiry.property_title}</h3>
                  <p className="card-location">
                    {enquiry.property_city && enquiry.property_state
                      ? `${enquiry.property_city}, ${enquiry.property_state}`
                      : enquiry.property_address}
                  </p>
                  <p className="card-price">{formatPrice(enquiry.property_price)}</p>
                  <p><strong>Message:</strong> {enquiry.message}</p>
                  {enquiry.phone && <p><strong>Phone:</strong> {enquiry.phone}</p>}
                  <p>
                    <strong>Status:</strong>{' '}
                    <select
                      value={enquiry.status}
                      onChange={(e) => handleStatusChange(enquiry.id, e.target.value)}
                      disabled={updatingStatusId === enquiry.id}
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="CONTACTED">CONTACTED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                    {updatingStatusId === enquiry.id && <span> Updating…</span>}
                  </p>
                  <p><strong>Submitted:</strong> {formatDate(enquiry.created_at)}</p>
                  {enquiry.agent_name && <p><strong>Agent:</strong> {enquiry.agent_name}</p>}
                  {enquiry.agent_email && <p><strong>Email:</strong> {enquiry.agent_email}</p>}
                  {enquiry.agent_phone && <p><strong>Phone:</strong> {enquiry.agent_phone}</p>}
                  <p>
                    <strong>Notes:</strong>
                    <br />
                    <textarea
                      rows="3"
                      style={{ width: '100%' }}
                      value={notesMap[enquiry.id] || ''}
                      onChange={(e) => setNotesMap({ ...notesMap, [enquiry.id]: e.target.value })}
                    />
                    <button
                      className="btn-primary"
                      onClick={() => handleNotesSave(enquiry.id)}
                      disabled={savingNotesId === enquiry.id}
                      style={{ marginTop: '0.5rem' }}
                    >
                      {savingNotesId === enquiry.id ? 'Saving…' : 'Save Notes'}
                    </button>
                  </p>
                  <Link
                    to={`/properties/${enquiry.property_id}`}
                    className="btn-primary"
                    style={{ marginTop: '0.5rem', display: 'inline-block' }}
                  >
                    View Property
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default AgentEnquiriesPage;

