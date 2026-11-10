// src/pages/DashboardPage.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AdminLeadPrediction from "../components/AdminLeadPrediction";
import { apiRequest } from "../services/api";

const formatCurrency = (val) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(val) || 0);
};

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDwellTime = (seconds) => {
  const s = Number(seconds) || 0;
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const remainingS = s % 60;
  return remainingS > 0 ? `${m}m ${remainingS}s` : `${m}m`;
};

const DashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Role-specific data states
  const [agentData, setAgentData] = useState(null);
  const [adminData, setAdminData] = useState(null);
  const [buyerData, setBuyerData] = useState(null);

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      if (user.role === "AGENT") {
        // Fetch agent's property listings
        const response = await apiRequest("/properties/my/listings?limit=100");
        if (response.ok) {
          const listings = response.data?.data?.data || [];
          const total = response.data?.data?.pagination?.total ?? listings.length;
          const activeCount = listings.filter((p) => p.status === "ACTIVE").length;
          const pendingCount = listings.filter((p) => p.status === "PENDING").length;
          const soldCount = listings.filter((p) => p.status === "SOLD").length;
          const portfolioValue = listings.reduce(
            (sum, p) => sum + (Number(p.price) || 0),
            0
          );
          const recentListings = [...listings]
            .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
            .slice(0, 5);

          setAgentData({
            total,
            activeCount,
            pendingCount,
            soldCount,
            portfolioValue,
            recentListings,
          });
        } else {
          setError(response.data?.error?.message || "Failed to load agent listings");
        }
      } else if (user.role === "ADMIN") {
        // Fetch platform properties total and leads
        const [propsRes, leadsRes] = await Promise.all([
          apiRequest("/properties?limit=1"),
          apiRequest("/leads?limit=100"),
        ]);

        if (propsRes.ok && leadsRes.ok) {
          const totalProperties = propsRes.data?.data?.pagination?.total || 0;
          const leads = leadsRes.data?.data?.data || [];
          const totalLeads = leadsRes.data?.data?.pagination?.total ?? leads.length;

          const hotCount = leads.filter((l) => l.classification === "HOT").length;
          const warmCount = leads.filter((l) => l.classification === "WARM").length;
          const coldCount = leads.filter((l) => l.classification === "COLD").length;

          const topLeads = [...leads]
            .sort((a, b) => (Number(b.current_score) || 0) - (Number(a.current_score) || 0))
            .slice(0, 5);

          setAdminData({
            totalProperties,
            totalLeads,
            hotCount,
            warmCount,
            coldCount,
            topLeads,
          });
        } else {
          const errorMsg =
            !propsRes.ok
              ? propsRes.data?.error?.message || "Failed to load properties"
              : leadsRes.data?.error?.message || "Failed to load leads";
          setError(errorMsg);
        }
      } else {
        // BUYER or any other role: fetch lead profile and recommendations
        const [leadRes, recRes] = await Promise.all([
          apiRequest("/leads/me"),
          apiRequest("/recommendations/me"),
        ]);

        const leadProfile = leadRes.ok ? leadRes.data?.data || null : null;
        const recommendations = recRes.ok ? recRes.data?.data?.items || [] : [];

        setBuyerData({
          profile: leadProfile,
          recommendations: recommendations.slice(0, 5),
        });

        if (!leadRes.ok && !recRes.ok) {
          setError(leadRes.data?.error?.message || "Failed to load buyer analytics");
        }
      }
    } catch (err) {
      setError(err.message || "Network error loading dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  // Loading state
  if (loading) {
    return (
      <section className="page-section">
        <div className="container" style={{ textAlign: "center", padding: "3rem" }}>
          <p>Loading dashboard analytics…</p>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="page-section">
        <div className="container">
          <h2 className="section-title">Dashboard</h2>
          <div style={{ textAlign: "center", maxWidth: "500px", margin: "2rem auto" }}>
            <p className="error">{error}</p>
            <button className="btn-primary" onClick={fetchDashboardData} style={{ marginTop: "1rem" }}>
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  const renderStatusBadge = (status) => {
    switch (status) {
      case "ACTIVE":
        return <span className="status-badge badge-active">Active</span>;
      case "PENDING":
        return <span className="status-badge badge-pending">Pending</span>;
      case "SOLD":
        return <span className="status-badge badge-sold">Sold</span>;
      default:
        return <span className="status-badge">{status || "Unknown"}</span>;
    }
  };

  const renderClassificationBadge = (classification) => {
    switch (classification) {
      case "HOT":
        return <span className="status-badge badge-hot">Hot</span>;
      case "WARM":
        return <span className="status-badge badge-warm">Warm</span>;
      case "COLD":
        return <span className="status-badge badge-cold">Cold</span>;
      default:
        return <span className="status-badge">{classification || "N/A"}</span>;
    }
  };

  // 1. Agent Dashboard View
  const renderAgentDashboard = () => {
    if (!agentData) return null;
    const { total, activeCount, pendingCount, soldCount, portfolioValue, recentListings } = agentData;
    const activePct = total > 0 ? Math.round((activeCount / total) * 100) : 0;
    const pendingPct = total > 0 ? Math.round((pendingCount / total) * 100) : 0;
    const soldPct = total > 0 ? Math.round((soldCount / total) * 100) : 0;

    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h2>Welcome back, {user?.full_name || "Agent"}</h2>
          <p>Here is an overview of your active property listings and sales pipeline.</p>
        </div>

        {/* KPI Cards */}
        <div className="dashboard-grid">
          <div className="stat-card">
            <span className="stat-label">Total Listings</span>
            <span className="stat-value">{total}</span>
            <span className="stat-subtext">Managed properties</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Active Properties</span>
            <span className="stat-value" style={{ color: "#2e7d32" }}>{activeCount}</span>
            <span className="stat-subtext">{activePct}% of total listings</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Pending Properties</span>
            <span className="stat-value" style={{ color: "#ed6c02" }}>{pendingCount}</span>
            <span className="stat-subtext">{pendingPct}% under contract</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Portfolio Value</span>
            <span className="stat-value">{formatCurrency(portfolioValue)}</span>
            <span className="stat-subtext">Total catalog value</span>
          </div>
        </div>

        {/* Listing Status Overview */}
        <div className="dashboard-section">
          <h3 className="dashboard-section-title">Listing Status Overview</h3>
          <div className="analytics-bar">
            <div className="analytics-bar-row">
              <div className="analytics-bar-header">
                <span>Active ({activeCount})</span>
                <span>{activePct}%</span>
              </div>
              <div className="analytics-bar-track">
                <div className="analytics-bar-fill fill-active" style={{ width: `${activePct}%` }} />
              </div>
            </div>

            <div className="analytics-bar-row">
              <div className="analytics-bar-header">
                <span>Pending ({pendingCount})</span>
                <span>{pendingPct}%</span>
              </div>
              <div className="analytics-bar-track">
                <div className="analytics-bar-fill fill-pending" style={{ width: `${pendingPct}%` }} />
              </div>
            </div>

            <div className="analytics-bar-row">
              <div className="analytics-bar-header">
                <span>Sold ({soldCount})</span>
                <span>{soldPct}%</span>
              </div>
              <div className="analytics-bar-track">
                <div className="analytics-bar-fill fill-sold" style={{ width: `${soldPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Listings */}
        <div className="dashboard-section">
          <div className="dashboard-section-title">
            <span>Recent Listings</span>
            <Link to="/my-listings" className="btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}>
              View All Listings
            </Link>
          </div>

          {recentListings.length === 0 ? (
            <div className="empty-state">
              <p>No listings available yet.</p>
              <Link to="/properties/create" className="btn-primary" style={{ display: "inline-block" }}>
                Add First Property
              </Link>
            </div>
          ) : (
            <div className="dashboard-table-container">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Location</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Date Added</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentListings.map((property) => (
                    <tr key={property.id}>
                      <td>
                        <strong>{property.title}</strong>
                      </td>
                      <td>
                        {property.city && property.state
                          ? `${property.city}, ${property.state}`
                          : property.city || property.address || "N/A"}
                      </td>
                      <td>{formatCurrency(property.price)}</td>
                      <td>{renderStatusBadge(property.status)}</td>
                      <td>{formatDate(property.created_at)}</td>
                      <td>
                        <Link
                          to={`/properties/${property.id}`}
                          className="link-secondary"
                          style={{ fontSize: "0.85rem", fontWeight: "600" }}
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 2. Admin Dashboard View
  const renderAdminDashboard = () => {
    if (!adminData) return null;
    const { totalProperties, totalLeads, hotCount, warmCount, coldCount, topLeads } = adminData;
    const classifiedTotal = hotCount + warmCount + coldCount || 1;
    const hotPct = Math.round((hotCount / classifiedTotal) * 100);
    const warmPct = Math.round((warmCount / classifiedTotal) * 100);
    const coldPct = Math.round((coldCount / classifiedTotal) * 100);

    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h2>Welcome back, {user?.full_name || "Admin"} (Administrator)</h2>
          <p>EstateIQ platform intelligence, inventory distribution, and lead scoring telemetry.</p>
        </div>

        {/* KPI Cards */}
        <div className="dashboard-grid">
          <div className="stat-card">
            <span className="stat-label">Total Properties</span>
            <span className="stat-value">{totalProperties}</span>
            <span className="stat-subtext">Active catalog listings</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total Leads</span>
            <span className="stat-value">{totalLeads}</span>
            <span className="stat-subtext">Tracked buyer profiles</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Hot Leads</span>
            <span className="stat-value" style={{ color: "#d32f2f" }}>{hotCount}</span>
            <span className="stat-subtext">Score ≥ 70 (high intent)</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Warm Leads</span>
            <span className="stat-value" style={{ color: "#f57c00" }}>{warmCount}</span>
            <span className="stat-subtext">Score 40–69 (engaged)</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Cold Leads</span>
            <span className="stat-value" style={{ color: "#0288d1" }}>{coldCount}</span>
            <span className="stat-subtext">Score &lt; 40 (exploratory)</span>
          </div>
        </div>

        {/* Lead Classification Overview */}
        <div className="dashboard-section">
          <h3 className="dashboard-section-title">Lead Classification Distribution</h3>
          <div className="analytics-bar">
            <div className="analytics-bar-row">
              <div className="analytics-bar-header">
                <span>Hot Leads ({hotCount})</span>
                <span>{hotPct}%</span>
              </div>
              <div className="analytics-bar-track">
                <div className="analytics-bar-fill fill-hot" style={{ width: `${hotPct}%` }} />
              </div>
            </div>

            <div className="analytics-bar-row">
              <div className="analytics-bar-header">
                <span>Warm Leads ({warmCount})</span>
                <span>{warmPct}%</span>
              </div>
              <div className="analytics-bar-track">
                <div className="analytics-bar-fill fill-warm" style={{ width: `${warmPct}%` }} />
              </div>
            </div>

            <div className="analytics-bar-row">
              <div className="analytics-bar-header">
                <span>Cold Leads ({coldCount})</span>
                <span>{coldPct}%</span>
              </div>
              <div className="analytics-bar-track">
                <div className="analytics-bar-fill fill-cold" style={{ width: `${coldPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Top Leads */}
        <div className="dashboard-section">
          <h3 className="dashboard-section-title">Top High-Intent Leads</h3>
          {topLeads.length === 0 ? (
            <div className="empty-state">
              <p>No leads available yet.</p>
            </div>
          ) : (
            <div className="dashboard-table-container">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>User Identifier</th>
                    <th>Score</th>
                    <th>Classification</th>
                    <th>AI Prediction</th>
                    <th>Views</th>
                    <th>Favourites</th>
                    <th>Enquiries</th>
                    <th>Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {topLeads.map((lead) => (
                    <tr key={lead.id || lead.user_id}>
                      <td>
                        <strong>
                          {lead.user_id ? `User #${lead.user_id.slice(0, 8)}` : "Unknown Lead"}
                        </strong>
                      </td>
                      <td>
                        <span style={{ fontWeight: "700", fontSize: "1rem" }}>
                          {lead.current_score ?? 0}
                        </span>{" "}
                        <span style={{ fontSize: "0.8rem", color: "#888" }}>/ 100</span>
                      </td>
                      <td>{renderClassificationBadge(lead.classification)}</td>
                      <td><AdminLeadPrediction lead={lead} /></td>
                      <td>{lead.total_views ?? 0}</td>
                      <td>{lead.total_favourites ?? 0}</td>
                      <td>{lead.total_enquiries ?? 0}</td>
                      <td>{formatDate(lead.last_active_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 3. Buyer Dashboard View
  const renderBuyerDashboard = () => {
    if (!buyerData) return null;
    const { profile, recommendations } = buyerData;

    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h2>Welcome back, {user?.full_name || "Buyer"}</h2>
          <p>Track your property search intelligence and personalized recommendations.</p>
        </div>

        {/* Lead Intelligence KPI Cards */}
        <div className="dashboard-grid">
          <div className="stat-card">
            <span className="stat-label">Current Lead Score</span>
            <span className="stat-value">{profile?.current_score ?? 0} <span style={{ fontSize: "1rem", color: "#888" }}>/ 100</span></span>
            <span className="stat-subtext">Calculated search intent</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Classification</span>
            <div style={{ marginTop: "0.25rem" }}>
              {renderClassificationBadge(profile?.classification || "COLD")}
            </div>
            <span className="stat-subtext">Engagement status</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Engagement Score</span>
            <span className="stat-value" style={{ color: "#2e7d32" }}>
              {profile?.engagement_score ?? 0}
            </span>
            <span className="stat-subtext">Max 40 points</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Intent Score</span>
            <span className="stat-value" style={{ color: "#0288d1" }}>
              {profile?.intent_score ?? 0}
            </span>
            <span className="stat-subtext">Max 40 points</span>
          </div>
        </div>

        {/* Activity & Preferences Summary */}
        <div className="dashboard-section">
          <h3 className="dashboard-section-title">Activity &amp; Search Preferences</h3>
          <div className="dashboard-grid">
            <div className="stat-card" style={{ boxShadow: "none", background: "#fafafa" }}>
              <span className="stat-label">Property Views</span>
              <span className="stat-value">{profile?.total_views ?? 0}</span>
              <span className="stat-subtext">Properties inspected</span>
            </div>
            <div className="stat-card" style={{ boxShadow: "none", background: "#fafafa" }}>
              <span className="stat-label">Saved Favourites</span>
              <span className="stat-value">{profile?.total_favourites ?? 0}</span>
              <span className="stat-subtext">Shortlisted homes</span>
            </div>
            <div className="stat-card" style={{ boxShadow: "none", background: "#fafafa" }}>
              <span className="stat-label">Direct Enquiries</span>
              <span className="stat-value">{profile?.total_enquiries ?? 0}</span>
              <span className="stat-subtext">Agent contacts submitted</span>
            </div>
            <div className="stat-card" style={{ boxShadow: "none", background: "#fafafa" }}>
              <span className="stat-label">Total Dwell Time</span>
              <span className="stat-value">{formatDwellTime(profile?.total_dwell_time)}</span>
              <span className="stat-subtext">Time exploring properties</span>
            </div>
          </div>

          {(profile?.preferred_property_type || profile?.preferred_city) && (
            <div style={{ marginTop: "1.5rem", padding: "1rem", backgroundColor: "#f9f9f9", borderRadius: "6px" }}>
              <p style={{ margin: "0.25rem 0" }}>
                <strong>Preferred Property Type:</strong>{" "}
                {profile.preferred_property_type ? profile.preferred_property_type.replace(/_/g, " ") : "Not specified"}
              </p>
              <p style={{ margin: "0.25rem 0" }}>
                <strong>Preferred City:</strong> {profile.preferred_city || "Not specified"}
              </p>
            </div>
          )}
        </div>

        {/* Recommended Properties */}
        <div className="dashboard-section">
          <div className="dashboard-section-title">
            <span>Recommended Properties for You</span>
            <Link to="/recommendations" className="btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}>
              View All Recommendations
            </Link>
          </div>

          {recommendations.length === 0 ? (
            <div className="empty-state">
              <p>No recommendations available yet.</p>
              <Link to="/properties" className="btn-primary" style={{ display: "inline-block" }}>
                Browse Catalog
              </Link>
            </div>
          ) : (
            <div className="dashboard-table-container">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Location</th>
                    <th>Price</th>
                    <th>Match Score</th>
                    <th>Recommendation Reason</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recommendations.map((item) => (
                    <tr key={item.id || item.property_id}>
                      <td>
                        <strong>{item.title || "Featured Property"}</strong>
                      </td>
                      <td>
                        {item.city && item.state
                          ? `${item.city}, ${item.state}`
                          : item.city || item.location || "N/A"}
                      </td>
                      <td>{formatCurrency(item.price)}</td>
                      <td>
                        <span style={{ fontWeight: "700", color: "#2e7d32" }}>
                          {item.score ? `${Math.round(Number(item.score) * 100)}%` : "N/A"}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.85rem", color: "#666" }}>
                        {item.explanation || "Matched based on search preferences"}
                      </td>
                      <td>
                        <Link
                          to={`/properties/${item.property_id || item.id}`}
                          className="link-secondary"
                          style={{ fontSize: "0.85rem", fontWeight: "600" }}
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="page-section">
      <div className="container">
        {user?.role === "AGENT" && renderAgentDashboard()}
        {user?.role === "ADMIN" && renderAdminDashboard()}
        {user?.role !== "AGENT" && user?.role !== "ADMIN" && renderBuyerDashboard()}
      </div>
    </section>
  );
};

export default DashboardPage;
