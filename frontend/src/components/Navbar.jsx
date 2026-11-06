import React from 'react';
import { NavLink } from 'react-router-dom';


const Navbar = () => (
  <nav className="nav">
    <div className="container">
      <NavLink to="/" className="logo">EstateIQ</NavLink>
      <ul className="nav-links">
        <li><NavLink to="/" end>Home</NavLink></li>
        <li><NavLink to="/properties">Properties</NavLink></li>
        <li><NavLink to="/login">Login</NavLink></li>
        <li><NavLink to="/register">Register</NavLink></li>
        <li><NavLink to="/dashboard">Dashboard</NavLink></li>
      </ul>
    </div>
  </nav>
);

export default Navbar;
