"use client";

import { useState } from "react";
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
  startDate: Date;
  endDate: Date;
  totalAmount: number;
  isActive: boolean;
  budgetItems: BudgetItem[];
  createdAt: Date;
  updatedAt: Date;
}

interface BudgetManagementProps {
  budgets: Budget[];
  accounts: any[];
  budgetVsActual: any[];
  activeBudget: any;
  school: any;
}

const EasyBudgetManagement = ({
  budgets,
  accounts,
  budgetVsActual,
  activeBudget,
  school,
}: BudgetManagementProps) => {
  const [showCreateBudget, setShowCreateBudget] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showRecordSpending, setShowRecordSpending] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [selectedBudgetItem, setSelectedBudgetItem] = useState<BudgetItem | null>(null);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [selectedBudget, setSelectedBudget] = useState(activeBudget || budgets[0]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Get current budget data
  const currentBudgetData = selectedBudget?.budgetItems || [];

  // Calculate totals
  const totalPlanned = currentBudgetData.reduce((sum: number, item: BudgetItem) => sum + item.budgetedAmount, 0);
  const totalSpent = currentBudgetData.reduce((sum: number, item: BudgetItem) => sum + (item.actualAmount || 0), 0);
  const totalLeft = totalPlanned - totalSpent;

  // Get expense categories (most budgets are for expenses)
  const expenseCategories = currentBudgetData.filter((item: BudgetItem) => item.account?.type === "EXPENSE");
  const incomeCategories = currentBudgetData.filter((item: BudgetItem) => item.account?.type === "INCOME");

  // API Functions
  const createBudget = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/budgets", { method: "POST", body: formData });
      if (!response.ok) throw new Error((await response.json()).message);
      toast.success("Budget created successfully!");
      setShowCreateBudget(false);
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Failed to create budget");
    } finally {
      setIsLoading(false);
    }
  };

  const addCategory = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/budget-items", { method: "POST", body: formData });
      if (!response.ok) throw new Error((await response.json()).message);
      toast.success("Budget category added successfully!");
      setShowAddCategory(false);
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Failed to add category");
    } finally {
      setIsLoading(false);
    }
  };

  const recordSpending = async (formData: FormData) => {
    setIsLoading(true);
    try {
      console.log("Recording transaction with data:", Object.fromEntries(formData.entries()));
      const response = await fetch("/api/transactions", { method: "POST", body: formData });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Transaction error:", errorData);
        throw new Error(errorData.message);
      }
      const result = await response.json();
      console.log("Transaction recorded:", result);
      toast.success("Transaction recorded! Budget will update after refresh.");
      setShowRecordSpending(false);
      window.location.reload();
    } catch (error: any) {
      console.error("Failed to record transaction:", error);
      toast.error(error.message || "Failed to record transaction");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBudgetItem = async (itemId: number) => {
    if (!confirm("Are you sure you want to delete this budget item? This cannot be undone.")) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/budget-items/${itemId}`, { method: "DELETE" });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }
      toast.success("Budget item deleted successfully!");
      window.location.reload();
    } catch (error: any) {
      console.error("Failed to delete budget item:", error);
      toast.error(error.message || "Failed to delete budget item");
    } finally {
      setIsLoading(false);
    }
  };

  const viewTransactionHistory = async (budgetItem: any) => {
    setIsLoading(true);
    setSelectedBudgetItem(budgetItem);
    
    try {
      // Fetch transactions for this specific account within the budget period
      const startDate = new Date(selectedBudget.startDate).toISOString();
      const endDate = new Date(selectedBudget.endDate).toISOString();
      const response = await fetch(`/api/transactions?accountId=${budgetItem.account.id}&startDate=${startDate}&endDate=${endDate}`);
      
      if (!response.ok) throw new Error("Failed to fetch transaction history");
      
      const transactions = await response.json();
      setTransactionHistory(transactions);
      setShowTransactionHistory(true);
    } catch (error: any) {
      console.error("Failed to fetch transaction history:", error);
      toast.error("Failed to load transaction history");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Easy Budget Tracker</h1>
          <p className="text-gray-600 mt-1">Plan your spending and track your progress</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateBudget(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            New Budget
          </button>
          <Link href="/accounting" className="text-blue-600 hover:text-blue-800">
            ← Back
          </Link>
        </div>
      </div>

      {!selectedBudget ? (
        /* NO BUDGET STATE */
        <div className="text-center py-16 bg-white rounded-lg border">
          <div className="w-24 h-24 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
            <Image src="/finance.png" alt="" width={48} height={48} />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Let&apos;s Create Your First Budget!</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            A budget helps you plan how much to spend on different things like salaries, utilities, and supplies.
          </p>
          <button
            onClick={() => setShowCreateBudget(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 text-lg"
          >
            Create My First Budget
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* BUDGET SELECTOR */}
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{selectedBudget.name}</h2>
                <p className="text-gray-600">{selectedBudget.description}</p>
              </div>
              <select
                value={selectedBudget.id}
                onChange={(e) => {
                  const budget = budgets.find(b => b.id === parseInt(e.target.value));
                  setSelectedBudget(budget);
                }}
                className="border border-gray-300 rounded px-3 py-2"
              >
                {budgets.map(budget => (
                  <option key={budget.id} value={budget.id}>
                    {budget.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* BUDGET OVERVIEW */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <h3 className="text-sm font-medium text-blue-600 mb-2">Total Planned</h3>
              <p className="text-3xl font-bold text-blue-800">GHS {totalPlanned.toLocaleString()}</p>
              <p className="text-sm text-blue-600 mt-1">How much you planned to spend</p>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <h3 className="text-sm font-medium text-red-600 mb-2">Total Spent</h3>
              <p className="text-3xl font-bold text-red-800">GHS {totalSpent.toLocaleString()}</p>
              <p className="text-sm text-red-600 mt-1">How much you&apos;ve actually spent</p>
            </div>
            
            <div className={`${totalLeft >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-lg p-6 text-center`}>
              <h3 className={`text-sm font-medium mb-2 ${totalLeft >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalLeft >= 0 ? 'Money Left' : 'Over Budget'}
              </h3>
              <p className={`text-3xl font-bold ${totalLeft >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                GHS {Math.abs(totalLeft).toLocaleString()}
              </p>
              <p className={`text-sm mt-1 ${totalLeft >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalLeft >= 0 ? 'You can still spend this much' : 'You spent more than planned'}
              </p>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setShowAddCategory(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Image src="/create.png" alt="" width={20} height={20} />
              Add Budget Category
            </button>
            <button
              onClick={() => setShowRecordSpending(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Image src="/finance.png" alt="" width={20} height={20} />
              Record Transaction
            </button>
          </div>

          {/* SPENDING CATEGORIES */}
          <div className="bg-white rounded-lg border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Your Spending Categories</h3>
              <p className="text-gray-600">See how much you planned vs how much you spent</p>
            </div>
            
            {currentBudgetData.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Image src="/create.png" alt="" width={32} height={32} className="opacity-50" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Categories Yet</h4>
                <p className="text-gray-600 mb-4">Add categories like &quot;Salaries&quot;, &quot;Utilities&quot;, &quot;Supplies&quot; to start budgeting</p>
                <button
                  onClick={() => setShowAddCategory(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Add Your First Category
                </button>
              </div>
            ) : (
              <div className="p-6">
                <div className="grid gap-4">
                  {currentBudgetData.map((item: BudgetItem) => {
                    const spent = item.actualAmount || 0;
                    const planned = item.budgetedAmount;
                    const percentage = planned > 0 ? (spent / planned) * 100 : 0;
                    const isOverBudget = percentage > 100;
                    
                    return (
                      <div 
                        key={item.id} 
                        className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => viewTransactionHistory(item)}
                        title="Click to view transaction history"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900 flex items-center gap-2">
                              {item.account?.name || 'Unknown'}
                              <span className="text-xs text-blue-600">📊 Click for details</span>
                            </h4>
                            <p className="text-sm text-gray-600">{item.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900">
                              GHS {spent.toLocaleString()} / GHS {planned.toLocaleString()}
                            </p>
                            <p className={`text-sm ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                              {isOverBudget ? 'Over budget!' : `GHS ${(planned - spent).toLocaleString()} left`}
                            </p>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                          <div 
                            className={`h-3 rounded-full transition-all duration-300 ${
                              percentage <= 80 ? 'bg-green-500' : 
                              percentage <= 100 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm">
                          <span className={`font-medium ${
                            percentage <= 80 ? 'text-green-600' : 
                            percentage <= 100 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {percentage.toFixed(0)}% used
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              percentage <= 80 ? 'bg-green-100 text-green-800' : 
                              percentage <= 100 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {percentage <= 80 ? 'On track' : 
                               percentage <= 100 ? 'Almost there' : 'Over budget'}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent triggering the parent click
                                deleteBudgetItem(item.id);
                              }}
                              className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded hover:bg-red-50"
                              title="Delete this budget item"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE BUDGET MODAL */}
      {showCreateBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Create New Budget</h3>
            <p className="text-gray-600 mb-4">A budget helps you plan and track your spending</p>
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
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="e.g., 2025 School Budget"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">What&apos;s this budget for?</label>
                  <textarea
                    name="description"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 h-20"
                    placeholder="e.g., Annual budget for school operations"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
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

      {/* ADD CATEGORY MODAL */}
      {showAddCategory && selectedBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Add Budget Category</h3>
            <p className="text-gray-600 mb-4">Add a category to track income or expenses</p>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              formData.append("budgetId", selectedBudget.id.toString());
              addCategory(formData);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="accountId"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Choose what you want to budget for</option>
                    <optgroup label="Income (Money Coming In)">
                      {accounts.filter(acc => acc.type === "INCOME").map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Expenses (Money Going Out)">
                      {accounts.filter(acc => acc.type === "EXPENSE").map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">How much do you plan to spend/receive?</label>
                  <input
                    type="number"
                    name="budgetedAmount"
                    required
                    min="0"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                  <input
                    type="text"
                    name="description"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Any additional notes"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddCategory(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? "Adding..." : "Add Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD TRANSACTION MODAL */}
      {showRecordSpending && selectedBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Record Transaction</h3>
            <p className="text-gray-600 mb-4">Record money you spent or received to update your budget</p>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              recordSpending(formData);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                  <select
                    name="type"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Choose transaction type</option>
                    <option value="INCOME">Income (Money Coming In)</option>
                    <option value="EXPENSE">Expense (Money Going Out)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="accountId"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Choose category</option>
                    {currentBudgetData.map((item: BudgetItem) => (
                      <option key={item.account.id} value={item.account.id}>
                        {item.account?.name} ({item.account?.type === "INCOME" ? "Income" : "Expense"})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    required
                    min="0"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    name="description"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="e.g., Paid teacher salaries for January"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    name="date"
                    required
                    min={selectedBudget.startDate.toISOString().split('T')[0]}
                    max={selectedBudget.endDate.toISOString().split('T')[0]}
                    defaultValue={
                      // Default to today if within range, otherwise budget start date
                      (() => {
                        const today = new Date().toISOString().split('T')[0];
                        const budgetStart = selectedBudget.startDate.toISOString().split('T')[0];
                        const budgetEnd = selectedBudget.endDate.toISOString().split('T')[0];
                        
                        if (today >= budgetStart && today <= budgetEnd) {
                          return today;
                        } else {
                          return budgetStart;
                        }
                      })()
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                  <p className="text-xs text-blue-600 mt-1">
                    📅 Only dates within budget period are allowed: {new Date(selectedBudget.startDate).toLocaleDateString()} - {new Date(selectedBudget.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowRecordSpending(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {isLoading ? "Recording..." : "Record Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSACTION HISTORY MODAL */}
      {showTransactionHistory && selectedBudgetItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Transaction History</h3>
                <p className="text-gray-600">
                  {selectedBudgetItem.account?.name} - {selectedBudgetItem.account?.type === "INCOME" ? "Income" : "Expense"}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowTransactionHistory(false);
                  setSelectedBudgetItem(null);
                  setTransactionHistory([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            {/* Budget Item Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600">Planned Amount</p>
                  <p className="text-lg font-semibold text-blue-600">
                    GHS {selectedBudgetItem.budgetedAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Actual Amount</p>
                  <p className="text-lg font-semibold text-green-600">
                    GHS {(selectedBudgetItem.actualAmount || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Remaining</p>
                  <p className={`text-lg font-semibold ${
                    (selectedBudgetItem.budgetedAmount - (selectedBudgetItem.actualAmount || 0)) >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    GHS {Math.abs(selectedBudgetItem.budgetedAmount - (selectedBudgetItem.actualAmount || 0)).toLocaleString()}
                    {(selectedBudgetItem.budgetedAmount - (selectedBudgetItem.actualAmount || 0)) < 0 && ' (Over)'}
                  </p>
                </div>
              </div>
            </div>

            {/* Transactions List */}
            <div className="overflow-y-auto max-h-96">
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading transactions...</p>
                </div>
              ) : transactionHistory.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Image src="/finance.png" alt="" width={32} height={32} className="opacity-50" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Transactions Yet</h4>
                  <p className="text-gray-600">No transactions have been recorded for this budget item.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactionHistory.map((transaction: any) => (
                    <div key={transaction.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              transaction.type === "INCOME" 
                                ? "bg-green-100 text-green-800" 
                                : "bg-red-100 text-red-800"
                            }`}>
                              {transaction.type === "INCOME" ? "Income" : "Expense"}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(transaction.date).toLocaleDateString()}
                            </span>
                            <span className="text-sm text-gray-500 font-mono">
                              {transaction.reference}
                            </span>
                          </div>
                          <p className="font-medium text-gray-900 mt-1">{transaction.description}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-semibold ${
                            transaction.type === "INCOME" ? "text-green-600" : "text-red-600"
                          }`}>
                            {transaction.type === "INCOME" ? "+" : "-"}GHS {transaction.amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary Footer */}
            {transactionHistory.length > 0 && (
              <div className="border-t mt-4 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">
                    Total: {transactionHistory.length} transaction{transactionHistory.length !== 1 ? 's' : ''}
                  </span>
                  <span className="font-semibold text-gray-900">
                    Total Amount: GHS {transactionHistory.reduce((sum: number, t: any) => sum + t.amount, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EasyBudgetManagement;