import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import MainLayout from "./components/layout/MainLayout";

import Register from "./pages/Register";
import OnboardingPage from "./pages/OnboardingPage";
import PersonalInfo from "./pages/PersonalInfo";
import VisaStatusManagementPage from "./pages/VisaStatusManagementPage"
import HiringManagement from './pages/hr/HiringManagement';
import EmployeeProfiles from "./pages/hr/EmployeeProfiles";
import VisaManagement from './pages/hr/VisaManagement';
import HrHome from './pages/hr/HrHome';
import { restoreSession } from "./store/authSlice";
import { useSelector,useDispatch } from "react-redux";
import { useEffect } from "react";

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user, restore } = useSelector((s) => s.auth);
  const role = user?.role;
  const onboardingStatus = useSelector(s => s.onboarding.applicationStatus); 
  
  const getPostLoginPath = () => {
    if (role === "HR") return "/hr/home";
    if (role === "Employee") {
      return onboardingStatus === "APPROVED" ? "/personal-info" : "/onboarding";
    }
    return "/login";
  };

  useEffect(() => {
    // after refresh, verify token and restore user
    dispatch(restoreSession());
  }, [dispatch]);
  
  if (restore.loading) {
    return <div>Loading...</div>; 
  }
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
        <Route element={isAuthenticated && user && role === "HR" ? <MainLayout /> : <Navigate to="/login" replace />}>
          <Route path='/hr/home' element={<HrHome />} />
          <Route path='/hr/hiring' element={<HiringManagement />} />
          <Route path='/hr/employees' element={<EmployeeProfiles />} />
          <Route path='/hr/visa' element={<VisaManagement />} />
        </Route>

      {/* --- Employee Protected Group --- */}
    <Route element={isAuthenticated && user && role === "Employee" ? <MainLayout /> : <Navigate to="/login" replace />}>
      <Route
        path="/personal-info"
        element={
          onboardingStatus === "APPROVED"
            ? <PersonalInfo />
            : <Navigate to="/onboarding" replace />
        }
      />

      <Route
        path="/onboarding"
        element={
          onboardingStatus === "APPROVED"
            ? <Navigate to="/personal-info" replace />
            : <OnboardingPage />
        }
      />

      <Route path="/employee/visa" element={<Navigate to="/visa-status" replace />} />
      <Route path="/visa-status" element={<VisaStatusManagementPage />} />

    </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;