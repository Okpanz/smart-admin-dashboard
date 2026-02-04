import { UserPlus, FileUp, ClipboardList, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

export function QuickActions() {
  const navigate = useNavigate();

  const handleExport = async () => {
    try {
      const response = await api.get('/mobile/v1/enrollments');
      const data = response.data.data || response.data;
      
      if (!Array.isArray(data)) {
        console.error('No data to export');
        return;
      }

      // Convert to CSV
      const headers = ['Employee ID', 'Name', 'Department', 'Service ID', 'Status', 'Date'];
      const csvContent = [
        headers.join(','),
        ...data.map((row: { employeeId: string; fullname: string; department: string; serviceId: string; status: string; createdAt: string }) => [
           row.employeeId,
           `"${row.fullname}"`,
           `"${row.department}"`,
           row.serviceId,
           row.status,
           new Date(row.createdAt).toLocaleDateString()
         ].join(','))
      ].join('\n');

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `enrollments_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleSync = () => {
    window.location.reload();
  };

  const actions = [
    { name: 'Add Staff', icon: UserPlus, onClick: () => navigate('/staff/create') },
    { name: 'Export Data', icon: FileUp, onClick: handleExport },
    { name: 'View Logs', icon: ClipboardList, onClick: () => navigate('/audit') },
    { name: 'Sync Data', icon: RefreshCw, onClick: handleSync },
  ];

  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm">
      <div className="flex justify-between">
        {actions.map((action) => (
          <button 
            key={action.name} 
            onClick={action.onClick}
            className="flex flex-col items-center group w-full"
          >
            <div className="h-12 w-12 rounded-full border border-gray-100 flex items-center justify-center mb-2 group-hover:bg-primary-50 group-hover:border-primary-100 transition-colors cursor-pointer">
              <action.icon className="h-5 w-5 text-gray-600 group-hover:text-primary-600" />
            </div>
            <span className="text-xs font-medium text-gray-600 group-hover:text-primary-700">{action.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

