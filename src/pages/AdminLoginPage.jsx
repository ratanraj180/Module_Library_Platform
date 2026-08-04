import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, ShieldAlert, Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "../components/ui/index";
import { Logo } from "../components/shared/Logo";
import { useAuth } from "../hooks/useAuth";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = "Admin email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Enter a valid email";
    
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 6) errs.password = "Password must be at least 6 characters";
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
    const ok = await login(form.email, form.password);
    if (ok) navigate("/dashboard");
  };

  const autofillAdmin = () => {
    setForm({
      email: "admin@modulelib.dev",
      password: "password",
    });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 bg-background">
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(212,166,79,0.15) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-gold-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-gold-600/5 blur-[120px] pointer-events-none" />

      {/* Card Wrapper */}
      <div className="relative z-10 w-full max-w-md animate-scale-in">
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-gold-500/20 via-transparent to-gold-200/10 blur-sm" />

        <div className="glass-card relative rounded-2xl p-8 bg-card/90 border border-white/[0.06] backdrop-blur-md">
          {/* Badge & header */}
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-500/10 border border-gold-500/20 text-gold-300">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Admin Portal Access</h1>
              <p className="mt-1 text-xs text-muted-foreground">
                Sign in to manage compliance, pipelines, and registries.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            
            {/* Email field */}
            <div className="flex flex-col gap-1.5 text-xs">
              <label htmlFor="admin-email" className="text-muted-foreground font-semibold">
                Administrator Email
              </label>
              <div className="relative">
                <Mail
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50"
                />
                <input
                  id="admin-email"
                  type="email"
                  placeholder="admin@modulelib.dev"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className={`w-full h-9 pl-9 pr-3 rounded-lg bg-background border border-border focus:ring-1 focus:ring-gold-500 focus:outline-none text-foreground ${
                    errors.email ? "border-red-500" : ""
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-[10px] text-red-400 mt-0.5">{errors.email}</p>
              )}
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-1.5 text-xs">
              <div className="flex items-center justify-between">
                <label htmlFor="admin-password" className="text-muted-foreground font-semibold">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50"
                />
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className={`w-full h-9 pl-9 pr-10 rounded-lg bg-background border border-border focus:ring-1 focus:ring-gold-500 focus:outline-none text-foreground ${
                    errors.password ? "border-red-500" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[10px] text-red-400 mt-0.5">{errors.password}</p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-[11px] pt-1">
              <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border border-border bg-background checked:bg-gold-500 checked:border-gold-500 focus:ring-0 cursor-pointer h-3.5 w-3.5"
                />
                Remember this device
              </label>
              <Link to="/" className="text-gold-300 hover:underline">
                Back to Home
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              loading={loading}
              variant="primary"
              size="sm"
              className="w-full text-xs font-bold py-2.5 h-10 shadow-[0_2px_10px_rgba(212,166,79,0.15)]"
            >
              Sign In to Staged Console
              <ArrowRight size={14} />
            </Button>
          </form>

          {/* Credentials Helper Section */}
          <div className="mt-6 border-t border-white/[0.04] pt-4 text-center">
            <button
              onClick={autofillAdmin}
              className="w-full p-3 rounded-lg border border-gold-500/15 bg-gold-500/[0.02] hover:bg-gold-500/[0.05] transition-all text-left flex items-start gap-2.5 group"
            >
              <ShieldCheck size={16} className="text-gold-300 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="block text-[11px] font-bold text-foreground leading-none">Auto-fill Admin Sandbox</span>
                <span className="block text-[10px] text-muted-foreground/60 mt-1 truncate">
                  email: <code className="text-gold-200">admin@modulelib.dev</code>
                </span>
                <span className="block text-[10px] text-muted-foreground/60 mt-0.5 truncate">
                  password: <code className="text-gold-200">password</code>
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
