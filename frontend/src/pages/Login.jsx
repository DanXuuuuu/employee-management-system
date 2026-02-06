import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import AuthPage from "../components/auth/AuthPage";
import AuthCard from "../components/auth/AuthCard";
import TextField from "../components/ui/TextField";
import Button from "../components/ui/Button";
import login from "../store/authSlice";

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated} = useSelector((s) => s.auth);

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setLocalError] = useState("");

  useEffect(() => {
    if (isAuthenticated) navigate("/personal-info");
  }, [isAuthenticated, navigate]);

  const onChange = (e) => {
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }))
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setLocalError("");

    const email = form.email.trim();
    const password = form.password;

    if (!email || !password) {
      return setLocalError("Please enter email and password.");
    }

    dispatch(login({ email, password }));
  };

  return (
    <AuthPage showSide={true}>
      <AuthCard title="Login" subtitle="Login to your account.">
        <form onSubmit={onSubmit} className="space-y-4">
          <TextField
            label="E-mail Address"
            name="email"
            value={form.email}
            onChange={onChange}
            placeholder="prefix@mail.com"
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            placeholder="••••••••"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button>Sign In</Button>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <Link to="/reset-password" className="font-semibold text-blue-900 hover:underline">
              Reset Password?
            </Link>
            <span>
              Need an account?{" "}
              <span className="font-semibold">Ask HR for invite link</span>
            </span>
          </div>
        </form>
      </AuthCard>
    </AuthPage>
  );
}
