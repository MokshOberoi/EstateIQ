import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login, error, loading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await login({ email, password });
    setSubmitting(false);
    if (result.success) {
      navigate('/dashboard');
    }
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
          <button type="submit" className="btn-primary" disabled={submitting || loading}>
            {submitting || loading ? 'Logging in…' : 'Login'}
          </button>
        </form>
        {error && <p className="error" style={{ color: 'red' }}>{error}</p>}
        <p className="auth-switch">
          New here? <Link to="/register" className="link-secondary">Register</Link>
        </p>
      </div>
    </section>
  );
};

export default LoginPage;

