// src/components/FeesReport.tsx
'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

interface FeesReportProps {
  classes: { id: number; name: string; }[];
  feeTypes: { id: number; name: string; }[];
}

const FeesReport = ({ classes, feeTypes }: FeesReportProps) => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    classId: '',
    feeTypeId: '',
  });

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params = new URLSearchParams();
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      if (filters.classId) params.set('classId', filters.classId);
      if (filters.feeTypeId) params.set('feeTypeId', filters.feeTypeId);

      const response = await fetch(`/api/fees/reports?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const data = await response.json();
      setReport(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Fee Collection Report</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              name="classId"
              value={filters.classId}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md text-sm"
            >
              <option value="">All Classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fee Type</label>
            <select
              name="feeTypeId"
              value={filters.feeTypeId}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md text-sm"
            >
              <option value="">All Fee Types</option>
              {feeTypes.map(ft => (
                <option key={ft.id} value={ft.id}>{ft.name}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={generateReport}
          disabled={loading}
          className="bg-lamaPurple text-white px-4 py-2 rounded-md text-sm hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {report && (
        <div className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">              <h3 className="text-sm font-medium text-blue-800">Total Amount</h3>
              <p className="text-2xl font-semibold text-blue-900">GH₵{report.totalAmount.toFixed(2)}</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-800">Collected Amount</h3>
              <p className="text-2xl font-semibold text-green-900">GH₵{report.collectedAmount.toFixed(2)}</p>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-red-800">Pending Amount</h3>
              <p className="text-2xl font-semibold text-red-900">GH₵{report.pendingAmount.toFixed(2)}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="border-b border-gray-200 bg-gray-50 px-5 py-3 text-left">Date</th>
                  <th className="border-b border-gray-200 bg-gray-50 px-5 py-3 text-left">Student</th>
                  <th className="border-b border-gray-200 bg-gray-50 px-5 py-3 text-left">Class</th>
                  <th className="border-b border-gray-200 bg-gray-50 px-5 py-3 text-left">Fee Type</th>
                  <th className="border-b border-gray-200 bg-gray-50 px-5 py-3 text-left">Amount</th>
                </tr>
              </thead>
              <tbody>
                {report.payments.map((payment: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border-b border-gray-200 px-5 py-3">
                      {format(new Date(payment.date), 'MMM d, yyyy')}
                    </td>
                    <td className="border-b border-gray-200 px-5 py-3">
                      {payment.student.name} {payment.student.surname}
                    </td>
                    <td className="border-b border-gray-200 px-5 py-3">
                      {payment.class.name}
                    </td>
                    <td className="border-b border-gray-200 px-5 py-3">
                      {payment.feeType.name}
                    </td>
                    <td className="border-b border-gray-200 px-5 py-3">
                      ${payment.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeesReport;
