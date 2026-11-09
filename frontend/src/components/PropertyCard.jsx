// src/components/PropertyCard.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { trackInteraction } from '../services/interactionTracking';
import { useAuth } from '../context/AuthContext';

// Props:
//   property: property object
//   isFavourite: boolean (initial favourite state from parent)
//   onFavouriteChange: callback(propertyId, isNowFav) to sync parent state
const PropertyCard = ({ property, isFavourite, onFavouriteChange }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isFav, setIsFav] = useState(isFavourite);
  const [isProcessing, setIsProcessing] = useState(false);

  // Keep local favourite state in sync when parent updates it
  useEffect(() => {
    setIsFav(isFavourite);
  }, [isFavourite]);

  const handleFavourite = async (e) => {
    e.stopPropagation(); // prevent navigation click bubbling
    if (!user) {
      navigate('/login');
      return;
    }
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      if (!isFav) {
        const resp = await apiRequest('/favourites', {
          method: 'POST',
          body: JSON.stringify({ propertyId: property.id }),
        });
        if (resp.ok) {
          setIsFav(true);
          onFavouriteChange && onFavouriteChange(property.id, true);
          trackInteraction({
            event_type: 'FAVOURITE_ADD',
            property_id: property.id,
            metadata: { source: 'property_card' },
          }).catch(() => {});
        }
      } else {
        const resp = await apiRequest(`/favourites/${property.id}`, {
          method: 'DELETE',
        });
        if (resp.ok) {
          setIsFav(false);
          onFavouriteChange && onFavouriteChange(property.id, false);
          trackInteraction({
            event_type: 'FAVOURITE_REMOVE',
            property_id: property.id,
            metadata: { source: 'property_card' },
          }).catch(() => {});
        }
      }
    } catch (_) {
      // swallow errors – UI unchanged
    } finally {
      setIsProcessing(false);
    }
  };

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
        <button
          onClick={handleFavourite}
          aria-label={isFav ? 'Remove favourite' : 'Add favourite'}
          className={isFav ? 'fav-active' : ''}
          disabled={isProcessing}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}
        >
          {isFav ? '♥' : '♡'}
        </button>
        <Link
          to={`/properties/${property.id}`}
          className="btn-primary"
          style={{ marginTop: '0.5rem', display: 'inline-block' }}
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default PropertyCard;
