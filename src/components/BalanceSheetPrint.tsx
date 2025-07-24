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
  assetAccountTotals: any[];
  liabilityAccountTotals: any[];
  equityAccountTotals: any[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  netIncome: number;
  asOfDate: string;
}

interface Props {
  reportData: ReportData;
}

const PrintableBalanceSheet = React.forwardRef<HTMLDivElement, { data: ReportData }>((props, ref) => {
  const { data } = props;
  
  return (
    <div ref={ref} className="p-8 bg-white">
      {/* REPORT HEADER */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{data.school.name}</h1>
        <p className="text-gray-600">{data.school.address}</p>
        <p className="text-gray-600">{data.school.phone}</p>
        <h2 className="text-xl font-semibold mt-4 text-gray-800">Balance Sheet</h2>
        <p className="text-gray-600">
          As of {new Intl.DateTimeFormat("en-GB").format(new Date(data.asOfDate))}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* LEFT SIDE - ASSETS */}
        <div>
          <h3 className="text-lg font-semibold text-blue-700 mb-4 border-b border-gray-200 pb-2">
            ASSETS
          </h3>
          
          {/* Current Assets */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 mb-2">Current Assets</h4>
            <div className="space-y-1 ml-4">
              {data.assetAccountTotals
                .filter(account => account.subType === "CURRENT_ASSET")
                .map((account) => (
                  <div key={account.id} className="flex justify-between items-center py-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-gray-500">{account.code}</span>
                      <span className="text-sm">{account.name}</span>
                    </div>
                    <span className="text-sm font-medium">GHS {account.balance.toLocaleString()}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Fixed Assets */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 mb-2">Fixed Assets</h4>
            <div className="space-y-1 ml-4">
              {data.assetAccountTotals
                .filter(account => account.subType === "FIXED_ASSET")
                .map((account) => (
                  <div key={account.id} className="flex justify-between items-center py-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-gray-500">{account.code}</span>
                      <span className="text-sm">{account.name}</span>
                    </div>
                    <span className="text-sm font-medium">GHS {account.balance.toLocaleString()}</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="border-t border-gray-300 pt-2">
            <div className="flex justify-between items-center font-semibold text-lg">
              <span>Total Assets</span>
              <span className="text-blue-600">GHS {data.totalAssets.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - LIABILITIES & EQUITY */}
        <div>
          {/* LIABILITIES */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-red-700 mb-4 border-b border-gray-200 pb-2">
              LIABILITIES
            </h3>
            
            {/* Current Liabilities */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Current Liabilities</h4>
              <div className="space-y-1 ml-4">
                {data.liabilityAccountTotals
                  .filter(account => account.subType === "CURRENT_LIABILITY")
                  .map((account) => (
                    <div key={account.id} className="flex justify-between items-center py-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-gray-500">{account.code}</span>
                        <span className="text-sm">{account.name}</span>
                      </div>
                      <span className="text-sm font-medium">GHS {account.balance.toLocaleString()}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Long-term Liabilities */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Long-term Liabilities</h4>
              <div className="space-y-1 ml-4">
                {data.liabilityAccountTotals
                  .filter(account => account.subType === "LONG_TERM_LIABILITY")
                  .map((account) => (
                    <div key={account.id} className="flex justify-between items-center py-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-gray-500">{account.code}</span>
                        <span className="text-sm">{account.name}</span>
                      </div>
                      <span className="text-sm font-medium">GHS {account.balance.toLocaleString()}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="border-t border-gray-300 pt-2 mb-6">
              <div className="flex justify-between items-center font-semibold">
                <span>Total Liabilities</span>
                <span className="text-red-600">GHS {data.totalLiabilities.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* EQUITY */}
          <div>
            <h3 className="text-lg font-semibold text-purple-700 mb-4 border-b border-gray-200 pb-2">
              EQUITY
            </h3>
            
            <div className="space-y-1 ml-4 mb-4">
              {data.equityAccountTotals.map((account) => (
                <div key={account.id} className="flex justify-between items-center py-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-gray-500">{account.code}</span>
                    <span className="text-sm">{account.name}</span>
                  </div>
                  <span className="text-sm font-medium">GHS {account.balance.toLocaleString()}</span>
                </div>
              ))}
              
              {/* Retained Earnings (Net Income) */}
              <div className="flex justify-between items-center py-1">
                <span className="text-sm">Retained Earnings</span>
                <span className="text-sm font-medium">GHS {data.netIncome.toLocaleString()}</span>
              </div>
            </div>

            <div className="border-t border-gray-300 pt-2">
              <div className="flex justify-between items-center font-semibold">
                <span>Total Equity</span>
                <span className="text-purple-600">GHS {data.totalEquity.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* TOTAL LIABILITIES & EQUITY */}
          <div className="border-t-2 border-gray-400 pt-4 mt-6">
            <div className="flex justify-between items-center font-bold text-lg">
              <span>Total Liabilities & Equity</span>
              <span>GHS {(data.totalLiabilities + data.totalEquity).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* BALANCE CHECK */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-medium">Balance Check:</span>
          <span className={`font-bold ${
            Math.abs(data.totalAssets - (data.totalLiabilities + data.totalEquity)) < 0.01 
              ? "text-green-600" 
              : "text-red-600"
          }`}>
            {Math.abs(data.totalAssets - (data.totalLiabilities + data.totalEquity)) < 0.01 
              ? "✓ Balanced" 
              : "⚠ Not Balanced"}
          </span>
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

PrintableBalanceSheet.displayName = 'PrintableBalanceSheet';

const BalanceSheetPrint: React.FC<Props> = ({ reportData }) => {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Balance_Sheet_${reportData.asOfDate}`,
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
        <PrintableBalanceSheet ref={componentRef} data={reportData} />
      </div>
    </>
  );
};

export default BalanceSheetPrint;