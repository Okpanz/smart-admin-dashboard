/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import clsx from "clsx";
import api from "../../lib/api";

type EnrollmentStatus = "verified" | "rejected" | "pending" | string;

interface Enrollment {
  _id: string;
  fullname: string;
  department: string;
  employeeId: string;
  status: EnrollmentStatus;
  createdAt: string;
}

function getStatusBadgeClass(status: EnrollmentStatus) {
  const s = String(status).toLowerCase();

  if (s === "verified") return "bg-green-50 text-green-600";
  if (s === "rejected") return "bg-red-50 text-red-600";
  return "bg-yellow-50 text-yellow-600";
}

function formatDate(dateString: string) {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
}

export function RecentEnrollments() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEnrollments = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get("/mobile/v1/enrollments/recent", { signal });

      // handle both shapes: { data: { data: [] } } OR { data: [] }
      const payload = response?.data;
      const list = Array.isArray(payload?.data) ? payload.data : payload?.data?.data;

      if (Array.isArray(list)) {
        setEnrollments(list);
      } else {
        setEnrollments([]);
      }
    } catch (err: any) {
      // Abort shouldn't show as an error
      if (err?.name === "CanceledError" || err?.name === "AbortError") return;

      console.error("Failed to fetch recent enrollments:", err);
      setError("Unable to load recent enrollments. Please try again.");
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchEnrollments(controller.signal);
    return () => controller.abort();
  }, [fetchEnrollments]);

  const rows = useMemo(() => {
    return enrollments.map((enr) => ({
      ...enr,
      dateLabel: formatDate(enr.createdAt),
      badgeClass: getStatusBadgeClass(enr.status),
      statusLabel: String(enr.status || "").toLowerCase(),
    }));
  }, [enrollments]);

  if (loading) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-sm h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900">Recent Enrollments</h3>

        <div className="flex space-x-2 items-center">
          <select className="bg-gray-50 border-none text-xs font-medium text-gray-500 rounded-lg px-2 py-1 focus:ring-0 cursor-pointer hover:bg-gray-100">
            <option>Latest</option>
          </select>

          <button
            type="button"
            className="p-1 rounded-lg hover:bg-gray-100"
            aria-label="More options"
          >
            <MoreHorizontal className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => fetchEnrollments()}
            className="text-sm font-semibold text-red-700 hover:underline"
          >
            Retry
          </button>
        </div>
      ) : null}

      <div className="overflow-x-auto mt-4">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-400 pb-3 pl-2">
                Employee Name
              </th>
              <th className="text-left text-xs font-medium text-gray-400 pb-3">
                Date
              </th>
              <th className="text-left text-xs font-medium text-gray-400 pb-3">
                Department
              </th>
                {/* <th className="text-left text-xs font-medium text-gray-400 pb-3">
                  ID
                </th> */}
              <th className="text-left text-xs font-medium text-gray-400 pb-3 pr-2">
                Status
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-gray-500 text-sm">
                  No recent enrollments
                </td>
              </tr>
            ) : (
              rows.map((enr) => (
                <tr key={enr._id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 pl-2">
                    <p className="text-sm font-semibold text-gray-900 max-w-[120px] sm:max-w-[200px] whitespace-normal break-words">
                      {enr.fullname}
                    </p>
                  </td>

                  <td className="py-4">
                    <p className="text-xs font-medium text-gray-700">{enr.dateLabel}</p>
                  </td>

                  <td className="py-4 text-sm font-semibold text-gray-900">
                    {enr.department}
                  </td>

                  {/* <td className="py-4 text-xs text-gray-500">{enr.employeeId}</td> */}

                  <td className="py-4 pr-2">
                    <span
                      className={clsx(
                        "inline-flex rounded-full px-2 py-1 text-[10px] font-semibold capitalize",
                        enr.badgeClass
                      )}
                    >
                      {enr.statusLabel}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
