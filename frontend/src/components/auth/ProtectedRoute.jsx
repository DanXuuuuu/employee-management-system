import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute() {
  const { isAuthed, isReady } = useAuth();

  if (!isReady) return null; // loading spinner

  return isAuthed ? <Outlet /> : <Navigate to="/login" replace />;
}
