"use client";

import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import Image from "next/image";

interface ReportData {
  school: {
    name: string;
    address: string;
    phone: string;
  };
  operatingActivities: any[];
  investingActivities: any[];
  financingActivities: any[];
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  netCashFlow: number;
  beginningCashBalance: number;
  endingCashBalance: number;
  incomeTransactions: any[];
  expenseTransactions: any[];
  startDate: string;
  endDate: string;
}

interface Props {
  reportData: ReportData;
}

const PrintableCashFlow = React.forwardRef<HTMLDivElement, { data: ReportData }>((props, ref) => {
  const { data } = props;
  
  return (
    <div ref={ref} className="p-8 bg-white">
      {/* REPORT HEADER */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{data.school.name}</h1>
        <p className="text-gray-600">{data.school.address}</p>
        <p className="text-gray-600">{data.school.phone}</p>
        <h2 className="text-xl font-semibold mt-4 text-gray-800">Cash Flow Statement</h2>
        <p className="text-gray-600">
          For the period from {new Intl.DateTimeFormat("en-GB").format(new Date(data.startDate))} to{" "}
          {new Intl.DateTimeFormat("en-GB").format(new Date(data.endDate))}
        </p>
      </div>

      {/* OPERATING ACTIVITIES */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-blue-700 mb-4 border-b border-gray-200 pb-2">
          CASH FLOWS FROM OPERATING ACTIVITIES
        </h3>
        
        {/* Cash Receipts */}
        <div className="mb-4">
          <h4 className="font-medium text-green-700 mb-2">Cash Receipts:</h4>
          <div className="space-y-1 ml-4">
            {data.incomeTransactions.map((transaction) => (
              <div key={transaction.id} className="flex justify-between items-center py-1">
                <span className="text-sm">{transaction.description}</span>
                <span className="text-sm font-medium text-green-600">
                  GHS {transaction.amount.toLocaleString()}
                </span>
              </div>
            ))}
            <div className="border-t border-gray-200 pt-1 mt-2">
              <div className="flex justify-between items-center font-medium">
                <span>Total Cash Receipts</span>
                <span className="text-green-600">
                  GHS {data.incomeTransactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cash Payments */}
        <div className="mb-4">
          <h4 className="font-medium text-red-700 mb-2">Cash Payments:</h4>
          <div className="space-y-1 ml-4">
            {data.expenseTransactions.map((transaction) => (
              <div key={transaction.id} className="flex justify-between items-center py-1">
                <span className="text-sm">{transaction.description}</span>
                <span className="text-sm font-medium text-red-600">
                  (GHS {transaction.amount.toLocaleString()})
                </span>
              </div>
            ))}
            <div className="border-t border-gray-200 pt-1 mt-2">
              <div className="flex justify-between items-center font-medium">
                <span>Total Cash Payments</span>
                <span className="text-red-600">
                  (GHS {data.expenseTransactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()})
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-300 pt-2">
          <div className="flex justify-between items-center font-semibold text-lg">
            <span>Net Cash from Operating Activities</span>
            <span className={data.operatingCashFlow >= 0 ? "text-green-600" : "text-red-600"}>
              {data.operatingCashFlow >= 0 ? "" : "("}GHS {Math.abs(data.operatingCashFlow).toLocaleString()}{data.operatingCashFlow >= 0 ? "" : ")"}
            </span>
          </div>
        </div>
      </div>

      {/* INVESTING ACTIVITIES */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-purple-700 mb-4 border-b border-gray-200 pb-2">
          CASH FLOWS FROM INVESTING ACTIVITIES
        </h3>
        
        {data.investingActivities.length > 0 ? (
          <div className="space-y-1 ml-4">
            {data.investingActivities.map((transaction) => (
              <div key={transaction.id} className="flex justify-between items-center py-1">
                <span className="text-sm">{transaction.description}</span>
                <span className={`text-sm font-medium ${
                  transaction.type === "INCOME" ? "text-green-600" : "text-red-600"
                }`}>
                  {transaction.type === "EXPENSE" ? "(" : ""}GHS {transaction.amount.toLocaleString()}{transaction.type === "EXPENSE" ? ")" : ""}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 ml-4">No investing activities for this period</p>
        )}

        <div className="border-t border-gray-300 pt-2 mt-4">
          <div className="flex justify-between items-center font-semibold text-lg">
            <span>Net Cash from Investing Activities</span>
            <span className={data.investingCashFlow >= 0 ? "text-green-600" : "text-red-600"}>
              {data.investingCashFlow >= 0 ? "" : "("}GHS {Math.abs(data.investingCashFlow).toLocaleString()}{data.investingCashFlow >= 0 ? "" : ")"}
            </span>
          </div>
        </div>
      </div>

      {/* FINANCING ACTIVITIES */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-orange-700 mb-4 border-b border-gray-200 pb-2">
          CASH FLOWS FROM FINANCING ACTIVITIES
        </h3>
        
        {data.financingActivities.length > 0 ? (
          <div className="space-y-1 ml-4">
            {data.financingActivities.map((transaction) => (
              <div key={transaction.id} className="flex justify-between items-center py-1">
                <span className="text-sm">{transaction.description}</span>
                <span className={`text-sm font-medium ${
                  transaction.type === "INCOME" ? "text-green-600" : "text-red-600"
                }`}>
                  {transaction.type === "EXPENSE" ? "(" : ""}GHS {transaction.amount.toLocaleString()}{transaction.type === "EXPENSE" ? ")" : ""}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 ml-4">No financing activities for this period</p>
        )}

        <div className="border-t border-gray-300 pt-2 mt-4">
          <div className="flex justify-between items-center font-semibold text-lg">
            <span>Net Cash from Financing Activities</span>
            <span className={data.financingCashFlow >= 0 ? "text-green-600" : "text-red-600"}>
              {data.financingCashFlow >= 0 ? "" : "("}GHS {Math.abs(data.financingCashFlow).toLocaleString()}{data.financingCashFlow >= 0 ? "" : ")"}
            </span>
          </div>
        </div>
      </div>

      {/* NET CHANGE IN CASH */}
      <div className="border-t-2 border-gray-400 pt-4 mb-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center font-semibold text-lg">
            <span>Net Change in Cash</span>
            <span className={data.netCashFlow >= 0 ? "text-green-600" : "text-red-600"}>
              {data.netCashFlow >= 0 ? "" : "("}GHS {Math.abs(data.netCashFlow).toLocaleString()}{data.netCashFlow >= 0 ? "" : ")"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Cash at Beginning of Period</span>
            <span>GHS {data.beginningCashBalance.toLocaleString()}</span>
          </div>
          <div className="border-t border-gray-300 pt-2">
            <div className="flex justify-between items-center font-bold text-xl">
              <span>Cash at End of Period</span>
              <span className={data.endingCashBalance >= 0 ? "text-green-600" : "text-red-600"}>
                GHS {data.endingCashBalance.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* REPORT FOOTER */}
      <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
        <p>Generated on {new Intl.DateTimeFormat("en-GB").format(new Date())}</p>
        <p>This report was automatically generated by the School Management System</p>
      </div>
    </div>
  );
});

PrintableCashFlow.displayName = 'PrintableCashFlow';

const CashFlowPrint: React.FC<Props> = ({ reportData }) => {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Cash_Flow_Statement_${reportData.startDate}_to_${reportData.endDate}`,
  });

  return (
    <>
      <button 
        onClick={handlePrint}
        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center gap-2"
      >
        <Image src="/result.png" alt="" width={16} height={16} />
        Export PDF
      </button>
      <div style={{ display: 'none' }}>
        <PrintableCashFlow ref={componentRef} data={reportData} />
      </div>
    </>
  );
};

export default CashFlowPrint;