import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {Chart as ChartJS,CategoryScale,LinearScale,PointElement,LineElement,Title,Tooltip,Legend,} from "chart.js";
import "./index.css";

ChartJS.register(CategoryScale,LinearScale,PointElement,LineElement,Title,Tooltip,Legend);

const BACKEND_URL = "http://127.0.0.1:8000/scan";
const POLL_INTERVAL_MS = 10000; // 10s
const MAX_HISTORY = 10;

function RiskBadge({ risk }) {
  if (!risk) return null;
  const r = risk.toLowerCase();
  const cls =
    r.includes("high")
      ? "badge high"
      : r.includes("moderate")
      ? "badge moderate"
      : "badge safe";
  return <span className={cls}>{risk}</span>;
}

export default function App() {
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [modalData, setModalData] = useState(null);
  const intervalRef = useRef(null);

  const fetchNetworks = async () => {
    setError("");
    try {
      const res = await axios.get(BACKEND_URL, { timeout: 7000 });
      const data = res.data;
      if (data && Array.isArray(data.networks)) {
        const processed = data.networks.map((net) => {
          let hist = net.signal_history || [];
          if (hist.length > MAX_HISTORY) hist = hist.slice(-MAX_HISTORY);
          return { ...net, signal_history: hist };
        });
        setNetworks(processed);
        setLastUpdated(new Date());
      } else setError("Unexpected response from backend.");
    } catch (err) {
      setError(err.message || "Failed to fetch networks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworks();
    intervalRef.current = setInterval(fetchNetworks, POLL_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div className="app">
      <div className="header">
        <div>
          <h1 style={{ margin: 0 }}>Wi-Fi Security Scanner</h1>
          <div className="small">Scans nearby Wi-Fi networks and shows risk levels</div>
        </div>
        <div className="controls">
          <button
            className="button secondary"
            onClick={() => {
              setLoading(true);
              fetchNetworks();
            }}
          >
            Scan now
          </button>
          <div className="small" style={{ textAlign: "right" }}>
            <div className="status">
              {loading
                ? "Loading…"
                : error
                ? `Error`
                : `Updated ${lastUpdated ? lastUpdated.toLocaleTimeString() : "-"}`}
            </div>
            {error && <div style={{ color: "red", fontSize: 13 }}>{error}</div>}
          </div>
        </div>
      </div>

      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div className="legend">
            <div className="item">
              <span className="badge safe" style={{ width: 14, height: 14, padding: 0, borderRadius: 4 }}></span>
              <div className="small" style={{ marginLeft: 6 }}>Safe (WPA2/WPA3)</div>
            </div>
            <div className="item">
              <span className="badge moderate" style={{ width: 14, height: 14, padding: 0, borderRadius: 4 }}></span>
              <div className="small" style={{ marginLeft: 6 }}>Moderate (WPA/Unknown)</div>
            </div>
            <div className="item">
              <span className="badge high" style={{ width: 14, height: 14, padding: 0, borderRadius: 4 }}></span>
              <div className="small" style={{ marginLeft: 6 }}>High Risk (Open/WEP)</div>
            </div>
          </div>
          <div className="small">Auto-refresh: every {POLL_INTERVAL_MS / 1000}s</div>
        </div>

        <table className="table" aria-live="polite">
          <thead>
            <tr>
              <th>SSID</th>
              <th>BSSID</th>
              <th>Signal (dBm)</th>
              <th>Security</th>
              <th>Risk</th>
              <th>Trend</th>
            </tr>
          </thead>

          <tbody>
            {networks.length === 0 && !loading && (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: 20 }}>No networks found.</td>
              </tr>
            )}

            {networks.map((net, i) => (
              <tr
                key={`${net.bssid || net.ssid || i}-${i}`}
                className={net.connected ? "connected-network" : ""}
              >
                <td>{net.ssid || <span className="small">Hidden SSID</span>}</td>
                <td className="small">{net.bssid || "-"}</td>
                <td className="small">{typeof net.signal === "number" ? net.signal : "-"}</td>
                <td className="small">{net.security || "Unknown"}</td>
                <td>
                  {net.connected && <span className="badge connected">Connected</span>}
                  <RiskBadge risk={net.risk || "Unknown"} />
                </td>
                <td>
                  {net.signal_history && net.signal_history.length > 0 && (
                    <div
                      className="small-chart"
                      onClick={() => setModalData(net)}
                      title="Click to enlarge"
                    >
                      <Line
                        data={{
                          labels: net.signal_history.map((_, idx) => idx + 1),
                          datasets: [
                            {
                              label: "Signal (dBm)",
                              data: net.signal_history,
                              borderColor: "#3b82f6",
                              backgroundColor: "rgba(59,130,246,0.2)",
                              tension: 0.3,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: {
                            y: { beginAtZero: false },
                            x: { display: false },
                          },
                        }}
                      />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalData && (
        <div className="modal" onClick={() => setModalData(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{modalData.ssid || "Hidden SSID"} - Signal Trend</h3>
            <Line
              data={{
                labels: modalData.signal_history.map((_, idx) => idx + 1),
                datasets: [
                  {
                    label: "Signal (dBm)",
                    data: modalData.signal_history,
                    borderColor: "#3b82f6",
                    backgroundColor: "rgba(59,130,246,0.2)",
                    tension: 0.3,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: { legend: { display: true } },
              }}
            />
            <button className="button" onClick={() => setModalData(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
