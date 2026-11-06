import React from 'react';
import PropertyCard from '../components/PropertyCard';
import { properties } from '../data/properties';

const PropertiesPage = () => (
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

export default PropertiesPage;

