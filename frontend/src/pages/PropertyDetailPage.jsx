// src/pages/PropertyDetailPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiRequest } from '../services/api';

const PropertyDetailPage = () => {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await apiRequest(`/properties/${id}`);
        if (response.ok && response.data && response.data.success) {
          setProperty(response.data.message?.data || null);
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
  const imageUrl = property.image_url || property.img || '';

  return (
    <section className="page-section">
      <div className="container">
        <h2 className="section-title">{property.title}</h2>
        <div className="detail-grid">
          <img src={imageUrl} alt={property.title} className="detail-image" />
          <div className="detail-info">
            <p><strong>Location:</strong> {location}</p>
            <p><strong>Price:</strong> {property.price}</p>
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