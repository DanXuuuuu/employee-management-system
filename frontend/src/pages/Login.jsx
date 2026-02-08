import { Link } from "react-router-dom";
import { useState } from "react";
import { useDispatch } from "react-redux";

import AuthPage from "../components/auth/AuthPage";
import AuthCard from "../components/auth/AuthCard";
import TextField from "../components/ui/TextField";
import Button from "../components/ui/Button";
import { login, clearSignInError, logout } from "../store/authSlice";

export default function Login() {
 
  const dispatch = useDispatch();
  const { isAuthenticated, user, signIn } = useSelector((s) => s.auth);

 
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setLocalError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // 核心修复：根据角色跳转
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'HR') {
        navigate("/hr/home"); // 文档要求的 HR 首页
      } else {
        // 如果是非 HR 账号，给个提示或者直接退出
        alert("Employee side is currently disabled for maintenance.");
        dispatch(logout()); // 强制登出防止卡在白屏
      }
    }
  }, [isAuthenticated, user, navigate, dispatch]);

  // 监听 Redux 登录错误并同步到本地 state
  useEffect(() => {
    if (signIn.error) {
      setLocalError(signIn.error);
      // 可选：清除 redux 中的错误以防下次进入页面直接显示报错
      return () => dispatch(clearSignInError());
    }
  }, [signIn.error, dispatch]);

  const onChange = (e) => {
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }))
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const email = form.email.trim();
    const password = form.password;

    if (!email || !password) {
      return setLocalError("Please provide email and password");
    }

    dispatch(login({ email, password }));
  };

  return (
    <AuthPage showSide={true}>
      <AuthCard title="Sign In" subtitle="Login to your account.">
        <form onSubmit={onSubmit} className="space-y-4">
          <TextField
            label="E-mail Address"
            name="email"
            value={form.email}
            onChange={onChange}
            placeholder="prefix@mail.com"
          />
          <div className="relative">
          <TextField
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={onChange}
            placeholder="••••••••"
          />
          <button
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              {showPassword ? (
   
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.644C3.67 8.5 7.652 6 12 6c4.348 0 8.332 2.5 9.964 5.678a1.012 1.012 0 0 1 0 .644C20.33 15.5 16.348 18 12 18c-4.348 0-8.332-2.5-9.964-5.678Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          ) : (
    
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
              )}
            </button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button disabled={signIn.loading}>
            {signIn.loading ? "Signing In..." : "Sign In"}
          </Button>

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
