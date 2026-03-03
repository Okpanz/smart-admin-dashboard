import { useEffect, useState } from 'react';
import api from '../lib/api';
import { toast } from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';

type Flag = {
  _id: string;
  key: string;
  app?: string;
  description?: string;
  enabled: boolean;
  service_id?: string;
};

type FlagApp = {
  _id: string;
  key: string;
  name: string;
};

export function FeatureFlags() {
  const [apps, setApps] = useState<FlagApp[]>([]);
  const [selectedApp, setSelectedApp] = useState<string>('');
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [creatingApp, setCreatingApp] = useState(false);
  const [newApp, setNewApp] = useState({ key: '', name: '' });
  const [newFlag, setNewFlag] = useState({ key: '', description: '' });
  const [showNewApp, setShowNewApp] = useState(false);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const getSocketBase = () => {
    if (import.meta.env.DEV) return undefined;
    const base = (import.meta.env.VITE_API_BASE_URL || 'https://rivers.thesmartapps.org/api') as string;
    try {
      const u = new URL(base);
      return `${u.protocol}//${u.host}`;
    } catch {
      return undefined;
    }
  };

  const loadApps = async (): Promise<void> => {
    try {
      const res = await api.get('/feature-flag-apps');
      const data = res.data?.data as FlagApp[] | undefined;
      const list = Array.isArray(data) ? data : [];
      setApps(list);
      if (!selectedApp) setSelectedApp(list[0]?.key || '');
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err?.response?.data?.message || err?.message || 'Failed to load apps');
    }
  };

  const loadFlags = async (): Promise<void> => {
    setLoading(true);
    try {
      if (!selectedApp) { setFlags([]); return; }
      const res = await api.get('/feature-flags', { params: { app: selectedApp } });
      const data = res.data?.data as Flag[] | undefined;
      setFlags(Array.isArray(data) ? data : []);
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err?.response?.data?.message || err?.message || 'Failed to load flags');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadApps(); }, []);
  useEffect(() => { loadFlags(); }, [selectedApp]);

  useEffect(() => {
    let socket: Socket | null = null;
    let pollTimer: number | null = null;
    try {
      socket = io(getSocketBase(), {
        path: '/socket.io',
        transports: ['polling', 'websocket'],
        withCredentials: true,
        forceNew: true,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 500,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        query: selectedApp ? { app: selectedApp } : undefined,
      });
      socket.on('featureFlags:changed', (payload: unknown) => {
        const p = payload as { app?: unknown } | null;
        const payloadApp = typeof p?.app === 'string' ? p.app : undefined;
        if (payloadApp && selectedApp && payloadApp !== selectedApp) return;
        loadFlags();
      });
      socket.on('connect_error', () => {
        if (pollTimer != null) return;
        pollTimer = window.setInterval(() => loadFlags(), 15000);
      });
      socket.on('connect', () => {
        if (pollTimer != null) { window.clearInterval(pollTimer); pollTimer = null; }
      });
    } catch { socket = null; }
    return () => {
      if (pollTimer != null) window.clearInterval(pollTimer);
      socket?.disconnect();
    };
  }, [selectedApp]);

  const createApp = async (): Promise<void> => {
    const key = newApp.key.trim();
    const name = newApp.name.trim();
    if (!key) { toast.error('App key is required'); return; }
    if (!name) { toast.error('App name is required'); return; }
    setCreatingApp(true);
    try {
      await api.post('/feature-flag-apps', { key, name });
      toast.success('App created');
      setNewApp({ key: '', name: '' });
      setShowNewApp(false);
      await loadApps();
      setSelectedApp(key);
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create app');
    } finally {
      setCreatingApp(false);
    }
  };

  const toggle = async (key: string): Promise<void> => {
    if (!selectedApp) { toast.error('Select an app first'); return; }
    setTogglingKey(key);
    try {
      await api.patch(`/feature-flags/${encodeURIComponent(key)}/toggle`, undefined, {
        params: { app: selectedApp },
      });
      await loadFlags();
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err?.response?.data?.message || err?.message || 'Failed to toggle flag');
    } finally {
      setTogglingKey(null);
    }
  };

  const create = async (): Promise<void> => {
    if (!newFlag.key.trim()) { toast.error('Key is required'); return; }
    if (!selectedApp) { toast.error('Select an app first'); return; }
    setCreating(true);
    try {
      await api.post('/feature-flags', {
        key: newFlag.key.trim(),
        description: newFlag.description?.trim() || undefined,
        app: selectedApp,
        enabled: false,
      });
      toast.success('Flag created');
      setNewFlag({ key: '', description: '' });
      await loadFlags();
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create flag');
    } finally {
      setCreating(false);
    }
  };

  const enabledCount = flags.filter(f => f.enabled).length;
  const selectedAppName = apps.find(a => a.key === selectedApp)?.name;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');

        .ff-root {
          font-family: 'DM Sans', sans-serif;
          padding: 2.5rem;
          max-width: 960px;
          color: #0f0f0f;
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

        .ff-stats {
          display: flex;
          gap: 1.5rem;
          align-items: center;
        }

        .ff-stat {
          text-align: right;
        }

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

        /* App Selector Bar */
        .ff-appbar {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1.75rem;
          flex-wrap: wrap;
        }

        .ff-app-chip {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.78rem;
          padding: 0.35rem 0.85rem;
          border-radius: 2px;
          border: 1.5px solid #e5e5e5;
          background: white;
          cursor: pointer;
          transition: all 0.12s ease;
          color: #555;
          letter-spacing: 0.01em;
        }

        .ff-app-chip:hover {
          border-color: #10b981;
          color: #10b981;
        }

        .ff-app-chip.active {
          background: #10b981;
          border-color: #10b981;
          color: white;
        }

        .ff-app-chip.add-chip {
          border-style: dashed;
          color: #999;
        }

        .ff-app-chip.add-chip:hover {
          border-color: #0f0f0f;
          color: #0f0f0f;
          border-style: solid;
        }

        /* New App Inline Form */
        .ff-newapp-form {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          flex-wrap: wrap;
          padding: 0.75rem 1rem;
          border: 1.5px solid #e5e5e5;
          border-radius: 2px;
          margin-bottom: 1.75rem;
          background: #fafafa;
        }

        .ff-newapp-form input {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.8rem;
          padding: 0.4rem 0.7rem;
          border: 1.5px solid #e5e5e5;
          border-radius: 2px;
          background: white;
          outline: none;
          transition: border-color 0.12s;
        }

        .ff-newapp-form input:focus {
          border-color: #0f0f0f;
        }

        .ff-newapp-form input::placeholder {
          color: #bbb;
        }

        /* Create Flag Form */
        .ff-createflag {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          align-items: stretch;
        }

        .ff-input {
          flex: 1;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.82rem;
          padding: 0.55rem 0.9rem;
          border: 1.5px solid #e5e5e5;
          border-radius: 2px;
          outline: none;
          background: white;
          color: #0f0f0f;
          transition: border-color 0.12s;
        }

        .ff-input:focus {
          border-color: #0f0f0f;
        }

        .ff-input::placeholder {
          color: #bbb;
          font-style: normal;
        }

        /* Buttons */
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

        .ff-btn-primary:hover:not(:disabled) {
          background: #059669;
        }

        .ff-btn-primary:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .ff-btn-ghost {
          background: transparent;
          color: #555;
          border: 1.5px solid #e5e5e5;
        }

        .ff-btn-ghost:hover {
          border-color: #0f0f0f;
          color: #0f0f0f;
        }

        /* Table */
        .ff-table-wrap {
          border: 1.5px solid #e5e5e5;
          border-radius: 2px;
          overflow: hidden;
        }

        .ff-table {
          width: 100%;
          border-collapse: collapse;
        }

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

        .ff-row {
          border-bottom: 1px solid #f0f0f0;
          transition: background 0.1s;
        }

        .ff-row:last-child {
          border-bottom: none;
        }

        .ff-row:hover {
          background: #fafafa;
        }

        .ff-row.disabled-row {
          opacity: 0.6;
        }

        .ff-td {
          padding: 0.85rem 1rem;
          font-size: 0.85rem;
        }

        .ff-key {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.8rem;
          color: #0f0f0f;
        }

        .ff-desc {
          color: #777;
          font-size: 0.82rem;
        }

        /* Toggle Switch */
        .ff-toggle-wrap {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .ff-toggle {
          position: relative;
          width: 36px;
          height: 20px;
          cursor: pointer;
        }

        .ff-toggle input {
          opacity: 0;
          width: 0;
          height: 0;
          position: absolute;
        }

        .ff-toggle-track {
          position: absolute;
          inset: 0;
          border-radius: 20px;
          background: #e0e0e0;
          transition: background 0.15s ease;
        }

        .ff-toggle input:checked + .ff-toggle-track {
          background: #10b981;
        }

        .ff-toggle-thumb {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: white;
          transition: transform 0.15s ease;
        }

        .ff-toggle input:checked ~ .ff-toggle-thumb {
          transform: translateX(16px);
        }

        .ff-toggle-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.02em;
        }

        .ff-toggle-label.on { color: #0f0f0f; }
        .ff-toggle-label.off { color: #bbb; }

        .ff-toggling {
          opacity: 0.4;
          pointer-events: none;
        }

        /* Empty / Loading */
        .ff-empty {
          padding: 3rem 1rem;
          text-align: center;
        }

        .ff-empty-icon {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
          opacity: 0.3;
        }

        .ff-empty-text {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.78rem;
          color: #bbb;
        }

        .ff-loading-row td {
          padding: 2rem 1rem;
        }

        .ff-skeleton {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .ff-skeleton-line {
          height: 14px;
          background: #f0f0f0;
          border-radius: 2px;
          animation: ff-pulse 1.4s ease-in-out infinite;
        }

        @keyframes ff-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        /* Section label */
        .ff-section-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #aaa;
          margin-bottom: 0.5rem;
          display: block;
        }
      `}</style>

      <div className="ff-root">

        {/* Header */}
        <div className="ff-header">
          <div>
            <h1 className="ff-title">Feature Flags</h1>
            <p className="ff-subtitle">
              {selectedAppName ? `/${selectedApp}` : 'no app selected'}
            </p>
          </div>
          <div className="ff-stats">
            <div className="ff-stat">
              <span className="ff-stat-value">{flags.length}</span>
              <span className="ff-stat-label">Total</span>
            </div>
            <div className="ff-stat-divider" />
            <div className="ff-stat">
              <span className="ff-stat-value">{enabledCount}</span>
              <span className="ff-stat-label">Enabled</span>
            </div>
          </div>
        </div>

        {/* App Selector */}
        <span className="ff-section-label">Application</span>
        <div className="ff-appbar">
          {apps.map((a) => (
            <button
              key={a._id}
              className={`ff-app-chip ${selectedApp === a.key ? 'active' : ''}`}
              onClick={() => setSelectedApp(a.key)}
            >
              {a.name}
            </button>
          ))}
          <button
            className={`ff-app-chip add-chip`}
            onClick={() => setShowNewApp(!showNewApp)}
          >
            {showNewApp ? '✕ cancel' : '+ new app'}
          </button>
        </div>

        {/* Inline new app form */}
        {showNewApp && (
          <div className="ff-newapp-form">
            <input
              placeholder="key  e.g. smartkiosk"
              value={newApp.key}
              onChange={(e) => setNewApp({ ...newApp, key: e.target.value })}
              style={{ width: 180 }}
            />
            <input
              placeholder="name  e.g. Smart Kiosk"
              value={newApp.name}
              onChange={(e) => setNewApp({ ...newApp, name: e.target.value })}
              style={{ width: 200 }}
            />
            <button
              className="ff-btn ff-btn-primary"
              onClick={createApp}
              disabled={creatingApp}
            >
              {creatingApp ? 'Creating…' : 'Create app'}
            </button>
          </div>
        )}

        {/* Create Flag */}
        <span className="ff-section-label">New Flag</span>
        <div className="ff-createflag">
          <input
            className="ff-input"
            placeholder="flag_key_here"
            value={newFlag.key}
            onChange={(e) => setNewFlag({ ...newFlag, key: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && create()}
          />
          <input
            className="ff-input"
            placeholder="Description (optional)"
            value={newFlag.description}
            onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && create()}
          />
          <button
            className="ff-btn ff-btn-primary"
            onClick={create}
            disabled={creating}
          >
            {creating ? 'Adding…' : '+ Add flag'}
          </button>
        </div>

        {/* Flags Table */}
        <div className="ff-table-wrap">
          <table className="ff-table">
            <thead className="ff-thead">
              <tr>
                <th>Key</th>
                <th>Description</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="ff-loading-row">
                  <td colSpan={3}>
                    <div className="ff-skeleton">
                      {[80, 60, 75].map((w, i) => (
                        <div
                          key={i}
                          className="ff-skeleton-line"
                          style={{ width: `${w}%`, animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </td>
                </tr>
              ) : flags.length === 0 ? (
                <tr>
                  <td colSpan={3}>
                    <div className="ff-empty">
                      <div className="ff-empty-icon">⚑</div>
                      <div className="ff-empty-text">
                        {selectedApp ? 'No flags yet — create one above' : 'Select an app to view flags'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                flags.map((f) => (
                  <tr
                    key={f._id}
                    className={`ff-row ${togglingKey === f.key ? 'ff-toggling' : ''}`}
                  >
                    <td className="ff-td ff-key">{f.key}</td>
                    <td className="ff-td ff-desc">{f.description || '—'}</td>
                    <td className="ff-td">
                      <div className="ff-toggle-wrap">
                        <label className="ff-toggle" onClick={() => toggle(f.key)}>
                          <input type="checkbox" checked={f.enabled} readOnly />
                          <div className="ff-toggle-track" />
                          <div className="ff-toggle-thumb" />
                        </label>
                        <span className={`ff-toggle-label ${f.enabled ? 'on' : 'off'}`}>
                          {f.enabled ? 'on' : 'off'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </>
  );
}
