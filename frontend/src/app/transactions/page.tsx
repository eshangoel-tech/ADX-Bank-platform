"use client";

import { useEffect, useState } from "react";
import { api, getErrorMessage } from "@/services/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";

interface Transaction {
  id: string;
  entry_type: "CREDIT" | "DEBIT";
  amount: string;
  balance_after: string;
  reference_type: string;
  description: string;
  created_at: string;
}

const REF_LABELS: Record<string, string> = {
  TRANSFER: "Transfer",
  WALLET_TOPUP: "Wallet Top-up",
  LOAN_EMI: "Loan EMI",
  SALARY_CREDIT: "Salary Credit",
  JOINING_BONUS: "Joining Bonus",
};

function TransactionsContent() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async (p: number, append = false) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/transactions?page=${p}&limit=10`);
      const list: Transaction[] = data?.data?.transactions ?? data?.transactions ?? data?.data ?? [];
      if (append) {
        setTransactions((prev) => [...prev, ...list]);
      } else {
        setTransactions(list);
      }
      setHasMore(list.length === 10);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(1);
  }, []);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchTransactions(next, true);
  };

  return (
    <div className="space-y-4">
      {error && <div className="error-box">{error}</div>}

      {transactions.length === 0 && !loading && (
        <div className="card text-center py-16 text-slate-500">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm">No transactions yet.</p>
        </div>
      )}

      {transactions.length > 0 && (
        <div className="card divide-y divide-slate-800 p-0 overflow-hidden">
          {transactions.map((tx) => (
            <div key={tx.id} className="px-5 py-4 flex justify-between items-center hover:bg-slate-800/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  tx.entry_type === "CREDIT" ? "bg-emerald-900/30" : "bg-red-900/30"
                }`}>
                  <svg className={`w-4 h-4 ${tx.entry_type === "CREDIT" ? "text-emerald-400" : "text-red-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    {tx.entry_type === "CREDIT"
                      ? <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      : <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7M12 3v18" />
                    }
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    {tx.description || REF_LABELS[tx.reference_type] || tx.reference_type}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500">{new Date(tx.created_at).toLocaleString()}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 font-mono">
                      {REF_LABELS[tx.reference_type] ?? tx.reference_type}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className={`text-sm font-bold ${tx.entry_type === "CREDIT" ? "text-emerald-400" : "text-red-400"}`}>
                  {tx.entry_type === "CREDIT" ? "+" : "−"}₹{parseFloat(tx.amount).toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Bal: ₹{parseFloat(tx.balance_after).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-6">
          <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {hasMore && !loading && transactions.length > 0 && (
        <div className="flex justify-center">
          <button onClick={loadMore} className="btn-secondary">
            Load More
          </button>
        </div>
      )}
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <ProtectedRoute>
      <h1 className="page-title">Transaction History</h1>
      <TransactionsContent />
    </ProtectedRoute>
  );
}
