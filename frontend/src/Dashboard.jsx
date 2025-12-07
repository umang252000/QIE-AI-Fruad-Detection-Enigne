import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Dashboard({ onWalletSelect }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadReports() {
    try {
      setError("");
      const res = await axios.get("http://localhost:8000/reports");
      setReports(res.data || []);
    } catch (err) {
      console.error("Error loading reports:", err);
      setError("Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();

    const timer = setInterval(loadReports, 5000); // auto-refresh
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2 className="text-xl font-bold">Fraud Alerts Feed</h2>
      <p className="text-gray-600 mb-4">
        Live reports from AI indexer & blockchain events
      </p>

      {/* Loading */}
      {loading && <p>Loading reports...</p>}

      {/* Error */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Empty state */}
      {!loading && reports.length === 0 && (
        <p>No reports found yet.</p>
      )}

      {/* Table */}
      {reports.length > 0 && (
        <div
          style={{
            overflowX: "auto",
            marginTop: 20,
            border: "1px solid #ddd",
            borderRadius: 6,
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
            }}
          >
            <thead style={{ background: "#f7f7f7" }}>
              <tr>
                <th style={{ padding: 12 }}>Wallet</th>
                <th style={{ padding: 12 }}>Reporter</th>
                <th style={{ padding: 12 }}>Block</th>
                <th style={{ padding: 12 }}>Action</th>
              </tr>
            </thead>

            <tbody>
              {reports.map((r, index) => (
                <tr
                  key={index}
                  style={{
                    borderTop: "1px solid #eee",
                    background:
                      index % 2 === 0 ? "white" : "#fafafa",
                  }}
                >
                  <td style={{ padding: 12 }}>{r.wallet}</td>
                  <td style={{ padding: 12 }}>{r.reporter}</td>
                  <td style={{ padding: 12 }}>{r.block}</td>

                  <td style={{ padding: 12 }}>
                    <button
                      onClick={() => onWalletSelect(r.wallet)}
                      style={{
                        padding: "6px 12px",
                        background: "#2563eb",
                        color: "white",
                        borderRadius: 4,
                        cursor: "pointer",
                        border: "none",
                      }}
                    >
                      View Risk
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}