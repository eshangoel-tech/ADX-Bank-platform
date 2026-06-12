"use client";

interface Props {
  response: unknown | null;
  loading: boolean;
  error: string | null;
  title?: string;
}

export function ApiResponseViewer({
  response,
  loading,
  error,
  title = "Response",
}: Props) {
  if (!loading && !error && response === null) return null;

  return (
    <div className="mt-4">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        {title}
      </h3>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-400 py-3">
          <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-900/20 border border-red-800/60 rounded-lg p-3 text-sm text-red-400 whitespace-pre-wrap">
          {error}
        </div>
      )}

      {!loading && !error && response !== null && (
        <pre className="bg-[#0d1117] border border-slate-800 text-emerald-400 text-xs rounded-xl p-4 overflow-auto max-h-72 leading-relaxed">
          {JSON.stringify(response, null, 2)}
        </pre>
      )}
    </div>
  );
}
