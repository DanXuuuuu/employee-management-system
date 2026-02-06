export default function AuthPage({ children, showSide = true }) {
    return (
      <div className="min-h-screen bg-slate-50 flex">
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          {children}
        </div>
  
        {showSide && (
          <div className="hidden lg:block lg:w-[42%] relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-800" />
            <div className="relative z-10 h-full p-10 flex flex-col justify-end text-white">
              <div className="text-2xl font-extrabold tracking-wide">Chuwa</div>
              <p className="mt-3 text-sm text-white/80 max-w-sm">
                HR Management Platform — secure onboarding & employee self-service.
              </p>
              <div className="mt-8 flex gap-2">
                <div className="h-1.5 w-10 rounded bg-yellow-400" />
                <div className="h-1.5 w-10 rounded bg-white/50" />
                <div className="h-1.5 w-10 rounded bg-white/20" />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  