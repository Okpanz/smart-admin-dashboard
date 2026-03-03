import { useState, useEffect } from 'react';
import api from '../lib/api';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  timestamp: string;
  services: {
    api: boolean;
    database: boolean;
    storage: boolean;
  };
  metrics: {
    cpu: number;
    memory: number;
    requests?: number;
    rss?: number;
    heapTotal?: number;
    heapUsed?: number;
  };
}

export function SystemHealth() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHealth = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/health');
      const data = response.data.data || response.data;
      
      setHealth(data);
    } catch (err) {
      console.error('Health check failed:', err);
      setHealth({
        status: 'down',
        uptime: 0,
        timestamp: new Date().toISOString(),
        services: {
          api: false,
          database: false,
          storage: false
        },
        metrics: {
          cpu: 0,
          memory: 0,
          requests: 0
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');

        .ff-root {
          font-family: 'DM Sans', sans-serif;
          padding: 2.5rem;
          max-width: 960px;
          color: #0f0f0f;
          margin: 0 auto;
        }

        .ff-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1.5px solid #e5e5e5;
        }

        .ff-title {
          font-size: 1.5rem;
          font-weight: 600;
          letter-spacing: -0.03em;
          margin: 0 0 0.2rem;
        }

        .ff-subtitle {
          font-size: 0.85rem;
          color: #6b6b6b;
          margin: 0;
          font-family: 'IBM Plex Mono', monospace;
        }

        .ff-section-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #aaa;
          margin-bottom: 0.5rem;
          display: block;
        }

        .ff-btn {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          font-weight: 500;
          padding: 0.55rem 1.1rem;
          border-radius: 2px;
          border: none;
          cursor: pointer;
          transition: all 0.12s ease;
          white-space: nowrap;
        }
        .ff-btn-primary {
          background: #10b981;
          color: white;
        }
        .ff-btn-primary:hover:not(:disabled) { background: #059669; }
        .ff-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
        
        .ff-stats {
          display: flex;
          gap: 1.5rem;
          align-items: center;
        }
        .ff-stat { text-align: right; }
        .ff-stat-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 600;
          letter-spacing: -0.04em;
          line-height: 1;
        }
        .ff-stat-label {
          font-size: 0.72rem;
          color: #999;
          font-family: 'IBM Plex Mono', monospace;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .ff-stat-divider {
          width: 1px;
          height: 2rem;
          background: #e5e5e5;
        }
        .ff-table-wrap {
          border: 1.5px solid #e5e5e5;
          border-radius: 2px;
          overflow: hidden;
        }
        .ff-table { width: 100%; border-collapse: collapse; }
        .ff-thead th {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.68rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #999;
          padding: 0.65rem 1rem;
          text-align: left;
          background: #fafafa;
          border-bottom: 1.5px solid #e5e5e5;
        }
        .ff-row { border-bottom: 1px solid #f0f0f0; transition: background 0.1s; }
        .ff-row:hover { background: #fafafa; }
        .ff-td { padding: 0.85rem 1rem; font-size: 0.85rem; }
        .ff-key { font-family: 'IBM Plex Mono', monospace; font-size: 0.8rem; color: #0f0f0f; }
        .ff-desc { color: #777; font-size: 0.82rem; }
        .ff-status {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.02em;
        }
        .ff-status.healthy { color: #10b981; }
        .ff-status.degraded { color: #eab308; }
        .ff-status.down { color: #ef4444; }
      `}</style>

      <div className="ff-root">
        <div className="ff-header">
          <div>
            <h1 className="ff-title">System Health</h1>
            <p className="ff-subtitle">Real-time system performance and status monitoring</p>
          </div>
          <div className="ff-stats">
            <div className="ff-stat">
              <span className="ff-stat-value">
                {health ? Object.values(health.services).filter(Boolean).length : 0}
              </span>
              <span className="ff-stat-label">Healthy</span>
            </div>
            <div className="ff-stat-divider" />
            <div className="ff-stat">
              <span className="ff-stat-value">
                {health ? formatUptime(health.uptime) : '—'}
              </span>
              <span className="ff-stat-label">Uptime</span>
            </div>
            <div className="ff-stat-divider" />
            <button
              onClick={fetchHealth}
              disabled={isLoading}
              className="ff-btn ff-btn-primary"
            >
              Refresh
            </button>
          </div>
        </div>

        <span className="ff-section-label">Components</span>
        <div className="ff-table-wrap" style={{ marginBottom: '1.5rem' }}>
          <table className="ff-table">
            <thead className="ff-thead">
              <tr>
                <th>Component</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="ff-row">
                <td className="ff-td ff-key">API Server</td>
                <td className="ff-td">
                  <span className={`ff-status ${health?.services.api ? 'healthy' : 'down'}`}>
                    {health?.services.api ? 'healthy' : 'down'}
                  </span>
                </td>
              </tr>
              <tr className="ff-row">
                <td className="ff-td ff-key">Database</td>
                <td className="ff-td">
                  <span className={`ff-status ${health?.services.database ? 'healthy' : 'down'}`}>
                    {health?.services.database ? 'healthy' : 'down'}
                  </span>
                </td>
              </tr>
              <tr className="ff-row">
                <td className="ff-td ff-key">File Storage</td>
                <td className="ff-td">
                  <span className={`ff-status ${health?.services.storage ? 'healthy' : 'down'}`}>
                    {health?.services.storage ? 'healthy' : 'down'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <span className="ff-section-label">Metrics</span>
        <div className="bg-white rounded-xl border border-gray-200 p-6" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span className="ff-desc">CPU Usage</span>
                <span className="ff-key">{Number(health?.metrics.cpu).toFixed(2) || 0}%</span>
              </div>
              <div style={{ width: '100%', background: '#e5e5e5', borderRadius: 2, height: 6 }}>
                <div style={{ width: `${health?.metrics.cpu || 0}%`, background: '#10b981', height: 6, borderRadius: 2 }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span className="ff-desc">Memory Usage</span>
                <span className="ff-key">{health?.metrics.memory || 0}%</span>
              </div>
              <div style={{ width: '100%', background: '#e5e5e5', borderRadius: 2, height: 6 }}>
                <div style={{ width: `${health?.metrics.memory || 0}%`, background: '#a855f7', height: 6, borderRadius: 2 }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span className="ff-desc">Request Load</span>
                <span className="ff-key">{health?.metrics.requests || 0} req/min</span>
              </div>
              <div style={{ width: '100%', background: '#e5e5e5', borderRadius: 2, height: 6 }}>
                <div style={{ width: `${(health?.metrics.requests || 0) / 20}%`, background: '#22c55e', height: 6, borderRadius: 2 }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

 
