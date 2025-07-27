'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

interface Class {
  id: number;
  name: string;
  grade: {
    name: string;
  };
}

interface ResultApproval {
  id: number;
  classId: number;
  term: string;
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  className: string;
  gradeName: string;
}

const TERMS = [
  { value: 'FIRST', label: 'First Term' },
  { value: 'SECOND', label: 'Second Term' },
  { value: 'THIRD', label: 'Third Term' },
  { value: 'FINAL', label: 'Final Term' },
];

const ResultApprovalManager = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [approvals, setApprovals] = useState<ResultApproval[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string>('FIRST');
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);

  const loadClasses = async () => {
    try {
      const response = await fetch('/api/classes');
      if (response.ok) {
        const data = await response.json();
        setClasses(data);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      toast.error('Failed to load classes');
    }
  };

  const loadApprovals = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/result-approvals?term=${selectedTerm}`);
      if (response.ok) {
        const data = await response.json();
        setApprovals(data);
      }
    } catch (error) {
      console.error('Error loading approvals:', error);
      toast.error('Failed to load result approvals');
    } finally {
      setIsLoading(false);
    }
  }, [selectedTerm]);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedTerm) {
      loadApprovals();
    }
  }, [selectedTerm, loadApprovals]);

  const handleApprovalToggle = async (classId: number, currentStatus: boolean, notes?: string) => {
    setIsUpdating(classId);
    try {
      const response = await fetch('/api/result-approvals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classId,
          term: selectedTerm,
          isApproved: !currentStatus,
          notes: notes?.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update approval status');
      }

      const result = await response.json();
      toast.success(
        `Results ${!currentStatus ? 'approved' : 'unapproved'} for ${result.className} - ${selectedTerm} Term`
      );
      
      // Reload approvals to reflect changes
      loadApprovals();
    } catch (error) {
      console.error('Error updating approval:', error);
      toast.error('Failed to update approval status');
    } finally {
      setIsUpdating(null);
    }
  };

  const getApprovalForClass = (classId: number) => {
    return approvals.find(approval => approval.classId === classId);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Result Approval Management</h2>
        <p className="text-gray-600 text-sm">
          Control when students and parents can view their term results. Only approved results are visible to students and parents.
        </p>
      </div>

      {/* Term Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Term</label>
        <select
          className="w-full md:w-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={selectedTerm}
          onChange={(e) => setSelectedTerm(e.target.value)}
        >
          {TERMS.map((term) => (
            <option key={term.value} value={term.value}>
              {term.label}
            </option>
          ))}
        </select>
      </div>

      {/* Approval Status Cards */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading approval status...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            {TERMS.find(t => t.value === selectedTerm)?.label} Results Approval
          </h3>
          
          {classes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No classes found. Create classes first to manage result approvals.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((classItem) => {
                const approval = getApprovalForClass(classItem.id);
                const isApproved = approval?.isApproved || false;
                const isUpdatingThis = isUpdating === classItem.id;

                return (
                  <div
                    key={classItem.id}
                    className={`border rounded-lg p-4 ${
                      isApproved
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {classItem.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {classItem.grade.name}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isApproved
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {isApproved ? 'Approved' : 'Not Approved'}
                      </div>
                    </div>

                    {approval?.approvedAt && (
                      <div className="text-xs text-gray-500 mb-3">
                        Approved on: {new Date(approval.approvedAt).toLocaleDateString()}
                      </div>
                    )}

                    {approval?.notes && (
                      <div className="text-xs text-gray-600 mb-3 p-2 bg-gray-100 rounded">
                        <strong>Notes:</strong> {approval.notes}
                      </div>
                    )}

                    <button
                      onClick={() => handleApprovalToggle(classItem.id, isApproved)}
                      disabled={isUpdatingThis}
                      className={`w-full px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isApproved
                          ? 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400'
                          : 'bg-green-600 text-white hover:bg-green-700 disabled:bg-green-400'
                      }`}
                    >
                      {isUpdatingThis ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Updating...
                        </div>
                      ) : (
                        <>
                          {isApproved ? '🚫 Revoke Approval' : '✅ Approve Results'}
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {!isLoading && classes.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">Approval Summary</h4>
          <div className="text-sm text-blue-700">
            <p>
              <strong>Approved Classes:</strong> {approvals.filter(a => a.isApproved).length} of {classes.length}
            </p>
            <p className="mt-1">
              Students and parents can only view results for approved classes. 
              Unapproved results will show a &quot;not yet approved&quot; message.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultApprovalManager;