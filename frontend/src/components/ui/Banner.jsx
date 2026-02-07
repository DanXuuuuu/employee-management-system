const STYLE_MAP = {
    pending: "border-amber-200 bg-amber-50 text-amber-900",
    rejected: "border-rose-200 bg-rose-50 text-rose-900",
    info: "border-slate-200 bg-slate-50 text-slate-800",
  };
  
  export default function Banner({ type = "info", title, message }) {
    return (
      <div
        className={`rounded-xl border p-4 text-sm ${STYLE_MAP[type]}`}
      >
        {title && (
          <div className="font-semibold mb-1">
            {title}
          </div>
        )}
        <div>{message}</div>
      </div>
    );
  }
  