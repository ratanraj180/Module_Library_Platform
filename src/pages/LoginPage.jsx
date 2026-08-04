import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, Lock, Mail, X } from "lucide-react";
import { Logo } from "../components/shared/Logo";
import { useAuth } from "../hooks/useAuth";
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, sendPasswordReset, loading } = useAuth();
  const [form, setForm] = useState({
    email: location.state?.email || "",
    password: location.state?.password || ""
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Enter a valid email";
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 8) errs.password = "Password must be at least 8 characters";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setApiError("");
    console.log('[LOGIN] Submitting with email:', form.email, '| password length:', form.password.length);
    const result = await login(form.email, form.password);
    console.log('[LOGIN] Result from useAuth.login:', result);
    if (result.ok) {
      const savedRedirect = sessionStorage.getItem("redirectAfterLogin");
      const from = savedRedirect || location.state?.from || "/dashboard";
      sessionStorage.removeItem("redirectAfterLogin");
      navigate(from, { replace: true });
    } else {
      setApiError(result.error || "Login failed. Please try again.");
    }
  };

  const handleGoogleSignIn = async () => {
    setErrors({});
    setApiError("");
    const result = await loginWithGoogle();
    if (result.ok) {
      const savedRedirect = sessionStorage.getItem("redirectAfterLogin");
      const from = savedRedirect || location.state?.from || "/dashboard";
      sessionStorage.removeItem("redirectAfterLogin");
      navigate(from, { replace: true });
    } else {
      setApiError(result.error || "Google Sign-In failed.");
    }
  };


  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetSuccess("");
    
    if (!resetEmail) {
      setResetError("Email is required");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(resetEmail)) {
      setResetError("Enter a valid email address");
      return;
    }
    
    setResetLoading(true);
    const res = await sendPasswordReset(resetEmail);
    setResetLoading(false);
    if (res.ok) {
      setResetSuccess("Password reset link sent! Check your inbox.");
      setResetEmail("");
    } else {
      setResetError(res.error || "Failed to send reset link.");
    }
  };
  // Demo credentials
  const demoUsers = [
    { role: "Developer", email: "dev@test.com", password: "password123" },
    { role: "Admin", email: "admin@test.com", password: "password123" },
  ];

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#FAFAFA] text-[#111827] px-4 py-12 font-sans">
      <div className="relative z-10 w-full max-w-md bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        {/* Logo & heading */}
        <div className="mb-6 flex flex-col items-center gap-4 text-center">
          <Logo size="lg" />
          <div>
            <h1 className="text-xl font-bold text-[#111827]">Welcome back</h1>
            <p className="mt-1 text-xs text-gray-500">
              Sign in to your ModuleLib account
            </p>
          </div>
        </div>

        {/* Redirect Message notice */}
        {location.state?.message && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-700">
            {location.state.message}
          </div>
        )}

        <form id="login-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div className="flex flex-col gap-1">
              <label htmlFor="login-email" className="text-xs font-semibold text-gray-700">
                Email address
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="login-email"
                  type="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className={`w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-xs text-[#111827] focus:outline-none focus:border-[#D4A017] ${errors.email ? "border-red-500" : ""}`}
                />
              </div>
              {errors.email && <p className="text-[10px] text-red-500">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="text-xs font-semibold text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowResetModal(true)}
                  className="text-[10px] font-semibold text-[#D4A017] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className={`w-full bg-white border border-gray-200 rounded-lg pl-9 pr-10 py-2 text-xs text-[#111827] focus:outline-none focus:border-[#D4A017] ${errors.password ? "border-red-500" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && <p className="text-[10px] text-red-500">{errors.password}</p>}
            </div>

            {/* API error */}
            {apiError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-[11px] text-red-600">
                {apiError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#111827] hover:bg-black text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
              <ArrowRight size={14} />
            </button>
        </form>

        <div className="my-4 flex items-center justify-between gap-2">
          <div className="h-px bg-gray-200 flex-1"></div>
          <span className="text-[10px] text-gray-400 uppercase font-semibold">Or</span>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 0, 0)">
                <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.57h3.29c1.93,-1.78 3.04,-4.4 3.04,-7.48c0,-0.61 -0.06,-1.2 -0.16,-1.78z" fill="#4285F4" />
                <path d="M12,20.73c2.7,0 4.96,-0.9 6.62,-2.42l-3.29,-2.57c-0.91,0.61 -2.07,0.98 -3.33,0.98c-2.57,0 -4.75,-1.74 -5.52,-4.07H3.1v2.66c1.64,3.27 5.03,5.42 8.9,5.42z" fill="#34A853" />
                <path d="M6.48,12.72c-0.2,-0.61 -0.31,-1.27 -0.31,-1.94c0,-0.67 0.11,-1.33 0.31,-1.94V6.18H3.1A8.99,8.99 0 0,0 2,10.78c0,1.72 0.49,3.33 1.1,4.6L6.48,12.72z" fill="#FBBC05" />
                <path d="M12,5.2c1.47,0 2.78,0.51 3.82,1.5l2.87,-2.87C16.96,2.15 14.7,1.27 12,1.27c-3.87,0 -7.26,2.15 -8.9,5.42L6.48,9.35c0.77,-2.33 2.95,-4.07 5.52,-4.07z" fill="#EA4335" />
              </g>
            </svg>
            Continue with Google
          </button>
        </div>

        <div className="mt-6 border-t border-gray-150 pt-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Quick Demo Access</p>
          <div className="grid grid-cols-2 gap-2">
            {demoUsers.map((user) => (
              <button
                key={user.role}
                type="button"
                onClick={() => setForm({ email: user.email, password: user.password })}
                className="flex flex-col items-start p-2 rounded-lg border border-gray-200 hover:border-[#D4A017] bg-gray-50 text-left transition-colors"
              >
                <span className="text-[10px] font-bold text-[#111827]">{user.role} Profile</span>
                <span className="text-[9px] text-gray-500 truncate w-full">{user.email}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Register link */}
        <p className="mt-6 text-center text-xs text-gray-500">
          Don't have an account?{" "}
          <Link to="/signup" className="font-semibold text-[#D4A017] hover:underline">
            Register for free
          </Link>
        </p>
      </div>

      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl p-6 shadow-xl text-left">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#111827]">Reset your password</h3>
              <button
                type="button"
                onClick={() => {
                  setShowResetModal(false);
                  setResetError("");
                  setResetSuccess("");
                  setResetEmail("");
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">
              Enter your registered email address and we'll send you a link to reset your password.
            </p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="reset-email" className="text-xs font-semibold text-gray-700">
                  Email address
                </label>
                <input
                  id="reset-email"
                  type="email"
                  placeholder="you@company.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-[#111827] focus:outline-none focus:border-[#D4A017]"
                />
              </div>
              {resetError && <div className="text-[10px] text-red-500">{resetError}</div>}
              {resetSuccess && <div className="text-[10px] text-emerald-600 font-semibold">{resetSuccess}</div>}
              <button
                type="submit"
                disabled={resetLoading}
                className="w-full bg-[#111827] hover:bg-black text-white py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
              >
                {resetLoading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
