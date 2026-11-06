// src/pages/PropertiesPage.jsx
import React, { useEffect, useState } from 'react';
import PropertyCard from '../components/PropertyCard';
import { apiRequest } from '../services/api';

const PropertiesPage = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await apiRequest('/properties');
        if (response.ok && response.data && response.data.success) {
          setProperties(response.data.message?.data || []);
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

  if (loading) {
    return (
      <section className="page-section">
        <div className="container"><p>Loading properties...</p></div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page-section">
        <div className="container"><p className="error">{error}</p></div>
      </section>
    );
  }

  if (properties.length === 0) {
    return (
      <section className="page-section">
        <div className="container">
          <h2 className="section-title">All Properties</h2>
          <p>No properties are currently available.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="container">
        <h2 className="section-title">All Properties</h2>
        <div className="property-grid">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PropertiesPage;