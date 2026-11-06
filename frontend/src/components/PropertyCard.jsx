import React from 'react';
import { Link } from 'react-router-dom';

const PropertyCard = ({ property }) => (
  <div className="card">
    <img src={property.img} alt={property.title} className="card-image" />
    <div className="card-body">
      <h3 className="card-title">{property.title}</h3>
      <p className="card-location">{property.location}</p>
      <p className="card-price">{property.price}</p>
      <Link to={`/properties/${property.id}`} className="btn-primary" style={{marginTop:'0.5rem',display:'inline-block'}}>View Details</Link>
    </div>
  </div>
);

export default PropertyCard;
