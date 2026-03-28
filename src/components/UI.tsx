"use client";

import { useState, useEffect } from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

export function LoadingSpinner({ size = "md", text }: LoadingSpinnerProps) {
  const sizeClasses = { sm: "w-5 h-5", md: "w-8 h-8", lg: "w-12 h-12" };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div
        className={`${sizeClasses[size]} border-2 border-white/20 border-t-blue-500 rounded-full animate-spin`}
      />
      {text && <p className="text-gray-400 text-sm">{text}</p>}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  gradient?: string;
}

export function StatCard({ label, value, icon, gradient = "from-blue-600 to-purple-600" }: StatCardProps) {
  return (
    <div className="glass p-5 sm:p-6 card-hover">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xl shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-2xl sm:text-3xl font-bold">{value}</p>
          <p className="text-gray-400 text-sm truncate">{label}</p>
        </div>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="glass p-8 sm:p-12 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ open, title, message, onConfirm, onCancel }: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="glass-strong p-6 max-w-sm w-full relative animate-slide-up">
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-gray-300 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-secondary text-sm px-4 py-2">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn-danger text-sm px-4 py-2">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
