"use client";

import React, { useState } from "react";

interface TaxOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (overrideRate: number, overrideReason: string) => void;
  currentRate: number | null;
  itemName: string;
}

const PREDEFINED_REASONS = [
  "Customer is tax-exempt",
  "Export sale (zero-rated)",
  "Special tax zone concession",
  "Disputed tax rate adjustment",
  "Other"
];

export function TaxOverrideModal({ isOpen, onClose, onApply, currentRate, itemName }: TaxOverrideModalProps) {
  const [overrideRate, setOverrideRate] = useState<number | "">(currentRate ?? 0);
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [otherReason, setOtherReason] = useState<string>("");
  const [error, setError] = useState<string>("");

  if (!isOpen) return null;

  const handleApply = () => {
    setError("");
    const rateToApply = Number(overrideRate);
    if (isNaN(rateToApply) || rateToApply < 0) {
      setError("Please enter a valid tax rate.");
      return;
    }

    if (!selectedReason) {
      setError("Please select a reason for this override.");
      return;
    }

    let finalReason = selectedReason;
    if (selectedReason === "Other") {
      if (!otherReason.trim()) {
        setError("Please provide a free-text reason for 'Other'.");
        return;
      }
      finalReason = `Other: ${otherReason.trim()}`;
    }

    onApply(rateToApply, finalReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Override Tax Rate</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Applying manual override for item: <span className="font-semibold">{itemName}</span>
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New Tax Rate (%)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              value={overrideRate}
              onChange={(e) => setOverrideRate(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Override Reason
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
            >
              <option value="" disabled>Select a reason...</option>
              {PREDEFINED_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {selectedReason === "Other" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Please specify <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                rows={3}
                placeholder="Required free-text reason..."
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
              />
            </div>
          )}

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Apply Override
          </button>
        </div>
      </div>
    </div>
  );
}
