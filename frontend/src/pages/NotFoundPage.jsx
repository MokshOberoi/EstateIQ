import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <section className="page-section">
    <div className="container">
      <h2 className="section-title">404 – Page Not Found</h2>
      <p>Sorry, the page you are looking for does not exist.</p>
      <Link to="/" className="btn-primary">Return Home</Link>
    </div>
  </section>
);

export default NotFoundPage;

