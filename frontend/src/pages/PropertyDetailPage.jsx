import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { properties } from '../data/properties';
import PropertyCard from '../components/PropertyCard';

const PropertyDetailPage = () => {
  const { id } = useParams();
  const property = properties.find((p) => p.id === Number(id));

  if (!property) {
    return (
      <section className="page-section">
        <div className="container">
          <h2>Property Not Found</h2>
          <p>The requested property does not exist.</p>
          <Link to="/properties" className="btn-primary">Back to Listings</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="container">
        <h2 className="section-title">{property.title}</h2>
        <div className="detail-grid">
          <img src={property.img} alt={property.title} className="detail-image" />
          <div className="detail-info">
            <p><strong>Location:</strong> {property.location}</p>
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

