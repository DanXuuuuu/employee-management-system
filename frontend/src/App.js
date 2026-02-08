
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import MainLayout from '../src/components/layout/MainLayout';
import Register from "./pages/Register";
import OnboardingPage from "./pages/OnboardingPage";
import HiringManagement from './pages/hr/HiringManagement';
import EmployeeProfiles from "./pages/hr/EmployeeProfiles";
import VisaManagement from './pages/hr/VisaManagement';
import HrHome from './pages/hr/HrHome';
import { useSelector } from "react-redux";


function App() {
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  const role = user?.role;
  const postLoginPath = role === "HR" ? "/hr/hiring": role === "Employee" ? "/employee/visa" : "/login";

  return (
    <BrowserRouter>

      <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
        {/* Public */}
      <Route path="/login" element={ isAuthenticated ?(role ? <Navigate to={postLoginPath} replace /> : <div>Loading...</div>) : <Login />
      }
    />

        <Route path="/register" element={<Register />} />
        <Route path="/onboarding" element={<OnboardingPage />} />


        {/* HR pages */}
        <Route element={<MainLayout/> }>
            <Route path='/hr/home' element={<HrHome />} />
            <Route path='/hr/hiring' element={<HiringManagement />} />
            <Route path='/hr/employees' element={<EmployeeProfiles />}/>
            <Route path='/hr/visa' element={<VisaManagement/>}/>
        </Route>

        {/* HR pages */}
      <Route element={ isAuthenticated && role === "HR" ? <MainLayout /> : <Navigate to="/login" replace />
  }
>
            <Route path='/hr/hiring' element={<HiringManagement />} />
            <Route path='/hr/employees' element={<EmployeeProfiles />}/>
            <Route path='/hr/visa' element={<VisaManagement/>}/>
        </Route>
  {/* for employee group -could be replace later  */}

  <Route element={ isAuthenticated && role === "Employee" ? <MainLayout /> : <Navigate to="/login" replace />
  }
>
  <Route path="/employee/visa" element={<div>Employee Visa Page</div>} />
</Route>
        {/* Protected */}
        {/* <Route element={<ProtectedRoute />}> */}
          {/* <Route path="/personal-info" element={<PersonalInfo />} /> */}
          {/* 以后所有 employee 页面都放这里 */}
        {/* </Route> */}

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
