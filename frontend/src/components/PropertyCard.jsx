import React from 'react';
import { Link } from 'react-router-dom';

const PropertyCard = ({ property }) => {
  const imageUrl = property.image_url || property.img || '';
  const location = property.city && property.state
    ? `${property.city}, ${property.state}`
    : property.location || property.city || '';
  const price = typeof property.price === 'number'
    ? `$${Number(property.price).toLocaleString()}`
    : property.price;

  return (
    <div className="card">
      <img src={imageUrl} alt={property.title} className="card-image" />
      <div className="card-body">
        <h3 className="card-title">{property.title}</h3>
        <p className="card-location">{location}</p>
        <p className="card-price">{price}</p>
        <Link to={`/properties/${property.id}`} className="btn-primary" style={{marginTop:'0.5rem',display:'inline-block'}}>View Details</Link>
      </div>
    </div>
  );
};

export default PropertyCard;
