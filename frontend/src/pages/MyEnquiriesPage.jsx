// src/pages/MyEnquiriesPage.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

const MyEnquiriesPage = () => {
  const { user } = useAuth();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEnquiries = async () => {
      try {
        const resp = await apiRequest('/enquiries/me');
        if (resp.ok && resp.data && resp.data.success) {
          setEnquiries(resp.data.data || []);
        } else {
          const msg = resp.data?.message || 'Failed to load enquiries';
          setError(msg);
        }
      } catch (e) {
        setError('Error loading enquiries');
      } finally {
        setLoading(false);
      }
    };
    fetchEnquiries();
  }, []);

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

  if (!enquiries.length) {
    return (
      <section className="page-section">
        <div className="container">
          <p>No enquiries found.</p>
        </div>
      </section>
    );
  }

  const formatPrice = (price) => {
    if (!price) return '';
    return `$${Number(price).toLocaleString()}`;
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString();
  };

  const statusColors = {
    PENDING: 'orange',
    CONTACTED: 'green',
    CLOSED: 'gray',
  };

  return (
    <section className="page-section">
      <div className="container">
        <h2 className="section-title">My Enquiries</h2>
        <div className="grid">
          {enquiries.map((enquiry) => (
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
                  <span style={{ color: statusColors[enquiry.status] || 'black' }}>{enquiry.status}</span>
                </p>
                <p><strong>Submitted:</strong> {formatDate(enquiry.created_at)}</p>
                {enquiry.agent_name && <p><strong>Agent:</strong> {enquiry.agent_name}</p>}
                {enquiry.agent_email && <p><strong>Email:</strong> {enquiry.agent_email}</p>}
                {enquiry.agent_phone && <p><strong>Phone:</strong> {enquiry.agent_phone}</p>}
                {enquiry.agent_notes && <p><strong>Notes:</strong> {enquiry.agent_notes}</p>}
                <Link to={`/properties/${enquiry.property_id}`} className="btn-primary" style={{ marginTop: '0.5rem', display: 'inline-block' }}>
                  View Property
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MyEnquiriesPage;

