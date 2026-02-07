
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import MainLayout from '../src/components/layout/MainLayout';
import Register from "./pages/Register";
import HiringManagement from './pages/hr/HiringManagement';
import EmployeeProfiles from "./pages/hr/EmployeeProfiles";
import VisaManagement from './pages/hr/VisaManagement';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* HR pages */}
        <Route element={<MainLayout/> }>
            <Route path='/hr/hiring' element={<HiringManagement />} />
            <Route path='/hr/employees' element={<EmployeeProfiles />}/>
            <Route path='/hr/visa' element={<VisaManagement/>}/>
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
