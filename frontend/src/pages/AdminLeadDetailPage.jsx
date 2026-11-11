import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiRequest } from "../services/api";

const badgeStyle = (type) => {
  const base = {
    padding: "0.2rem 0.6rem",
    borderRadius: "0.4rem",
    fontWeight: "600",
    color: "#fff",
    fontSize: "0.8rem",
  };

  switch (type) {
    case "HOT":
      return { ...base, backgroundColor: "#e53935" };
    case "WARM":
      return { ...base, backgroundColor: "#fb8c00" };
    case "COLD":
      return { ...base, backgroundColor: "#43a047" };
    default:
      return { ...base, backgroundColor: "#777" };
  }
};

const AdminLeadDetailPage = () => {
  const { userId } = useParams();

  const [lead, setLead] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leadResp, historyResp] = await Promise.all([
          apiRequest(`/leads/${userId}`),
          apiRequest(`/leads/${userId}/history`),
        ]);

        if (leadResp.ok && leadResp.data?.success) {
          setLead(leadResp.data?.data || null);
        } else {
          throw new Error(
            leadResp.data?.error?.message ||
            leadResp.data?.message ||
            "Failed to load lead"
          );
        }

        if (historyResp.ok && historyResp.data?.success) {
          const historyData = historyResp.data?.data;
          setHistory(Array.isArray(historyData) ? historyData : []);
        }
      } catch (err) {
        setError(err.message || "Network error while loading lead details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const runPrediction = async () => {
    setPredicting(true);
    setError(null);

    try {
      const resp = await apiRequest(`/leads/${userId}/predict`, {
        method: "POST",
      });

      if (resp.ok && resp.data?.success) {
        setPrediction(resp.data?.data || null);
      } else {
        throw new Error(
          resp.data?.error?.message ||
          resp.data?.message ||
          "Prediction failed"
        );
      }
    } catch (err) {
      setError(err.message || "Prediction failed");
    } finally {
      setPredicting(false);
    }
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(Number(value));
  };

  const formatPriceRange = (min, max) => {
    const formattedMin = formatCurrency(min);
    const formattedMax = formatCurrency(max);

    if (!formattedMin && !formattedMax) return "-";
    if (formattedMin && formattedMax) {
      return `${formattedMin} - ${formattedMax}`;
    }

    return formattedMin ? `From ${formattedMin}` : `Up to ${formattedMax}`;
  };

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString();
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined) return "-";

    const number = Number(value);
    if (Number.isNaN(number)) return "-";

    return `${(number * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <section className="page-section">
        <div
          className="container"
          style={{ textAlign: "center", padding: "2rem" }}
        >
          <p>Loading lead details...</p>
        </div>
      </section>
    );
  }

  if (!lead) {
    return (
      <section className="page-section">
        <div className="container">
          <Link to="/admin/leads" className="btn-link">
            ← Back to Lead Intelligence
          </Link>
          <p className="error">{error || "Lead not found."}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="container">
        <Link
          to="/admin/leads"
          className="btn-link"
          style={{ marginBottom: "1rem", display: "inline-block" }}
        >
          ← Back to Lead Intelligence
        </Link>

        <h2 className="section-title">
          Lead Detail - {lead.user_id?.slice(0, 8)}...
        </h2>

        {error && (
          <p className="error" style={{ marginBottom: "1rem" }}>
            {error}
          </p>
        )}

        <div
          style={{
            display: "flex",
            gap: "2rem",
            flexWrap: "wrap",
          }}
        >
          <div
            className="card"
            style={{
              flex: "1 1 250px",
              padding: "1rem",
            }}
          >
            <h3>Lead Score</h3>

            <p style={{ fontSize: "2rem", margin: "0.5rem 0" }}>
              {lead.current_score ?? "-"}/100
            </p>

            <h4>Rule-Based Classification</h4>

            <span style={badgeStyle(lead.classification)}>
              {lead.classification || "N/A"}
            </span>
          </div>

          <div
            style={{
              flex: "2 1 500px",
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "1rem",
            }}
          >
            <div className="card" style={{ padding: "1rem" }}>
              <strong>Engagement Score</strong>
              <p>{lead.engagement_score ?? "-"}</p>
            </div>

            <div className="card" style={{ padding: "1rem" }}>
              <strong>Intent Score</strong>
              <p>{lead.intent_score ?? "-"}</p>
            </div>

            <div className="card" style={{ padding: "1rem" }}>
              <strong>Recency Score</strong>
              <p>{lead.recency_score ?? "-"}</p>
            </div>
          </div>
        </div>

        <h3 style={{ marginTop: "1.5rem" }}>Activity Metrics</h3>

        <ul style={{ listStyle: "none", padding: 0 }}>
          <li>Total Views: {lead.total_views ?? "-"}</li>
          <li>Total Favourites: {lead.total_favourites ?? "-"}</li>
          <li>Total Enquiries: {lead.total_enquiries ?? "-"}</li>
          <li>Total Dwell Time: {lead.total_dwell_time ?? "-"}</li>
        </ul>

        <h3 style={{ marginTop: "1.5rem" }}>Buyer Preferences</h3>

        <ul style={{ listStyle: "none", padding: 0 }}>
          <li>Preferred City: {lead.preferred_city || "-"}</li>
          <li>
            Preferred Property Type:{" "}
            {lead.preferred_property_type || "-"}
          </li>
          <li>
            Preferred Price Range:{" "}
            {formatPriceRange(
              lead.preferred_min_price,
              lead.preferred_max_price
            )}
          </li>
        </ul>

        <div style={{ marginTop: "2rem" }}>
          <button
            className="btn-primary"
            onClick={runPrediction}
            disabled={predicting}
          >
            {predicting ? "Running..." : "Run ML Prediction"}
          </button>
        </div>

        {prediction?.mlPrediction && (
          <div
            className="card"
            style={{ marginTop: "1.5rem", padding: "1.5rem" }}
          >
            <h3>Rule-Based Result vs ML Prediction</h3>

            <p>
              <strong>Rule-Based Result: </strong>
              <span style={badgeStyle(lead.classification)}>
                {lead.classification || "N/A"}
              </span>
            </p>

            <p>
              <strong>ML Predicted Classification: </strong>
              <span
                style={badgeStyle(
                  prediction.mlPrediction.classification
                )}
              >
                {prediction.mlPrediction.classification || "N/A"}
              </span>
            </p>

            <p>
              <strong>Confidence: </strong>
              {formatPercent(prediction.mlPrediction.confidence)}
            </p>

            <h4>ML Probability Breakdown</h4>

            <ul>
              <li>
                COLD:{" "}
                {formatPercent(
                  prediction.mlPrediction.probabilities?.COLD
                )}
              </li>
              <li>
                WARM:{" "}
                {formatPercent(
                  prediction.mlPrediction.probabilities?.WARM
                )}
              </li>
              <li>
                HOT:{" "}
                {formatPercent(
                  prediction.mlPrediction.probabilities?.HOT
                )}
              </li>
            </ul>
          </div>
        )}

        <h3 style={{ marginTop: "2rem" }}>Lead Score History</h3>

        {history.length === 0 ? (
          <p>No lead score history is available.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr>
                  <th style={{ padding: "0.75rem", textAlign: "left" }}>
                    Date
                  </th>
                  <th style={{ padding: "0.75rem", textAlign: "left" }}>
                    Score
                  </th>
                  <th style={{ padding: "0.75rem", textAlign: "left" }}>
                    Classification
                  </th>
                </tr>
              </thead>

              <tbody>
                {history.map((item, index) => (
                  <tr key={item.id || index}>
                    <td style={{ padding: "0.75rem" }}>
                      {formatDate(
                        item.created_at ||
                        item.calculated_at ||
                        item.timestamp
                      )}
                    </td>

                    <td style={{ padding: "0.75rem" }}>
                      {item.current_score ?? item.lead_score ?? "-"}
                    </td>

                    <td style={{ padding: "0.75rem" }}>
                      <span
                        style={badgeStyle(item.classification)}
                      >
                        {item.classification || "N/A"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminLeadDetailPage;