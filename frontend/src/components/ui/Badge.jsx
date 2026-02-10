const VARIANT_MAP = {
    default: "bg-slate-50 text-slate-700 border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
  };
  
  export default function Badge({ children, variant = "default" }) {
    return (
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${VARIANT_MAP[variant]}`}
      >
        {children}
      </span>
    );
  }
  