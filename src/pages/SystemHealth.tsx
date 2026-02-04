import { useState, useEffect } from 'react';
import { Activity, Server, Database, HardDrive, RefreshCw, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';
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
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchHealth = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/health');
      const data = response.data.data || response.data;
      
      setHealth(data);
      setLastUpdated(new Date());
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'down': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'degraded': return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      case 'down': return <XCircle className="h-6 w-6 text-red-500" />;
      default: return <Activity className="h-6 w-6 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
          <p className="text-gray-500 mt-1">Real-time system performance and status monitoring</p>
        </div>
        <button 
          onClick={fetchHealth}
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Overall Status</h3>
            {health && getStatusIcon(health.status)}
          </div>
          <div className="text-3xl font-bold capitalize mb-2">
            <span className={health ? getStatusColor(health.status) : ''}>
              {health?.status || 'Unknown'}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>

        {/* Uptime */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">System Uptime</h3>
            <Clock className="h-6 w-6 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {health ? formatUptime(health.uptime) : '-'}
          </div>
          <p className="text-sm text-gray-500">
            Since last restart
          </p>
        </div>

        {/* Active Services */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Active Services</h3>
            <Server className="h-6 w-6 text-purple-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {health ? Object.values(health.services).filter(Boolean).length : '-'} / 3
          </div>
          <p className="text-sm text-gray-500">
            Operational components
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Component Status</h3>
          </div>
          <div className="divide-y divide-gray-200">
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-blue-50 rounded-lg mr-4">
                  <Server className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">API Server</p>
                  <p className="text-sm text-gray-500">Node.js / Express</p>
                </div>
              </div>
              <StatusBadge status={health?.services.api ? 'healthy' : 'down'} />
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-green-50 rounded-lg mr-4">
                  <Database className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Database</p>
                  <p className="text-sm text-gray-500">MongoDB / SQLite</p>
                </div>
              </div>
              <StatusBadge status={health?.services.database ? 'healthy' : 'down'} />
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-orange-50 rounded-lg mr-4">
                  <HardDrive className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">File Storage</p>
                  <p className="text-sm text-gray-500">Local Filesystem</p>
                </div>
              </div>
              <StatusBadge status={health?.services.storage ? 'healthy' : 'down'} />
            </div>
          </div>
        </div>

        {/* System Metrics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">System Metrics</h3>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">CPU Usage</span>
                <span className="text-sm font-medium text-gray-900">{Number(health?.metrics.cpu).toFixed(2) || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${health?.metrics.cpu || 0}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Memory Usage</span>
                <span className="text-sm font-medium text-gray-900">{health?.metrics.memory || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${health?.metrics.memory || 0}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Request Load</span>
                <span className="text-sm font-medium text-gray-900">{health?.metrics.requests || 0} req/min</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${(health?.metrics.requests || 0) / 20}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = status === 'healthy' 
    ? 'bg-green-100 text-green-800' 
    : status === 'degraded'
    ? 'bg-yellow-100 text-yellow-800'
    : 'bg-red-100 text-red-800';
    
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${styles}`}>
      {status}
    </span>
  );
}


