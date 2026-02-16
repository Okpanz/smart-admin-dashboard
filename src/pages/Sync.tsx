import { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import { Skeleton } from '../components/common/Skeleton';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';

interface EmployeeDoc {
  type: string;
  uri: string | null;
  uploadedAt?: string;
  verificationStatus?: string;
  status?: number;
}

interface EmployeePayload {
  serviceId: number;
  employeeNo: string;
  biometrics?: { rf1?: string | null; lf1?: string | null };
  photo?: { url?: string | null };
  documents?: EmployeeDoc[];
}

export function Sync() {
  const { user } = useAuth();
  const [baseUrl, setBaseUrl] = useState<string>(import.meta.env.VITE_SERVICE_BASE_URL || '');
  const [limit, setLimit] = useState<number>(100);
  const [dryRun, setDryRun] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [payload, setPayload] = useState<{ employees: EmployeePayload[]; dry_run: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [services, setServices] = useState<Array<{ serviceId: number; name: string; baseUrl: string | null }>>([]);
  const [pendingByService, setPendingByService] = useState<Record<number, number>>({});
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);

  const canFetch = useMemo(() => !!baseUrl, [baseUrl]);

  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('services', { params: { limit: 1000 } });
      const payload = res.data.data || res.data;
      const list = (payload?.data || payload) as Array<{ name: string; service_id: number; service_base_url?: string }>;
      const normalized = list.map(s => ({
        serviceId: s.service_id,
        name: s.name,
        baseUrl: s.service_base_url || null
      }));
      setServices(normalized);
    } catch (err: unknown) {
      let msg = 'Failed to fetch services';
      if (typeof err === 'object' && err) {
        const e = err as { response?: { data?: { message?: string } } };
        msg = e?.response?.data?.message || (err as Error)?.message || msg;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('mobile/v1/enrollments/sync/stats');
      const data = res.data.data as Array<{ serviceId: number; pending: number }>;
      const map: Record<number, number> = {};
      data.forEach(d => { map[d.serviceId] = d.pending; });
      setPendingByService(map);
    } catch (err: unknown) {
      let msg = 'Failed to fetch stats';
      if (typeof err === 'object' && err) {
        const e = err as { response?: { data?: { message?: string } } };
        msg = e?.response?.data?.message || (err as Error)?.message || msg;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedServiceId && (pendingByService[selectedServiceId] ?? 0) === 0) {
      setSelectedServiceId(null);
    }
  }, [pendingByService, selectedServiceId]);

  const fetchPayload = async () => {
    if (!canFetch) return;
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const params: Record<string, string | number> = { base_url: baseUrl, dry_run: dryRun ? '1' : '0', limit };
      if (selectedServiceId) params.service_id = selectedServiceId;
      const res = await api.get('mobile/v1/enrollments/sync/payload', { params });
      setPayload(res.data.data);
      setCurrentStep(2);
    } catch (err: unknown) {
      let msg = 'Failed to fetch payload';
      if (typeof err === 'object' && err) {
        const e = err as { response?: { data?: { message?: string } } };
        msg = e?.response?.data?.message || (err as Error)?.message || msg;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const syncNow = async () => {
    if (!payload || !Array.isArray(payload.employees) || payload.employees.length === 0) return;
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await api.post('mobile/v1/enrollments/sync/execute', {
        base_url: baseUrl,
        dry_run: dryRun ? '1' : '0',
        limit,
        service_id: selectedServiceId || undefined
      });
      setSuccessMessage(`Successfully synced ${payload.employees.length} employee records!`);
      await fetchStats();
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Sync failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPayload(null);
    setSuccessMessage(null);
    setError(null);
  }, [baseUrl, limit]);

  useEffect(() => {
    (async () => {
      await fetchServices();
      await fetchStats();
      const defaultService =
        user?.role === 'service_admin'
          ? Number(user.service_id)
          : (services[0]?.serviceId ?? null);
      setSelectedServiceId(defaultService);
      const svc = services.find(s => s.serviceId === defaultService);
      if (svc?.baseUrl) setBaseUrl(svc.baseUrl);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingCount = selectedServiceId ? (pendingByService[selectedServiceId] ?? 0) : 0;
  const selectedService = services.find(s => s.serviceId === selectedServiceId);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Sync Employee Records
          </h1>
          <p className="text-lg text-gray-600">
            Send pending employee data to your external service
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-10">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[
              { num: 1, label: 'Select Service' },
              { num: 2, label: 'Preview Records' },
              { num: 3, label: 'Complete Sync' }
            ].map((step, idx) => (
              <div key={step.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={clsx(
                      'w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-2 transition-all',
                      currentStep >= step.num
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    )}
                  >
                    {currentStep > step.num ? '✓' : step.num}
                  </div>
                  <span
                    className={clsx(
                      'text-xs md:text-sm font-medium text-center',
                      currentStep >= step.num ? 'text-primary-600' : 'text-gray-500'
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < 2 && (
                  <div
                    className={clsx(
                      'h-1 flex-1 mx-2 transition-all',
                      currentStep > step.num ? 'bg-primary-600' : 'bg-gray-200'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 rounded-2xl border-2 border-red-200 bg-red-50 p-5 flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <div className="font-semibold text-red-900 mb-1">Something went wrong</div>
              <div className="text-red-700">{error}</div>
            </div>
          </div>
        )}
        {successMessage && (
          <div className="mb-6 rounded-2xl border-2 border-green-200 bg-green-50 p-5 flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <div className="font-semibold text-green-900 mb-1">Success!</div>
              <div className="text-green-700">{successMessage}</div>
            </div>
          </div>
        )}

        {/* Step 1: Select Service */}
        {currentStep === 1 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                1
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Choose Your Service</h2>
                <p className="text-gray-600">Select which service you want to sync with</p>
              </div>
            </div>

            {!services.length && loading && <Skeleton className="h-40" />}
            
            {services.length > 0 && (
              <div className="space-y-3 mb-6">
                {(
                  (user?.role === 'service_admin'
                    ? services.filter(s => s.serviceId === Number(user.service_id))
                    : services
                  ).filter(s => (pendingByService[s.serviceId] ?? 0) > 0)
                ).length === 0 ? (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-gray-700">
                    No services have pending records to sync.
                  </div>
                ) : (
                ((user?.role === 'service_admin'
                  ? services.filter(s => s.serviceId === Number(user.service_id))
                  : services
                ).filter(s => (pendingByService[s.serviceId] ?? 0) > 0)).map((s) => {
                  const pending = pendingByService[s.serviceId] ?? 0;
                  const isSelected = selectedServiceId === s.serviceId;
                  
                  return (
                    <button
                      key={s.serviceId}
                      onClick={() => {
                        setSelectedServiceId(s.serviceId);
                        if (s.baseUrl) setBaseUrl(s.baseUrl);
                      }}
                      className={clsx(
                        'w-full rounded-xl border p-5 text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary-300',
                        isSelected
                          ? 'border-primary-600 bg-white ring-2 ring-primary-200'
                          : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-primary-300'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={clsx(
                              'w-6 h-6 rounded-full border-2 flex items-center justify-center',
                              isSelected ? 'border-primary-600 bg-primary-600' : 'border-gray-300 bg-white'
                            )}>
                              {isSelected && <span className="text-white text-sm">✓</span>}
                            </div>
                            <span className="text-xl font-bold text-gray-900">{s.name}</span>
                          </div>
                          <div className="ml-9">
                            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm font-semibold border border-primary-200">
                              <span className="text-lg">⏳</span>
                              <span>{pending} pending to sync</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                }))}
              </div>
            )}

            {/* Advanced Settings (collapsed by default) */}
            <div className="border-t border-gray-200 pt-6">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium mb-4"
              >
                <span className={clsx('transition-transform', showAdvanced && 'rotate-90')}>▶</span>
                Advanced Settings
              </button>
              
              {showAdvanced && (
                <div className="space-y-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Server Address
                    </label>
                    <input
                      className="w-full rounded-lg border border-gray-300 p-3 text-base focus:border-primary-500 focus:outline-none"
                      placeholder="https://example.com"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Usually filled automatically. Only change if instructed.
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Number of Records to Sync
                    </label>
                    <input
                      type="number"
                      min={1}
                      className="w-full rounded-lg border border-gray-300 p-3 text-base focus:border-primary-500 focus:outline-none"
                      value={limit}
                      onChange={(e) => setLimit(parseInt(e.target.value || '0', 10))}
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Maximum number of employee records to send at once.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={() => {
                  if (selectedServiceId && baseUrl) {
                    setCurrentStep(2);
                  }
                }}
                disabled={!selectedServiceId || !baseUrl}
                className={clsx(
                  'px-8 py-4 rounded-xl text-lg font-bold transition-all flex items-center gap-2',
                  selectedServiceId && baseUrl
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                )}
              >
                Continue
                <span className="text-xl">→</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {currentStep === 2 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                2
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Preview What Will Be Sent</h2>
                <p className="text-gray-600">Review the records before syncing</p>
              </div>
            </div>

            {/* Summary Card */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Service</div>
                  <div className="text-lg font-bold text-gray-900">{selectedService?.name || 'None'}</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Records Ready</div>
                  <div className="text-lg font-bold text-gray-900">{pendingCount}</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Will Send</div>
                  <div className="text-lg font-bold text-gray-900">
                    {Math.min(limit, pendingCount)}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={fetchPayload}
              disabled={!canFetch || loading}
              className={clsx(
                'w-full py-4 rounded-xl text-lg font-bold mb-6 transition-all',
                canFetch && !loading
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              )}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Loading Records...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>📄</span>
                  Load Preview
                </span>
              )}
            </button>

            {payload && (
              <div className="border-2 border-gray-200 rounded-2xl overflow-hidden mb-6">
                <div className="bg-gray-100 px-6 py-4 border-b-2 border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">
                      {payload.employees.length} Employee Records
                    </span>
                    <span className="text-sm text-gray-600">Ready to send</span>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Employee #</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Has Photo</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Has Fingerprints</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Documents</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {payload.employees.map((e, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900">{e.employeeNo}</td>
                          <td className="px-6 py-4">
                            <span className={clsx(
                              'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold',
                              e.photo?.url ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                            )}>
                              {e.photo?.url ? '✓ Yes' : '✗ No'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={clsx(
                              'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold',
                              (e.biometrics?.rf1 || e.biometrics?.lf1) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                            )}>
                              {(e.biometrics?.rf1 || e.biometrics?.lf1) ? '✓ Yes' : '✗ No'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {Array.isArray(e.documents) ? e.documents.length : 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-6 py-3 rounded-xl text-base font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all flex items-center gap-2"
              >
                <span>←</span>
                Back
              </button>
              <button
                onClick={() => payload && setCurrentStep(3)}
                disabled={!payload}
                className={clsx(
                  'px-8 py-3 rounded-xl text-base font-bold transition-all flex items-center gap-2',
                  payload
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                )}
              >
                Continue
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Sync */}
        {currentStep === 3 && payload && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                3
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Complete the Sync</h2>
                <p className="text-gray-600">Send your employee records now</p>
              </div>
            </div>

            {/* Final Summary */}
            <div className="bg-green-50 rounded-xl p-6 mb-6 border border-green-200">
              <div className="flex items-start gap-4">
                <span className="text-4xl">✓</span>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Ready to Send</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Service:</span>
                      <span className="ml-2 font-semibold text-gray-900">{selectedService?.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Records:</span>
                      <span className="ml-2 font-semibold text-gray-900">{payload.employees.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Mode Toggle */}
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-5 mb-6">
              <div className="flex items-start gap-3">
                <input
                  id="test-mode"
                  type="checkbox"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-2 border-primary-500 text-primary-600 focus:ring-2 focus:ring-primary-500"
                />
                <label htmlFor="test-mode" className="flex-1 cursor-pointer">
                  <div className="font-semibold text-gray-900 mb-1">Test Mode (Recommended)</div>
                  <div className="text-sm text-gray-700">
                    When enabled, this will simulate the sync without actually sending data. 
                    Perfect for testing! Uncheck to perform a real sync.
                  </div>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={syncNow}
                disabled={loading}
                className={clsx(
                  'w-full py-5 rounded-xl text-xl font-bold transition-all',
                  loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : dryRun
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                )}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Processing...
                  </span>
                ) : dryRun ? (
                  <span className="flex items-center justify-center gap-2">
                    <span>🧪</span>
                    Run Test Sync
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>🚀</span>
                    Send Records Now
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setCurrentStep(2)}
                className="w-full px-6 py-3 rounded-xl text-base font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
              >
                ← Go Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
