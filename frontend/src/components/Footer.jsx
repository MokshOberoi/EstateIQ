import BrandLogo from './BrandLogo';
import BrandTagline from './BrandTagline';



const Footer = () => (
  <footer className="footer">
    <div className="container footer-content">
      <div className="footer-section">
        <BrandLogo />
        <BrandTagline />
        <p>Luxury‑focused real‑estate platform with subtle AI assistance.</p>
      </div>
      <div className="footer-section">
        <h4>Links</h4>
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/properties">Properties</a></li>
          <li><a href="/login">Login</a></li>
          <li><a href="/register">Register</a></li>
          <li><a href="/dashboard">Dashboard</a></li>
        </ul>
      </div>
      <div className="footer-section">
        <h4>Contact</h4>
        <p>Email: <a href="mailto:info@estateiq.com">info@estateiq.com</a></p>
        <p>Phone: +1 800 555 0199</p>
      </div>
    </div>
    <div className="footer-bottom">
      © {new Date().getFullYear()} PropIntent. All rights reserved.
    </div>
  </footer>
);

export default Footer;
