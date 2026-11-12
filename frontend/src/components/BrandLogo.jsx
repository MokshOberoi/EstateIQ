import React from 'react';
import { NavLink } from 'react-router-dom';

// Exact logo asset located in public/branding/propintent-concept3-logo.png
const BrandLogo = () => (
  <NavLink to="/" className="logo">
    <img
      src="/branding/propintent-concept3-logo.png"
      alt="PropIntent"
      style={{ height: '3.4rem', width: 'auto', objectFit: 'contain', display: 'block' }}
    />
  </NavLink>
);

export default BrandLogo;

