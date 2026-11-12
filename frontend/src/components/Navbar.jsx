import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import BrandLogo from './BrandLogo';
import { useAuth } from '../context/AuthContext';


const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="nav">
      <div className="container">
        <BrandLogo />
        <ul className="nav-links">
          <li><NavLink to="/" end>Home</NavLink></li>
          <li><NavLink to="/properties">Properties</NavLink></li>
          {user && (
            <>
              <li><NavLink to="/dashboard">Dashboard</NavLink></li>
              <li><NavLink to="/lead-profile">Lead Profile</NavLink></li>
{user.role === 'BUYER' && (<>                <li><NavLink to="/favourites">Favourites</NavLink></li>                <li><NavLink to="/my-enquiries">My Enquiries</NavLink></li>              </>)}

              <li><NavLink to="/recommendations">Recommendations</NavLink></li>
              {/* Agent/Admin management links */}
              {(user.role === 'AGENT' || user.role === 'ADMIN') && (
                <>
                  <li><NavLink to="/my-listings">My Listings</NavLink></li>
                  <li><NavLink to="/properties/create">Add Property</NavLink></li>
                  <li><NavLink to="/agent-enquiries">Agent Enquiries</NavLink></li>
          {user.role === 'ADMIN' && (
  <li><NavLink to="/admin/leads">Lead Intelligence</NavLink></li>
)}
                </>
              )}
              <li><button onClick={handleLogout} className="btn-link">Logout</button></li>
            </>
          )}
          {!user && (
            <>
              <li><NavLink to="/login">Login</NavLink></li>
              <li><NavLink to="/register">Register</NavLink></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
