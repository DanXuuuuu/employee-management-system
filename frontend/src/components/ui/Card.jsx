export default function Card({ title, right, children }) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {(title || right) && (
          <div className="mb-4 flex items-start justify-between gap-3">
            {title && (
              <h2 className="text-lg font-bold text-slate-900">
                {title}
              </h2>
            )}
            {right}
          </div>
        )}
  
        {children}
      </div>
    );
  }
  