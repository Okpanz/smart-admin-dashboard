import React, { useEffect, useState } from 'react';
import api from '../lib/api';

export default function Notifications() {
  type FlagApp = { _id: string; key: string; name: string };

  const [apps, setApps] = useState<FlagApp[]>([]);
  const [selectedApp, setSelectedApp] = useState<string>('smartverifyMobile');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [importance, setImportance] = useState<'low' | 'normal' | 'high'>('normal');
  const [serviceId, setServiceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadApps = async (): Promise<void> => {
    try {
      const res = await api.get('/feature-flag-apps');
      const data = res.data?.data as FlagApp[] | undefined;
      const list = Array.isArray(data) ? data : [];
      setApps(list);
      if (!selectedApp) setSelectedApp(list[0]?.key || '');
    } catch {
      setApps([]);
    }
  };

  useEffect(() => { loadApps(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      await api.post('/notifications/broadcast', {
        title,
        message,
        importance,
        app: selectedApp || undefined,
        service_id: serviceId || undefined,
      });
      setResult('Notification sent');
      setTitle('');
      setMessage('');
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setError(err?.response?.data?.message || err?.message || 'Failed to send');
    } finally {
      setLoading(false);
    }
  };

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

        .ff-section-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #aaa;
          margin-bottom: 0.5rem;
          display: block;
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
        }

        .nt-grid {
          display: grid;
          gap: 0.75rem;
        }

        .nt-feedback {
          margin-top: 0.5rem;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.78rem;
        }

        .nt-success { color: #10b981; }
        .nt-error { color: #ef4444; }
      `}</style>

      <div className="ff-root">
        <div className="ff-header">
          <div>
            <h1 className="ff-title">Notifications</h1>
            <p className="ff-subtitle">
              {selectedAppName ? `/${selectedApp}` : 'no app selected'}
            </p>
          </div>
        </div>

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
        </div>

        <span className="ff-section-label">Send Notification</span>
        <form onSubmit={submit} className="nt-grid">
          <input
            className="ff-input"
            placeholder="Service ID (optional)"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
          />
          <input
            className="ff-input"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            className="ff-input"
            placeholder="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={4}
          />
          <select
            className="ff-input"
            value={importance}
            onChange={(e) => setImportance(e.target.value as 'low' | 'normal' | 'high')}
          >
            <option value="low">low (silent)</option>
            <option value="normal">normal</option>
            <option value="high">high (pop-up)</option>
          </select>
          <div>
            <button type="submit" disabled={loading} className="ff-btn ff-btn-primary">
              {loading ? 'Sending…' : 'Send Notification'}
            </button>
          </div>
          {result ? <div className="nt-feedback nt-success">{result}</div> : null}
          {error ? <div className="nt-feedback nt-error">{error}</div> : null}
        </form>
      </div>
    </>
  );
}
