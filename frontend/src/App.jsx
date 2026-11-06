// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import PropertiesPage from "./pages/PropertiesPage";
import PropertyDetailPage from "./pages/PropertyDetailPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import NotFoundPage from "./pages/NotFoundPage";
import LeadProfilePage from "./pages/LeadProfilePage";
import RecommendationsPage from "./pages/RecommendationsPage";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
// New pages for agent property management
import MyListingsPage from "./pages/MyListingsPage";
import CreatePropertyPage from "./pages/CreatePropertyPage";
import EditPropertyPage from "./pages/EditPropertyPage";

const App = () => (
  <AuthProvider>
    <Router>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/properties/:id" element={<PropertyDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<ProtectedRoute element={<DashboardPage />} />} />
          <Route path="/lead-profile" element={<ProtectedRoute element={<LeadProfilePage />} />} />
          <Route path="/recommendations" element={<ProtectedRoute element={<RecommendationsPage />} />} />
          <Route path="/my-listings" element={<ProtectedRoute element={<MyListingsPage />} allowedRoles={["AGENT","ADMIN"]} />} />
          <Route path="/properties/create" element={<ProtectedRoute element={<CreatePropertyPage />} allowedRoles={["AGENT","ADMIN"]} />} />
          <Route path="/properties/:id/edit" element={<ProtectedRoute element={<EditPropertyPage />} allowedRoles={["AGENT","ADMIN"]} />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </Router>
  </AuthProvider>
);

export default App;
