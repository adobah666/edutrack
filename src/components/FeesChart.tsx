// src/components/FeesChart.tsx
'use client';

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: 'Fees Collection Overview',
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Amount (GH₵)',
      },
    },
  },
};

type FeesChartProps = {
  data: {
    id: number;
    amount: number;
    dueDate: Date;
    className: string;
    feeTypeName: string;
    paidCount: number;
    totalStudents: number;
    totalPaid: number;
  }[];
};

const FeesChart = ({ data }: FeesChartProps) => {
  // Group data by fee type
  const feesByType = data.reduce((acc, fee) => {
    const type = fee.feeTypeName;
    if (!acc[type]) {
      acc[type] = {
        totalAmount: 0,
        paidAmount: 0,
        expectedAmount: 0,
      };
    }    const expectedTotal = Number(fee.amount) * Number(fee.totalStudents);
    acc[type].expectedAmount += expectedTotal;
    acc[type].paidAmount += Number(fee.totalPaid);
    return acc;
  }, {} as Record<string, { totalAmount: number; paidAmount: number; expectedAmount: number }>);

  const chartData = {
    labels: Object.keys(feesByType),
    datasets: [
      {
        label: 'Expected Amount',
        data: Object.values(feesByType).map(d => d.expectedAmount),
        backgroundColor: 'rgba(53, 162, 235, 0.3)',
      },
      {
        label: 'Collected Amount',
        data: Object.values(feesByType).map(d => d.paidAmount),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
    ],
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <Bar options={options} data={chartData} height={100} />
    </div>
  );
};

export default FeesChart;
