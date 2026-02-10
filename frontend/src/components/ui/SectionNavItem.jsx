export default function SectionNavItem({ active, children, onClick }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full rounded-xl px-4 py-4 text-sm font-semibold transition
          ${
            active
              ? "bg-amber-400 text-slate-900"
              : "bg-slate-100 text-slate-800 hover:bg-slate-200"
          }
        `}
      >
        {children}
      </button>
    );
  }
  