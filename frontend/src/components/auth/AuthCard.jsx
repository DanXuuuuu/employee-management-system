export default function AuthCard({ title, subtitle, children }) {
    return (
      <div className="w-full max-w-[460px] bg-white rounded-xl shadow-sm border border-slate-200 px-7 py-8">
        <h1 className="text-2xl font-extrabold text-blue-900">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
    );
  }
  