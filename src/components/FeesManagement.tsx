'use client';

import FormModal from "./FormModal";
import Pagination from "./Pagination";
import TableSearch from "./TableSearch";
import Image from "next/image";
import Link from "next/link";
import FeesChart from "./FeesChart";
import { toast } from "react-toastify";
import FeesFilter from "./FeesFilter";

type FeeData = {
  id: number;
  amount: number;
  dueDate: Date;
  classId: number;
  feeTypeId: number;
  className: string;
  feeTypeName: string;
  paidCount: number;
  totalStudents: number;
  totalPaid: number;
};

type FeesManagementProps = {
  data: FeeData[];
  count: number;
  classes: { id: number; name: string; }[];
  feeTypes: { id: number; name: string; }[];
  page: number;
  role?: string;
};

// Eye Icon Component
const EyeIcon = ({ className = "w-4 h-4", color = "currentColor" }) => (
  <svg 
    className={className} 
    fill="none" 
    stroke={color} 
    viewBox="0 0 24 24" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
    />
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" 
    />
  </svg>
);

// Trash Icon Component
const TrashIcon = ({ className = "w-4 h-4", color = "currentColor" }) => (
  <svg 
    className={className} 
    fill="none" 
    stroke={color} 
    viewBox="0 0 24 24" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
    />
  </svg>
);

const FeesManagement = ({
  data,
  count,
  classes,
  feeTypes,
  page,
  role,
}: FeesManagementProps) => {
  const columns = [
    {
      header: "Fee Type",
      accessor: "feeType",
    },
    {
      header: "Class",
      accessor: "class",
    },
    {
      header: "Amount",
      accessor: "amount",
    },
    {
      header: "Due Date",
      accessor: "dueDate",
    },
    {
      header: "Payment Status",
      accessor: "status",
    },
    {
      header: "Actions",
      accessor: "action",
    },
  ];

  const getPaymentStatusColor = (paidCount: number | bigint, totalStudents: number | bigint) => {
    const percentage = (Number(paidCount) / Number(totalStudents)) * 100;
    if (percentage === 100) return "text-green-700 bg-green-50";
    if (percentage >= 70) return "text-blue-700 bg-blue-50";
    if (percentage >= 40) return "text-yellow-700 bg-yellow-50";
    return "text-red-700 bg-red-50";
  };

  const getPaymentStatusText = (paidCount: number | bigint, totalStudents: number | bigint) => {
    const percentage = (Number(paidCount) / Number(totalStudents)) * 100;
    if (percentage >= 100) return "Complete";
    if (percentage >= 70) return "Good";
    if (percentage >= 40) return "Partial";
    return "Low";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Fees Management</h1>
              <p className="text-gray-600 text-sm leading-relaxed">
                Monitor and manage all class fees. Click <span className="font-medium text-blue-600">&quot;View Student Payments&quot;</span> to see individual payment status and collect payments.
              </p>
            </div>
            
            {role === "admin" && (
              <div className="flex flex-wrap items-center gap-3">
                <FormModal 
                  table="classFee" 
                  type="create" 
                  relatedData={{ classes, feeTypes }} 
                  buttonText="Add Class Fee" 
                />
                <FormModal 
                  table="feeType" 
                  type="create" 
                  buttonText="Add Fee Type" 
                />
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/fees/reminders', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ type: 'upcoming' }),
                      });
                      
                      if (response.ok) {
                        toast.success('Payment reminders sent successfully!');
                      } else {
                        throw new Error('Failed to send reminders');
                      }
                    } catch (error) {
                      toast.error('Error sending payment reminders');
                      console.error('Error:', error);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <Image src="/mail.png" alt="" width={18} height={18} />
                  <span>Send Reminders</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <TableSearch placeholder="Search by fee type or class..." />
            </div>
            <div className="sm:w-auto">
              <FeesFilter classes={classes} feeTypes={feeTypes} />
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Fee Collection Overview</h2>
          <FeesChart data={data} />
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.accessor}
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((fee, index) => (
                  <tr key={fee.id} className={`hover:bg-gray-50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                        <div className="text-sm font-medium text-gray-900">{fee.feeTypeName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {fee.className}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">GH₵{fee.amount.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(fee.dueDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(fee.paidCount, fee.totalStudents)}`}>
                            {getPaymentStatusText(fee.paidCount, fee.totalStudents)}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {fee.paidCount}/{fee.totalStudents}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(Number(fee.paidCount) / Number(fee.totalStudents)) * 100}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500">
                          Total: GH₵{Number(fee.totalPaid).toFixed(2)} of GH₵{(Number(fee.amount) * Number(fee.totalStudents)).toFixed(2)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {role === "admin" && (
                          <div className="flex items-center gap-1">
                            <FormModal 
                              table="classFee" 
                              type="update" 
                              data={fee} 
                              relatedData={{ classes, feeTypes }} 
                            />
                            <button
                              onClick={() => {
                                // You can either trigger your FormModal delete logic here
                                // or use the FormModal with a custom icon prop
                                console.log('Delete fee:', fee.id);
                              }}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                              title="Delete fee"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        <Link 
                          href={`/fees/${fee.id}`}
                          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
                        >
                          <EyeIcon className="w-4 h-4" color="white" />
                          <span>View Payments</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {data.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Image src="/empty-state.png" alt="No data" width={48} height={48} className="opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No fees found</h3>
              <p className="text-gray-500">Get started by adding your first class fee.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {count > 0 && (
          <div className="mt-6 flex justify-center">
            <Pagination count={count} page={page} />
          </div>
        )}
      </div>
    </div>
  );
};

export default FeesManagement;