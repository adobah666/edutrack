"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

interface BudgetManagementProps {
  budgets: any[];
  accounts: any[];
  budgetVsActual: any[];
  activeBudget: any;
  school: any;
}

const SimpleBudgetManagement = ({
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
  const [selectedBudget, setSelectedBudget] = useState(activeBudget || budgets[0]);
  const [selectedBudgetItem, setSelectedBudgetItem] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Get current budget data (already calculated with actuals from the server)
  const currentBudgetData = selectedBudget?.budgetItems || [];

  // Calculate totals
  const totalBudgeted = currentBudgetData.reduce((sum: number, item: any) => sum + item.budgetedAmount, 0);
  const totalActual = currentBudgetData.reduce((sum: number, item: any) => sum + item.actualAmount, 0);
  const totalVariance = totalActual - totalBudgeted;

  // Separate income and expense items
  const incomeItems = currentBudgetData.filter((item: any) => item.account?.type === "INCOME");
  const expenseItems = currentBudgetData.filter((item: any) => item.account?.type === "EXPENSE");

  // Get alerts
  const overBudgetItems = currentBudgetData.filter((item: any) => item.percentageUsed > 100);
  const nearBudgetItems = currentBudgetData.filter((item: any) => item.percentageUsed > 80 && item.percentageUsed <= 100);

  // API Functions
  const createBudget = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/budgets", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error((await response.json()).message);
      toast.success("Budget created successfully!");
      setShowCreateBudget(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to create budget");
    } finally {
      setIsLoading(false);
    }
  };

  const addBudgetItem = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/budget-items", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error((await response.json()).message);
      toast.success("Budget item added successfully!");
      setShowAddBudgetItem(false);
      // Force refresh to show new item immediately
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Failed to add budget item");
    } finally {
      setIsLoading(false);
    }
  };

  const updateBudgetItem = async (formData: FormData) => {
    if (!selectedBudgetItem) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/budget-items/${selectedBudgetItem.id}`, {
        method: "PUT",
        body: formData,
      });
      if (!response.ok) throw new Error((await response.json()).message);
      toast.success("Budget item updated successfully!");
      setShowEditBudgetItem(false);
      setSelectedBudgetItem(null);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to update budget item");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBudgetItem = async (itemId: number) => {
    if (!confirm("Are you sure you want to delete this budget item?")) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/budget-items/${itemId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error((await response.json()).message);
      toast.success("Budget item deleted successfully!");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete budget item");
    } finally {
      setIsLoading(false);
    }
  };

  const recordTransaction = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error((await response.json()).message);
      toast.success("Transaction recorded successfully! Budget updated.");
      setShowRecordTransaction(false);
      // Force refresh to show updated percentages immediately
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Failed to record transaction");
    } finally {
      setIsLoading(false);
    }
  };

  const setActiveBudget = async (budgetId: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/budgets/${budgetId}/activate`, {
        method: "POST",
      });
      if (!response.ok) throw new Error((await response.json()).message);
      toast.success("Budget activated successfully!");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to activate budget");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Budget Management</h1>
          <p className="text-gray-600 mt-1">Simple budget planning and tracking</p>
          {selectedBudget && (
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm text-gray-500">Current Budget:</span>
              <select
                value={selectedBudget.id}
                onChange={(e) => {
                  const budget = budgets.find(b => b.id === parseInt(e.target.value));
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
          <button
            onClick={() => setShowCreateBudget(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Image src="/create.png" alt="" width={16} height={16} />
            New Budget
          </button>
          <Link href="/accounting" className="text-blue-600 hover:text-blue-800 flex items-center gap-2">
            <span>←</span>
            Back
          </Link>
        </div>
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Planned</p>
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
              <p className="text-sm text-green-600 font-medium">Actually Spent</p>
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
              <p className={`text-sm font-medium ${totalVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalVariance >= 0 ? 'Money Left' : 'Over Budget'}
              </p>
              <p className={`text-2xl font-bold ${totalVariance >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                GHS {Math.abs(totalVariance).toLocaleString()}
              </p>
            </div>
            <div className={`w-10 h-10 ${totalVariance >= 0 ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center`}>
              <span className={`text-lg ${totalVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalVariance >= 0 ? '✓' : '⚠'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Budget Used</p>
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
      {(overBudgetItems.length > 0 || nearBudgetItems.length > 0) && (
        <div className="mb-6 space-y-3">
          {overBudgetItems.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-red-500">⚠</span>
                <h3 className="font-semibold text-red-800">Over Budget Alert!</h3>
              </div>
              <p className="text-sm text-red-700">
                {overBudgetItems.length} item(s) are over budget. Check your spending!
              </p>
            </div>
          )}
          
          {nearBudgetItems.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-500">⚡</span>
                <h3 className="font-semibold text-yellow-800">Budget Warning</h3>
              </div>
              <p className="text-sm text-yellow-700">
                {nearBudgetItems.length} item(s) are almost at their limit (80%+ used)
              </p>
            </div>
          )}
        </div>
      )}

      {/* MAIN CONTENT */}
      {!selectedBudget ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Image src="/finance.png" alt="" width={48} height={48} className="opacity-50" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Budget Found</h3>
          <p className="text-gray-500 mb-4">Create your first budget to start planning your finances.</p>
          <button
            onClick={() => setShowCreateBudget(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Create Your First Budget
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* BUDGET INFO */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedBudget.name}</h2>
                <p className="text-gray-600">{selectedBudget.description}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(selectedBudget.startDate).toLocaleDateString()} - {new Date(selectedBudget.endDate).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {!selectedBudget.isActive && (
                  <button
                    onClick={() => setActiveBudget(selectedBudget.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    Make Active
                  </button>
                )}
                <button
                  onClick={() => setShowEditBudget(true)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                >
                  Edit Budget
                </button>
                <button
                  onClick={() => setShowAddBudgetItem(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Add Item
                </button>
                <button
                  onClick={() => setShowRecordTransaction(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                >
                  Record Spending
                </button>
              </div>
            </div>
          </div>

          {/* BUDGET ITEMS */}
          <div className="bg-white rounded-lg border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Budget Items</h3>
              <p className="text-gray-600">Track how much you planned vs how much you spent</p>
            </div>
            
            {currentBudgetData.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500 mb-4">No budget items yet. Add some to start tracking!</p>
                <button
                  onClick={() => setShowAddBudgetItem(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Add Your First Item
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Planned</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Spent</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Left</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Progress</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentBudgetData.map((item: any) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.account?.name || 'Unknown Account'}</div>
                            <div className="text-sm text-gray-500">{item.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.account?.type === "INCOME" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}>
                            {item.account?.type === "INCOME" ? "Income" : "Expense"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                          GHS {item.budgetedAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                          GHS {item.actualAmount.toLocaleString()}
                        </td>
                        <td className={`px-6 py-4 text-right text-sm font-medium ${
                          item.variance >= 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          GHS {Math.abs(item.budgetedAmount - item.actualAmount).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  item.percentageUsed <= 80 ? 'bg-green-500' : 
                                  item.percentageUsed <= 100 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(item.percentageUsed, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600">{item.percentageUsed.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedBudgetItem(item);
                                setShowEditBudgetItem(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteBudgetItem(item.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODALS */}
      
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
                    placeholder="e.g., 2025 School Budget"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm h-20"
                    placeholder="What is this budget for?"
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
      {showAddBudgetItem && selectedBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Budget Item</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              formData.append("budgetId", selectedBudget.id.toString());
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
                        {account.name} ({account.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Planned Amount</label>
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
                    placeholder="What is this for?"
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
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? "Adding..." : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT BUDGET ITEM MODAL */}
      {showEditBudgetItem && selectedBudgetItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Budget Item</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              updateBudgetItem(formData);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
                  <input
                    type="text"
                    value={selectedBudgetItem.account?.name || 'Unknown Account'}
                    disabled
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Planned Amount</label>
                  <input
                    type="number"
                    name="budgetedAmount"
                    required
                    min="0"
                    step="0.01"
                    defaultValue={selectedBudgetItem.budgetedAmount}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    name="description"
                    defaultValue={selectedBudgetItem.description || ''}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="What is this for?"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditBudgetItem(false);
                    setSelectedBudgetItem(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? "Updating..." : "Update Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD TRANSACTION MODAL */}
      {showRecordTransaction && selectedBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Record Transaction</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              recordTransaction(formData);
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
                        {account.name} ({account.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    name="type"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">Select Type</option>
                    <option value="INCOME">Income (Money In)</option>
                    <option value="EXPENSE">Expense (Money Out)</option>
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
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    name="description"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="What was this for?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    name="date"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowRecordTransaction(false)}
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
    </div>
  );
};

export default SimpleBudgetManagement;