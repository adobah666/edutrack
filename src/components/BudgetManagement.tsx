"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

interface BudgetItem {
  id: number;
  budgetId: number;
  budgetedAmount: number;
  actualAmount: number;
  description: string | null;
  variance: number;
  percentageUsed: number;
  createdAt: Date;
  updatedAt: Date;
  account: {
    id: number;
    name: string;
    code: string;
    type: 'INCOME' | 'EXPENSE';
  };
}

interface Budget {
  id: number;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  totalAmount: number;
  isActive: boolean;
  budgetItems: BudgetItem[];
}

interface BudgetManagementProps {
  budgets: Budget[];
  accounts: {
    id: number;
    name: string;
    code: string;
    type: 'INCOME' | 'EXPENSE';
  }[];
  budgetVsActual: BudgetItem[];
  activeBudget: Budget | null;
  school: any;
}

const BudgetManagement = ({
  budgets,
  accounts,
  budgetVsActual,
  activeBudget,
  school,
}: BudgetManagementProps) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showCreateBudget, setShowCreateBudget] = useState(false);
  const [showAddBudgetItem, setShowAddBudgetItem] = useState(false);
  const [showEditBudget, setShowEditBudget] = useState(false);
  const [showEditBudgetItem, setShowEditBudgetItem] = useState(false);
  const [showRecordTransaction, setShowRecordTransaction] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(activeBudget || budgets[0]);
  const [selectedBudgetItem, setSelectedBudgetItem] = useState<BudgetItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentBudgetData, setCurrentBudgetData] = useState<BudgetItem[]>([]);
  const router = useRouter();

  // Update current budget data when selected budget changes
  useEffect(() => {
    if (selectedBudget && selectedBudget.budgetItems) {
      setCurrentBudgetData(selectedBudget.budgetItems.map((item: Omit<BudgetItem, 'variance' | 'percentageUsed'>) => {
        const actualAmount = item.actualAmount || 0;
        const variance = actualAmount - item.budgetedAmount;
        const percentageUsed = item.budgetedAmount > 0 ? (actualAmount / item.budgetedAmount) * 100 : 0;
        
        return {
          ...item,
          actualAmount,
          variance,
          percentageUsed,
        };
      }));
    } else {
      setCurrentBudgetData([]);
    }
  }, [selectedBudget]);

  // Create new budget
  const createBudget = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/budgets", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      toast.success("Budget created successfully!");
      setShowCreateBudget(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to create budget");
    } finally {
      setIsLoading(false);
    }
  };

  // Add budget item
  const addBudgetItem = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/budget-items", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      toast.success("Budget item added successfully!");
      setShowAddBudgetItem(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to add budget item");
    } finally {
      setIsLoading(false);
    }
  };

  // Update budget
  const updateBudget = async (formData: FormData) => {
    if (!selectedBudget) {
      toast.error("No budget selected");
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/budgets/${selectedBudget.id}`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      toast.success("Budget updated successfully!");
      setShowEditBudget(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to update budget");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete budget item
  const deleteBudgetItem = async (itemId: number) => {
    if (!confirm("Are you sure you want to delete this budget item?")) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/budget-items/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      toast.success("Budget item deleted successfully!");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete budget item");
    } finally {
      setIsLoading(false);
    }
  };

  // Record transaction against budget
  const recordTransaction = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      toast.success("Transaction recorded successfully!");
      setShowRecordTransaction(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to record transaction");
    } finally {
      setIsLoading(false);
    }
  };

  // Set budget as active
  const setActiveBudget = async (budgetId: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/budgets/${budgetId}/activate`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      toast.success("Budget activated successfully!");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to activate budget");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate totals for current selected budget
  const totalBudgeted = currentBudgetData.reduce((sum: number, item) => sum + item.budgetedAmount, 0);
  const totalActual = currentBudgetData.reduce((sum: number, item) => sum + item.actualAmount, 0);
  const totalVariance = totalActual - totalBudgeted;

  // Separate income and expense items
  const incomeItems = currentBudgetData.filter(item => item.account.type === "INCOME");
  const expenseItems = currentBudgetData.filter(item => item.account.type === "EXPENSE");

  const totalIncomeBudgeted = incomeItems.reduce((sum: number, item) => sum + item.budgetedAmount, 0);
  const totalIncomeActual = incomeItems.reduce((sum: number, item) => sum + item.actualAmount, 0);
  const totalExpenseBudgeted = expenseItems.reduce((sum: number, item) => sum + item.budgetedAmount, 0);
  const totalExpenseActual = expenseItems.reduce((sum: number, item) => sum + item.actualAmount, 0);

  // Get over-budget items
  const overBudgetItems = currentBudgetData.filter(item => item.percentageUsed > 100);
  const nearBudgetItems = currentBudgetData.filter(item => item.percentageUsed > 80 && item.percentageUsed <= 100);

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Budget Management</h1>
          <p className="text-gray-600 mt-1">Plan, track, and manage your school&apos;s budget</p>
          {selectedBudget && (
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm text-gray-500">Current Budget:</span>
              <select
                value={selectedBudget.id}
                onChange={(e) => {
                  const budget = budgets.find(b => b.id === parseInt(e.target.value)) || null;
                  setSelectedBudget(budget);
                }}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                {budgets.map(budget => (
                  <option key={budget.id} value={budget.id}>
                    {budget.name} {budget.isActive ? "(Active)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {selectedBudget && (
            <>
              <button
                onClick={() => setShowEditBudget(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Image src="/update.png" alt="" width={16} height={16} />
                Edit Budget
              </button>
              <button
                onClick={() => setShowRecordTransaction(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                <Image src="/create.png" alt="" width={16} height={16} />
                Record Transaction
              </button>
            </>
          )}
          <button
            onClick={() => setShowCreateBudget(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Image src="/create.png" alt="" width={16} height={16} />
            New Budget
          </button>
          <Link href="/accounting" className="text-blue-600 hover:text-blue-800 flex items-center gap-2">
            <span>←</span>
            Back to Accounting
          </Link>
        </div>
      </div>

      {/* BUDGET OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Budgeted</p>
              <p className="text-2xl font-bold text-blue-800">GHS {totalBudgeted.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Image src="/finance.png" alt="" width={20} height={20} />
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Actual Amount</p>
              <p className="text-2xl font-bold text-green-800">GHS {totalActual.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Image src="/result.png" alt="" width={20} height={20} />
            </div>
          </div>
        </div>

        <div className={`${totalVariance >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-lg p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${totalVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>Variance</p>
              <p className={`text-2xl font-bold ${totalVariance >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                GHS {Math.abs(totalVariance).toLocaleString()}
              </p>
              <p className={`text-xs ${totalVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalVariance >= 0 ? 'Under Budget' : 'Over Budget'}
              </p>
            </div>
            <div className={`w-10 h-10 ${totalVariance >= 0 ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center`}>
              <span className={`text-lg ${totalVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalVariance >= 0 ? '↓' : '↑'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Budget Utilization</p>
              <p className="text-2xl font-bold text-purple-800">
                {totalBudgeted > 0 ? ((totalActual / totalBudgeted) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Image src="/calendar.png" alt="" width={20} height={20} />
            </div>
          </div>
        </div>
      </div>

      {/* ALERTS */}
      {selectedBudget && (overBudgetItems.length > 0 || nearBudgetItems.length > 0) && (
        <div className="mb-6 space-y-3">
          {overBudgetItems.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-red-500">⚠</span>
                <h3 className="font-semibold text-red-800">Over Budget Alert</h3>
              </div>
              <p className="text-sm text-red-700 mb-2">
                {overBudgetItems.length} budget item(s) are over budget:
              </p>
              <div className="space-y-1">
                {overBudgetItems.slice(0, 3).map(item => (
                  <div key={item.id} className="text-sm text-red-600">
                    • {item.account.name}: {item.percentageUsed.toFixed(1)}% used (GHS {item.actualAmount.toLocaleString()} of GHS {item.budgetedAmount.toLocaleString()})
                  </div>
                ))}
                {overBudgetItems.length > 3 && (
                  <div className="text-sm text-red-600">• And {overBudgetItems.length - 3} more...</div>
                )}
              </div>
            </div>
          )}
          
          {nearBudgetItems.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-500">⚡</span>
                <h3 className="font-semibold text-yellow-800">Budget Warning</h3>
              </div>
              <p className="text-sm text-yellow-700">
                {nearBudgetItems.length} budget item(s) are approaching their limit (80%+ used)
              </p>
            </div>
          )}
        </div>
      )}

      {/* TABS */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: "dashboard", label: "Budget Dashboard", icon: "/result.png" },
              { id: "manage", label: "Manage Budget", icon: "/create.png" },
              { id: "tracking", label: "Track Progress", icon: "/finance.png" },
              { id: "reports", label: "Reports & Analysis", icon: "/calendar.png" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Image src={tab.icon} alt="" width={16} height={16} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* BUDGET OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Active Budget Info */}
              {activeBudget && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-blue-900">{activeBudget.name}</h3>
                      <p className="text-sm text-blue-700">{activeBudget.description}</p>
                      <p className="text-xs text-blue-600 mt-1">
                        {new Date(activeBudget.startDate).toLocaleDateString()} - {new Date(activeBudget.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-blue-600">Total Budget</p>
                      <p className="text-xl font-bold text-blue-800">GHS {activeBudget.totalAmount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Budget Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Income Summary */}
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Income Budget Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Budgeted Income</span>
                      <span className="font-semibold text-green-600">GHS {totalIncomeBudgeted.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Actual Income</span>
                      <span className="font-semibold text-green-800">GHS {totalIncomeActual.toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Variance</span>
                        <span className={`font-semibold ${(totalIncomeActual - totalIncomeBudgeted) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          GHS {Math.abs(totalIncomeActual - totalIncomeBudgeted).toLocaleString()}
                          {(totalIncomeActual - totalIncomeBudgeted) >= 0 ? ' (Above)' : ' (Below)'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expense Summary */}
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Budget Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Budgeted Expenses</span>
                      <span className="font-semibold text-red-600">GHS {totalExpenseBudgeted.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Actual Expenses</span>
                      <span className="font-semibold text-red-800">GHS {totalExpenseActual.toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Variance</span>
                        <span className={`font-semibold ${(totalExpenseActual - totalExpenseBudgeted) <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          GHS {Math.abs(totalExpenseActual - totalExpenseBudgeted).toLocaleString()}
                          {(totalExpenseActual - totalExpenseBudgeted) <= 0 ? ' (Under)' : ' (Over)'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* All Budgets List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">All Budgets</h3>
                <div className="space-y-3">
                  {budgets.map((budget) => (
                    <div key={budget.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div>
                        <h4 className="font-medium text-gray-900">{budget.name}</h4>
                        <p className="text-sm text-gray-600">{budget.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(budget.startDate).toLocaleDateString()} - {new Date(budget.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">GHS {budget.totalAmount.toLocaleString()}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs ${budget.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                            {budget.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <button
                            onClick={() => setSelectedBudget(budget)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* BUDGET PLANNING TAB */}
          {activeTab === "planning" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Budget Planning</h3>
                {activeBudget && (
                  <button
                    onClick={() => setShowAddBudgetItem(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <Image src="/create.png" alt="" width={16} height={16} />
                    Add Budget Item
                  </button>
                )}
              </div>

              {!activeBudget ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Image src="/finance.png" alt="" width={48} height={48} className="opacity-50" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Budget</h3>
                  <p className="text-gray-500 mb-4">Create a budget to start planning your finances.</p>
                  <button
                    onClick={() => setShowCreateBudget(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                  >
                    Create Your First Budget
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Income Planning */}
                  <div className="bg-white border rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-green-700 mb-4">Income Planning</h4>
                    <div className="space-y-3">
                      {incomeItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div>
                            <span className="font-medium text-gray-900">{item.account.name}</span>
                            <p className="text-sm text-gray-600">{item.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">GHS {item.budgetedAmount.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">Budgeted</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expense Planning */}
                  <div className="bg-white border rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-red-700 mb-4">Expense Planning</h4>
                    <div className="space-y-3">
                      {expenseItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                          <div>
                            <span className="font-medium text-gray-900">{item.account.name}</span>
                            <p className="text-sm text-gray-600">{item.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-red-600">GHS {item.budgetedAmount.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">Budgeted</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BUDGET VS ACTUAL TAB */}
          {activeTab === "tracking" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Budget vs Actual Tracking</h3>
              
              {budgetVsActual.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No budget items to track. Create a budget and add items to start tracking.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Budgeted</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actual</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Variance</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% Used</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {budgetVsActual.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{item.account.name}</div>
                              <div className="text-sm text-gray-500">{item.account.code}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              item.account.type === "INCOME" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}>
                              {item.account.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                            GHS {item.budgetedAmount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                            GHS {item.actualAmount.toLocaleString()}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${
                            item.variance >= 0 ? "text-green-600" : "text-red-600"
                          }`}>
                            {item.variance >= 0 ? "+" : ""}GHS {item.variance.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                            {item.percentageUsed.toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center">
                              {item.percentageUsed <= 80 ? (
                                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                              ) : item.percentageUsed <= 100 ? (
                                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                              ) : (
                                <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ANALYSIS & INSIGHTS TAB */}
          {activeTab === "analysis" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Budget Analysis & Insights</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Metrics */}
                <div className="bg-white border rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Budget Accuracy</span>
                      <span className="font-semibold text-blue-600">
                        {totalBudgeted > 0 ? (100 - Math.abs(totalVariance / totalBudgeted) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Income Achievement</span>
                      <span className="font-semibold text-green-600">
                        {totalIncomeBudgeted > 0 ? ((totalIncomeActual / totalIncomeBudgeted) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Expense Control</span>
                      <span className={`font-semibold ${totalExpenseActual <= totalExpenseBudgeted ? 'text-green-600' : 'text-red-600'}`}>
                        {totalExpenseBudgeted > 0 ? ((totalExpenseActual / totalExpenseBudgeted) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-white border rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h4>
                  <div className="space-y-3">
                    {totalVariance < 0 && (
                      <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                        <span className="text-red-500 mt-0.5">⚠</span>
                        <div>
                          <p className="text-sm font-medium text-red-800">Over Budget Alert</p>
                          <p className="text-sm text-red-600">Review and reduce expenses to stay within budget.</p>
                        </div>
                      </div>
                    )}
                    
                    {totalIncomeActual < totalIncomeBudgeted && (
                      <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                        <span className="text-yellow-500 mt-0.5">⚡</span>
                        <div>
                          <p className="text-sm font-medium text-yellow-800">Income Below Target</p>
                          <p className="text-sm text-yellow-600">Consider strategies to increase revenue streams.</p>
                        </div>
                      </div>
                    )}
                    
                    {totalVariance >= 0 && totalIncomeActual >= totalIncomeBudgeted && (
                      <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <div>
                          <p className="text-sm font-medium text-green-800">Budget Performance Good</p>
                          <p className="text-sm text-green-600">Continue monitoring and maintain current practices.</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <span className="text-blue-500 mt-0.5">💡</span>
                      <div>
                        <p className="text-sm font-medium text-blue-800">Regular Review</p>
                        <p className="text-sm text-blue-600">Schedule monthly budget reviews for better control.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CREATE BUDGET MODAL */}
      {showCreateBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Budget</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              createBudget(formData);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="e.g., 2025 Annual Budget"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm h-20"
                    placeholder="Brief description of the budget"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateBudget(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? "Creating..." : "Create Budget"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD BUDGET ITEM MODAL */}
      {showAddBudgetItem && activeBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Budget Item</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              formData.append("budgetId", activeBudget.id.toString());
              addBudgetItem(formData);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
                  <select
                    name="accountId"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">Select Account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.code} - {account.name} ({account.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budgeted Amount</label>
                  <input
                    type="number"
                    name="budgetedAmount"
                    required
                    min="0"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    name="description"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="Optional description"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddBudgetItem(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? "Adding..." : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetManagement;