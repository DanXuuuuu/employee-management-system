const STATUS_ICON = {
    ok: "✅",
    missing: "❌",
    info: "ℹ️",
  };
  
  export default function SummaryItem({
    label,
    value,
    status = "info",
  }) {
    return (
      <div className="flex items-center justify-between text-sm">
        <div className="text-slate-700">
          {label}
        </div>
  
        <div className="flex items-center gap-2 text-slate-600">
          {value && <span>{value}</span>}
          <span>{STATUS_ICON[status]}</span>
        </div>
      </div>
    );
  }
  