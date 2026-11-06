import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // No backend integration – placeholder action
    alert('Login submitted (no backend).');
  };

  return (
    <section className="page-section">
      <div className="container form-container">
        <h2 className="section-title">Login</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button type="submit" className="btn-primary">Login</button>
        </form>
        <p className="auth-switch">
          New here? <Link to="/register" className="link-secondary">Register</Link>
        </p>
      </div>
    </section>
  );
};

export default LoginPage;

