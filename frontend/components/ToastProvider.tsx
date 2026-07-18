"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";

interface Toast {
  id: number;
  message: string;
  emoji: string;
}

interface ToastContextValue {
  showToast: (message: string, emoji?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let idCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, emoji: string = "🎉") => {
    const id = idCounter++;
    setToasts((prev) => [...prev, { id, message, emoji }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center gap-2 bg-gray-800 dark:bg-gray-700
              text-white font-bold px-4 py-3 rounded-2xl shadow-lg max-w-sm w-full sm:w-auto
              animate-toast-in"
          >
            <span className="text-xl">{toast.emoji}</span>
            <span className="text-sm">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export default ToastProvider;