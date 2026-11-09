// src/pages/PropertyDetailPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { trackInteraction } from '../services/interactionTracking';

const PropertyDetailPage = () => {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ref to store mount timestamp and ensure single send
  const startTimeRef = useRef(null);
  const sentRef = useRef(false);

  // Track PROPERTY_VIEW on unmount
  useEffect(() => {
    startTimeRef.current = Date.now();
    return () => {
      if (sentRef.current) return;
      const endTime = Date.now();
      const dwellMs = endTime - (startTimeRef.current || endTime);
      const dwellSec = Math.max(0, Math.floor(dwellMs / 1000));
      trackInteraction({
        event_type: 'PROPERTY_VIEW',
        property_id: id,
        dwell_time_seconds: dwellSec,
        metadata: { source: 'property_detail_page' },
      }).catch(() => {});
      sentRef.current = true;
    };
  }, [id]);
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await apiRequest(`/properties/${id}`);
        if (response.ok && response.data && response.data.success) {
          setProperty(response.data?.data?.data || null);
        } else {
          setError('Failed to load property');
        }
      } catch (e) {
        setError('Error fetching property');
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  if (loading) {
    return (
      <section className="page-section"><div className="container"><p>Loading property...</p></div></section>
    );
  }

  if (error) {
    return (
      <section className="page-section"><div className="container"><p className="error">{error}</p></div></section>
    );
  }

  if (!property) {
    return (
      <section className="page-section"><div className="container"><h2>Property Not Found</h2><p>The requested property does not exist.</p><Link to="/properties" className="btn-primary">Back to Listings</Link></div></section>
    );
  }

  const location = property.city && property.state ? `${property.city}, ${property.state}` : property.location || '';
  // Determine primary image safely
  const primaryImgObj = property.images?.find(img => img.is_primary) || property.images?.[0];
  const imageUrl = primaryImgObj?.image_url || '';

  // Format price as USD currency
  const formattedPrice = property.price ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(property.price)) : '';


  return (
    <section className="page-section">
      <div className="container">
        <h2 className="section-title">{property.title}</h2>
        <div className="detail-grid">
          <img src={imageUrl} alt={property.title} className="detail-image" />
          {/* Image Gallery */}
          {property.images && property.images.length > 1 && (
            <div className="image-gallery" style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {property.images
                .slice()
                .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                .map((imgObj, idx) => (
                  <img
                    key={imgObj.id || idx}
                    src={imgObj.image_url}
                    alt={imgObj.caption || `Property image ${idx + 1}`}
                    className="card-image"
                    style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '4px' }}
                  />
                ))}
            </div>
          )}
          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="amenities" style={{ marginTop: '1rem' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Amenities</h3>
              <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem' }}>
                {property.amenities.map((amen, idx) => (
                  <li key={amen.id || idx}>{amen.name}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="detail-info">
            <p><strong>Location:</strong> {location}</p>
            <p><strong>Price:</strong> {formattedPrice}</p>
            <p><strong>Description:</strong> {property.description || 'No description provided.'}</p>
            <p><strong>Bedrooms:</strong> {property.bedrooms ?? 'N/A'}</p>
            <p><strong>Bathrooms:</strong> {property.bathrooms ?? 'N/A'}</p>
            <Link to="/properties" className="btn-primary" style={{marginTop:'1rem'}}>Back to Listings</Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PropertyDetailPage;