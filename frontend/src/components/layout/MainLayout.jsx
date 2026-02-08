import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/authSlice";

export default function MainLayout() {
  const { pathname } = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((s) => s.auth);

  const handleLogout = () => {
    const isConfirmed = window.confirm("Are you sure you want to log out? Any unsaved changes may be lost.");
    if (isConfirmed) {
    dispatch(logout()); 
    navigate("/login");
  }
};

  const navLinks = [
    { path: "/hr/home", label: "Home" },
    { path: "/hr/employees", label: "Employee Profiles" },
    { path: "/hr/visa", label: "Visa Status Management" },
    { path: "/hr/hiring", label: "Hiring Management" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="h-14 bg-white shadow flex items-center justify-between px-6 sticky top-0 z-50">
        <h1 className="text-lg font-semibold text-gray-800 shrink-0">
          Employee Management System
        </h1>

        <div className="flex items-center gap-1">
          <nav className="flex items-center gap-1 mr-4 border-r border-gray-200 pr-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  pathname === link.path
                    ? "bg-blue-50 text-blue-600" 
                    : "text-gray-600 hover:bg-gray-100" 
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              Logout
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}