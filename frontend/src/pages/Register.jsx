import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import AuthPage from "../components/auth/AuthPage";
import AuthCard from "../components/auth/AuthCard";
import TextField from "../components/ui/TextField";
import Button from "../components/ui/Button";
import useInvite from "../hooks/useInvite";


import { signup, clearSignUpStatus } from "../store/authSlice";


export default function Register() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const invite = useInvite(); 
    const signUp = useSelector((s) => s.auth.signUp);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [localError, setLocalError] = useState("");


  useEffect(() => {
    if (invite.valid && invite.name) {
      setForm((s) => ({
        ...s,
        username: invite.name.replace(/\s+/g, "").toLowerCase(),
      }));
    }
  }, [invite.valid, invite.name]);

  useEffect(() => {
    if (signUp.success) {
      dispatch(clearSignUpStatus());
      navigate("/login");
    }
  }, [signUp.success, dispatch, navigate]);

  const onChange = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    setLocalError("");

    if (!invite.token) return setLocalError("Missing invite token.");
    if (!invite.valid) return setLocalError(invite.error || "Invalid invite link.");

    if (!form.username.trim() || !form.password || !form.confirmPassword) {
      return setLocalError("Please complete all fields.");
    }
    if (form.password !== form.confirmPassword) {
      return setLocalError("Passwords do not match.");
    }

    dispatch(
      signup({
        token: invite.token,
        username: form.username.trim(),
        email: invite.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
      })
    );
  };

  return (
    <AuthPage showSide={true}>
    <AuthCard title="Create Account" subtitle="Complete your registration.">
      {invite.loading ? (
        <p className="text-sm text-slate-600">Validating invite link...</p>
      ) : !invite.valid ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-red-600">
            {invite.error || "Invalid or expired invite link."}
          </p>
          <p className="text-xs text-slate-500">Please contact HR to request a new one.</p>
          <Link to="/login" className="text-xs font-semibold text-blue-900 hover:underline">
            Back to Login
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <TextField
            label="Username"
            name="username"
            value={form.username}
            onChange={onChange}
          />

          <TextField
            label="E-mail Address"
            name="email"
            value={invite.email}
            onChange={() => {}}
            readOnly={true}
          />

          <TextField
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
          />

          <TextField
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={onChange}
          />

          {(localError || signUp.error) && (
            <p className="text-sm text-red-600">{localError || signUp.error}</p>
          )}

          <Button disabled={signUp.loading}>
            {signUp.loading ? "Creating..." : "Create Account"}
          </Button>

          <p className="text-xs text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-blue-900 hover:underline">
              Log In
            </Link>
          </p>
        </form>
      )}
    </AuthCard>
  </AuthPage>
);
}
