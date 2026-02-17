/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from "react";
import { MoreHorizontal, RefreshCw, User, Calendar, Building2, Hash } from "lucide-react";
import clsx from "clsx";
import api from "../../lib/api";
import { useNavigate } from "react-router-dom";

type EnrollmentStatus = "verified" | "rejected" | "pending" | string;

interface Enrollment {
  _id: string;
  fullname: string;
  department: string;
  employeeId: string;
  status: EnrollmentStatus;
  createdAt: string;
}

interface StatusConfig {
  class: string;
  label: string;
  icon?: React.ReactNode;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  verified: {
    class: "bg-green-50 text-green-700 border border-green-200",
    label: "Verified",
    icon: <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />
  },
  rejected: {
    class: "bg-red-50 text-red-700 border border-red-200",
    label: "Rejected",
    icon: <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5" />
  },
  pending: {
    class: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    label: "Pending",
    icon: <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mr-1.5" />
  }
};

function getStatusConfig(status: EnrollmentStatus): StatusConfig {
  const s = String(status).toLowerCase();
  return STATUS_CONFIG[s] || {
    class: "bg-gray-50 text-gray-700 border border-gray-200",
    label: s,
    icon: <span className="w-1.5 h-1.5 rounded-full bg-gray-500 mr-1.5" />
  };
}

function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return "-";
    
    // Format: "MMM DD, YYYY"
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return "-";
  }
}

function formatRelativeTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(dateString);
  } catch {
    return formatDate(dateString);
  }
}

interface TableHeaderProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

function TableHeader({ children, icon, className }: TableHeaderProps) {
  return (
    <th className={clsx(
      "text-left text-xs font-medium text-gray-400 pb-3 px-2 first:pl-2 last:pr-2",
      className
    )}>
      <div className="flex items-center gap-1.5">
        {icon && <span className="text-gray-300">{icon}</span>}
        {children}
      </div>
    </th>
  );
}

interface SkeletonRowProps {
  index: number;
}

function SkeletonRow({ index }: SkeletonRowProps) {
  return (
    <div
      key={index}
      className="flex items-center justify-between py-3 border-b border-gray-50 last:border-b-0 animate-pulse"
    >
      <div className="flex-1 space-y-2">
        <div className="h-3 w-32 rounded-full bg-gray-200" />
        <div className="h-2 w-24 rounded-full bg-gray-100" />
      </div>
      <div className="h-5 w-16 rounded-full bg-gray-200" />
    </div>
  );
}

export function RecentEnrollments() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  const fetchEnrollments = useCallback(async (signal?: AbortSignal, isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    
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
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchEnrollments(controller.signal);
    return () => controller.abort();
  }, [fetchEnrollments]);

  const handleRefresh = useCallback(() => {
    fetchEnrollments(undefined, true);
  }, [fetchEnrollments]);

  const rows = useMemo(() => {
    return enrollments.map((enr) => {
      const statusConfig = getStatusConfig(enr.status);
      return {
        ...enr,
        dateLabel: formatDate(enr.createdAt),
        relativeTime: formatRelativeTime(enr.createdAt),
        statusConfig,
        statusLabel: statusConfig.label,
      };
    });
  }, [enrollments]);

  // Loading state
  if (loading) {
    return (
      <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-bold text-gray-900">Recent Enrollments</h3>
          <div className="h-6 w-20 rounded-full bg-gray-100 animate-pulse" />
        </div>
        <div className="space-y-2 sm:space-y-3">
          {[1, 2, 3, 4].map((key) => (
            <SkeletonRow key={key} index={key} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-bold text-gray-900">Recent Enrollments</h3>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {error && (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={clsx(
                "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full",
                "bg-red-50 text-red-700 hover:bg-red-100 transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <RefreshCw className={clsx("h-3 w-3", isRefreshing && "animate-spin")} />
              Retry
            </button>
          )}

          <button
            type="button"
            className={clsx(
              "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full",
              "bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors",
              "ml-auto sm:ml-0"
            )}
            onClick={() => navigate("/audit")}
          >
            View all
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Error message (when not using retry button) */}
      {error && !isRefreshing && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <p className="text-xs sm:text-sm text-red-700 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            {error}
          </p>
        </div>
      )}

      {/* Table container with horizontal scroll on mobile */}
      <div className="-mx-4 sm:-mx-6 overflow-x-auto">
        <div className="inline-block min-w-full align-middle px-4 sm:px-6">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <TableHeader icon={<User className="h-3 w-3" />}>Employee</TableHeader>
                <TableHeader icon={<Calendar className="h-3 w-3" />}>Date</TableHeader>
                <TableHeader icon={<Building2 className="h-3 w-3" />} className="hidden sm:table-cell">
                  Department
                </TableHeader>
                <TableHeader icon={<Hash className="h-3 w-3" />} className="hidden md:table-cell">
                  ID
                </TableHeader>
                <TableHeader>Status</TableHeader>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <User className="h-8 w-8 mb-2 text-gray-300" />
                      <p className="text-sm">No recent enrollments</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((enr, index) => (
                  <tr 
                    key={enr._id} 
                    className={clsx(
                      "group transition-colors hover:bg-gray-50/50",
                      index === rows.length - 1 && "border-b-0"
                    )}
                  >
                    {/* Employee column */}
                    <td className="py-3 sm:py-4 pl-2">
                      <div className="flex flex-col">
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 max-w-[120px] sm:max-w-[180px] truncate" title={enr.fullname}>
                          {enr.fullname}
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-400 sm:hidden">
                          {enr.department}
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-400 md:hidden">
                          {enr.employeeId}
                        </p>
                      </div>
                    </td>

                    {/* Date column */}
                    <td className="py-3 sm:py-4">
                      <div className="flex flex-col">
                        <p className="text-[10px] sm:text-xs font-medium text-gray-700 whitespace-nowrap">
                          {enr.relativeTime}
                        </p>
                        <p className="text-[8px] sm:text-[10px] text-gray-400 sm:hidden">
                          {enr.dateLabel}
                        </p>
                      </div>
                    </td>

                    {/* Department column - hidden on mobile */}
                    <td className="py-3 sm:py-4 hidden sm:table-cell">
                      <p className="text-xs sm:text-sm text-gray-900 max-w-[120px] truncate" title={enr.department}>
                        {enr.department}
                      </p>
                    </td>

                    {/* Employee ID column - hidden on tablet/mobile */}
                    <td className="py-3 sm:py-4 hidden md:table-cell">
                      <p className="text-xs text-gray-500 font-mono">{enr.employeeId}</p>
                    </td>

                    {/* Status column */}
                    <td className="py-3 sm:py-4 pr-2">
                      <span
                        className={clsx(
                          "inline-flex items-center rounded-full px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-medium",
                          enr.statusConfig.class
                        )}
                      >
                        {enr.statusConfig.icon}
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

      {/* Mobile footer with counts */}
      {rows.length > 0 && (
        <div className="mt-4 pt-2 border-t border-gray-50 text-[10px] text-gray-400 flex justify-between items-center sm:hidden">
          <span>{rows.length} enrollments</span>
          <span>Updated just now</span>
        </div>
      )}
    </div>
  );
}
