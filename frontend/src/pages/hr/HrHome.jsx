
export default function HrHome() {
  return (
    <div className="space-y-6">

      <div className="relative bg-[#1a2b6d] rounded-2xl overflow-hidden p-12 text-white shadow-xl">
        <div className="relative z-10 max-w-lg">
          <h2 className="text-4xl font-bold mb-4">
            Manage <span className="text-yellow-400">All</span> HR Operations
          </h2>
          <p className="text-slate-300">
            A relaxed HR lead is a performing team. Monitor applications and visa status in real-time.
          </p>
        </div>
    
        <div className="absolute right-10 bottom-0 opacity-20 text-[120px]">🏢</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-slate-500 text-sm font-medium">Total Employees</h3>
          <p className="text-3xl font-bold text-slate-900 mt-2">128</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-slate-500 text-sm font-medium">Pending Onboarding</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">12</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-slate-500 text-sm font-medium">Visa Action Required</h3>
          <p className="text-3xl font-bold text-rose-600 mt-2">5</p>
        </div>
      </div>
    </div>
  );
}