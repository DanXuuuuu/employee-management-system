
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import OnboardingPage from "./pages/OnboardingPage";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/onboarding" element={<OnboardingPage />} />


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
