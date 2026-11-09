// src/pages/PropertiesPage.jsx
import React, { useEffect, useState } from 'react';
import PropertyCard from '../components/PropertyCard';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

const PropertiesPage = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favIds, setFavIds] = useState(new Set());

  // Fetch properties list
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await apiRequest('/properties');
        if (response.ok && response.data && response.data.success) {
          setProperties(response.data?.data?.data || []);
        } else {
          setError('Failed to load properties');
        }
      } catch (e) {
        setError('Error fetching properties');
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  // Fetch user's favourites once when authenticated
  useEffect(() => {
    if (!user) {
      setFavIds(new Set());
      return;
    }
    const fetchFavourites = async () => {
      try {
        const resp = await apiRequest('/favourites');
        if (resp.ok && resp.data && resp.data.success) {
          const ids = new Set();
          // response data shape: resp.data.data (array of favourite objects)
          (resp.data?.data || []).forEach((fav) => {
            const propertyId = fav.property_id || fav.id;
            if (propertyId) ids.add(propertyId);
          });
          setFavIds(ids);
        } else {
          setFavIds(new Set());
        }
      } catch (_) {
        setFavIds(new Set());
      }
    };
    fetchFavourites();
  }, [user]);

  // Sync parent favourite state when a child toggles favourite
  const handleFavouriteChange = (propertyId, nowFav) => {
    setFavIds((prev) => {
      const newSet = new Set(prev);
      if (nowFav) newSet.add(propertyId);
      else newSet.delete(propertyId);
      return newSet;
    });
  };

  if (loading) {
    return (
      <section className="page-section"><div className="container"><p>Loading properties...</p></div></section>
    );
  }

  if (error) {
    return (
      <section className="page-section"><div className="container"><p className="error">{error}</p></div></section>
    );
  }

  if (properties.length === 0) {
    return (
      <section className="page-section"><div className="container"><h2 className="section-title">All Properties</h2><p>No properties are currently available.</p></div></section>
    );
  }

  return (
    <section className="page-section">
      <div className="container">
        <h2 className="section-title">All Properties</h2>
        <div className="property-grid">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              isFavourite={favIds.has(property.id)}
              onFavouriteChange={handleFavouriteChange}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PropertiesPage;
