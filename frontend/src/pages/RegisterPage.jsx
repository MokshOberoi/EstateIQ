import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import BrandTagline from '../components/BrandTagline';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { register, error, loading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await register({ name, email, password, phone });
    setSubmitting(false);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <section className="page-section">
      <div className="container form-container">
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
  <BrandLogo />
  <BrandTagline />
</div>
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
          <label>
            Phone
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </label>
          <button type="submit" className="btn-primary" disabled={submitting || loading}>
            {submitting || loading ? 'Registering…' : 'Register'}
          </button>
        </form>
        {error && <p className="error" style={{ color: 'red' }}>{error}</p>}
        <p className="auth-switch">
          Already have an account? <Link to="/login" className="link-secondary">Login</Link>
        </p>
      </div>
    </section>
  );
};

export default RegisterPage;

