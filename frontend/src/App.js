
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import MainLayout from '../src/components/layout/MainLayout';
import Register from "./pages/Register";
import OnboardingPage from "./pages/OnboardingPage";
import PersonalInfo from "./pages/PersonalInfo";
import HiringManagement from './pages/hr/HiringManagement';
import EmployeeProfiles from "./pages/hr/EmployeeProfiles";
import VisaManagement from './pages/hr/VisaManagement';
import HrHome from './pages/hr/HrHome';
import { useSelector } from "react-redux";


function App() {
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  const role = user?.role;
  const onboardingStatus = user?.applicationStatus;
  const getPostLoginPath = () => {
    if (role === "HR") return "/hr/home";
    if (role === "Employee") {
      return onboardingStatus === "Approved" ? "/personal-info" : "/onboarding";
    }
    return "/login";
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Public Routes */}
        <Route path="/login" element={
          isAuthenticated ? <Navigate to={getPostLoginPath()} replace /> : <Login />
        } />
        <Route path="/register" element={<Register />} />

        {/* --- HR Protected Group --- */}
        <Route element={isAuthenticated && role === "HR" ? <MainLayout /> : <Navigate to="/login" replace />}>
          <Route path='/hr/home' element={<HrHome />} />
          <Route path='/hr/hiring' element={<HiringManagement />} />
          <Route path='/hr/employees' element={<EmployeeProfiles />} />
          <Route path='/hr/visa' element={<VisaManagement />} />
        </Route>

        {/* --- Employee Protected Group --- */}
        <Route element={isAuthenticated && role === "Employee" ? <MainLayout /> : <Navigate to="/login" replace />}>
          <Route path="/personal-info" element={
            onboardingStatus === "Approved" ? <PersonalInfo /> : <Navigate to="/onboarding" replace />
          } />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/employee/visa" element={<div>Employee Visa Page</div>} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;