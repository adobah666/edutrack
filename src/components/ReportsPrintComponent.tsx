"use client";

import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import Image from "next/image";

interface ReportData {
  income: number;
  expenses: number;
  netIncome: number;
  incomeAccountTotals: any[];
  expenseAccountTotals: any[];
  assetAccounts: any[];
  liabilityAccounts: any[];
  equityAccounts: any[];
  recentTransactions: any[];
  school: {
    name: string;
    address: string;
    phone: string;
  };
}

interface Props {
  reportData: ReportData;
}

const PrintableReport = React.forwardRef<HTMLDivElement, { data: ReportData }>((props, ref) => {
  const { data } = props;
  
  return (
    <div ref={ref} className="p-8 bg-white">
      {/* REPORT HEADER */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{data.school.name}</h1>
        <p className="text-gray-600">{data.school.address}</p>
        <p className="text-gray-600">{data.school.phone}</p>
        <h2 className="text-xl font-semibold mt-4 text-gray-800">Financial Summary Report</h2>
        <p className="text-gray-600">
          Generated on {new Intl.DateTimeFormat("en-GB").format(new Date())}
        </p>
      </div>

      {/* FINANCIAL SUMMARY */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="text-center p-4 border">
          <p className="text-sm text-green-600">Total Income</p>
          <p className="text-2xl font-bold text-green-800">GHS {data.income.toLocaleString()}</p>
        </div>
        <div className="text-center p-4 border">
          <p className="text-sm text-red-600">Total Expenses</p>
          <p className="text-2xl font-bold text-red-800">GHS {data.expenses.toLocaleString()}</p>
        </div>
        <div className="text-center p-4 border">
          <p className={`text-sm ${data.netIncome >= 0 ? 'text-blue-600' : 'text-red-600'}`}>Net Income</p>
          <p className={`text-2xl font-bold ${data.netIncome >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
            GHS {data.netIncome.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* INCOME STATEMENT */}
        <div>
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Income Statement</h3>
          
          {/* INCOME SECTION */}
          <div className="mb-6">
            <h4 className="font-medium text-green-700 mb-3">Income</h4>
            <div className="space-y-2">
              {data.incomeAccountTotals.map((account) => (
                <div key={account.id} className="flex justify-between text-sm">
                  <span>{account.name}</span>
                  <span>GHS {account.total.toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-medium">
                <span>Total Income</span>
                <span>GHS {data.income.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* EXPENSES SECTION */}
          <div className="mb-6">
            <h4 className="font-medium text-red-700 mb-3">Expenses</h4>
            <div className="space-y-2">
              {data.expenseAccountTotals.map((account) => (
                <div key={account.id} className="flex justify-between text-sm">
                  <span>{account.name}</span>
                  <span>GHS {account.total.toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-medium">
                <span>Total Expenses</span>
                <span>GHS {data.expenses.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* NET INCOME */}
          <div className="border-t-2 pt-4">
            <div className="flex justify-between font-bold text-lg">
              <span>Net Income</span>
              <span>GHS {data.netIncome.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* BALANCE SHEET PREVIEW */}
        <div>
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Balance Sheet Preview</h3>
          
          {/* ASSETS */}
          <div className="mb-4">
            <h4 className="font-medium text-blue-700 mb-2">Assets</h4>
            <div className="space-y-1">
              {data.assetAccounts.map((account) => (
                <div key={account.id} className="flex justify-between text-sm">
                  <span>{account.name}</span>
                  <span>{account._count.transactions} transactions</span>
                </div>
              ))}
            </div>
          </div>

          {/* LIABILITIES */}
          <div className="mb-4">
            <h4 className="font-medium text-red-700 mb-2">Liabilities</h4>
            <div className="space-y-1">
              {data.liabilityAccounts.length > 0 ? (
                data.liabilityAccounts.map((account) => (
                  <div key={account.id} className="flex justify-between text-sm">
                    <span>{account.name}</span>
                    <span>{account._count.transactions} transactions</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No liability accounts</p>
              )}
            </div>
          </div>

          {/* EQUITY */}
          <div>
            <h4 className="font-medium text-purple-700 mb-2">Equity</h4>
            <div className="space-y-1">
              {data.equityAccounts.length > 0 ? (
                data.equityAccounts.map((account) => (
                  <div key={account.id} className="flex justify-between text-sm">
                    <span>{account.name}</span>
                    <span>{account._count.transactions} transactions</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No equity accounts</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RECENT TRANSACTIONS */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4 border-b pb-2">Recent Transactions</h3>
        <table className="w-full text-sm border-collapse border">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left p-2 border">Date</th>
              <th className="text-left p-2 border">Reference</th>
              <th className="text-left p-2 border">Description</th>
              <th className="text-left p-2 border">Account</th>
              <th className="text-right p-2 border">Amount</th>
              <th className="text-center p-2 border">Type</th>
            </tr>
          </thead>
          <tbody>
            {data.recentTransactions.map((transaction) => (
              <tr key={transaction.id}>
                <td className="p-2 border">{new Intl.DateTimeFormat("en-GB").format(transaction.date)}</td>
                <td className="p-2 border font-mono">{transaction.reference}</td>
                <td className="p-2 border">{transaction.description}</td>
                <td className="p-2 border">{transaction.mainAccount.name}</td>
                <td className="p-2 border text-right font-medium">
                  {transaction.type === "INCOME" ? "+" : "-"}GHS {transaction.amount.toLocaleString()}
                </td>
                <td className="p-2 border text-center">{transaction.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* REPORT FOOTER */}
      <div className="mt-12 pt-8 border-t text-center text-sm text-gray-500">
        <p>This report was automatically generated by the School Management System</p>
      </div>
    </div>
  );
});

PrintableReport.displayName = 'PrintableReport';

const ReportsPrintComponent: React.FC<Props> = ({ reportData }) => {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Financial_Report_${new Date().toISOString().split('T')[0]}`,
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
        <PrintableReport ref={componentRef} data={reportData} />
      </div>
    </>
  );
};

export default ReportsPrintComponent;