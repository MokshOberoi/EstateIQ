import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Registration submitted (no backend).');
  };

  return (
    <section className="page-section">
      <div className="container form-container">
        <h2 className="section-title">Register</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Name
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <button type="submit" className="btn-primary">Register</button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link to="/login" className="link-secondary">Login</Link>
        </p>
      </div>
    </section>
  );
};

export default RegisterPage;

