// src/pages/FavouritesPage.jsx
import React, { useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
import PropertyCard from '../components/PropertyCard';
import { useAuth } from '../context/AuthContext';

const FavouritesPage = () => {
  const { user } = useAuth();
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch favourites on mount
  useEffect(() => {
    const fetchFavourites = async () => {
      try {
        const resp = await apiRequest('/favourites');
        if (resp.ok && resp.data && resp.data.success) {
          setFavourites(resp.data?.data || []);
        } else {
          setError('Failed to load favourites');
        }
      } catch (e) {
        setError('Error loading favourites');
      } finally {
        setLoading(false);
      }
    };
    fetchFavourites();
  }, []);

  const handleFavouriteChange = (propertyId, nowFav) => {
    if (!nowFav) {
      // removed from favourites, filter out
      setFavourites((prev) => prev.filter((p) => p.id !== propertyId));
    }
  };

  if (loading) {
    return (
      <section className="page-section"><div className="container"><p>Loading favourites...</p></div></section>
    );
  }

  if (error) {
    return (
      <section className="page-section"><div className="container"><p className="error">{error}</p></div></section>
    );
  }

  if (!favourites.length) {
    return (
      <section className="page-section"><div className="container"><p>No favourite properties found.</p></div></section>
    );
  }

  return (
    <section className="page-section">
      <div className="container">
        <h2 className="section-title">My Favourites</h2>
        <div className="grid">
          {favourites.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              isFavourite={true}
              onFavouriteChange={handleFavouriteChange}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FavouritesPage;

