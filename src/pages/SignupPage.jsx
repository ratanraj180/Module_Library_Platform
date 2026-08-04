import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { Eye, EyeOff, ArrowRight, Lock, Mail, User, CheckCircle2 } from "lucide-react";
import { Logo } from "../components/shared/Logo";

export function SignupPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Full name is required";
    if (!form.username.trim()) errs.username = "Username is required";

    if (!form.email.trim()) {
      errs.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errs.email = "Enter a valid email address";
    }

    if (!form.password) {
      errs.password = "Password is required";
    } else if (form.password.length < 8) {
      errs.password = "Password must be at least 8 characters";
    }

    if (!form.confirmPassword) {
      errs.confirmPassword = "Confirm password is required";
    } else if (form.password !== form.confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || isSuccess) return;

    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setApiError("");
    setLoading(true);

    try {
      const { createUserWithEmailAndPassword, deleteUser, signOut } = await import("firebase/auth");
      const { auth } = await import("../firebase/firebase");

      let firebaseUser = null;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
        firebaseUser = userCredential.user;

        await api.post("/api/auth/signup", {
          name: form.name,
          email: form.email,
          password: form.password,
        });

        await signOut(auth);
        setIsSuccess(true);
        setTimeout(() => navigate("/login"), 2000);
      } catch (err) {
        if (firebaseUser) {
          try {
            await deleteUser(firebaseUser);
          } catch (deleteErr) {
            console.error("Failed to roll back Firebase user after signup error:", deleteErr);
          }
        }

        if (err.code === "auth/email-already-in-use") {
          setApiError("This email is already registered. Try signing in instead.");
        } else if (err.code?.startsWith("auth/")) {
          setApiError(err.message || "Failed to create authentication account.");
        } else {
          setApiError(err.message || "Registration failed. Please try again.");
        }
      }
    } catch (err) {
      setApiError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Background */}
      <div className="absolute inset-0 bg-hero-grid bg-grid opacity-30" />
      <div className="hero-orb-1 -top-20 -right-20" style={{ opacity: 0.2 }} />
      <div className="hero-orb-2 bottom-0 -left-20" style={{ opacity: 0.15 }} />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md animate-scale-in">
        {/* Glowing border effect */}
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-gold-500/20 via-transparent to-gold-200/10 blur-sm" />

        <div className="glass-card relative rounded-2xl p-8">
          {isSuccess ? (
            /* Success State */
            <div className="flex flex-col items-center gap-6 py-6 text-center animate-fade-in">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/25">
                <CheckCircle2 size={32} className="text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-foreground">Account Created!</h1>
                <p className="mt-2 text-sm text-muted-foreground px-4">
                  Your registration passed frontend validation successfully.
                </p>
              </div>
              <button
                onClick={() => navigate("/login")}
                className="btn-primary w-full py-3 text-sm mt-4"
              >
                Go to Sign In
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            /* Signup Form State */
            <>
              {/* Logo & heading */}
              <div className="mb-8 flex flex-col items-center gap-4 text-center">
                <Logo size="lg" />
                <div>
                  <h1 className="text-2xl font-black text-foreground">Create Your Account</h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Join the community and start exploring modules, resources, and documentation.
                  </p>
                </div>
              </div>

              {/* Form */}
              <form id="signup-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Full Name */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="signup-name" className="text-sm font-medium text-foreground">
                    Full Name
                  </label>
                  <div className="relative">
                    <User
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      id="signup-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className={`input-field pl-9 ${errors.name ? "border-red-500 focus:ring-red-500/20 focus:border-red-500" : ""}`}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-red-400">{errors.name}</p>
                  )}
                </div>

                {/* Username */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="signup-username" className="text-sm font-medium text-foreground">
                    Username
                  </label>
                  <div className="relative">
                    <User
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      id="signup-username"
                      type="text"
                      placeholder="Choose a username"
                      value={form.username}
                      onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                      className={`input-field pl-9 ${errors.username ? "border-red-500 focus:ring-red-500/20 focus:border-red-500" : ""}`}
                    />
                  </div>
                  {errors.username && (
                    <p className="text-xs text-red-400">{errors.username}</p>
                  )}
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="signup-email" className="text-sm font-medium text-foreground">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className={`input-field pl-9 ${errors.email ? "border-red-500 focus:ring-red-500/20 focus:border-red-500" : ""}`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-400">{errors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="signup-password" className="text-sm font-medium text-foreground">
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      className={`input-field pl-9 pr-10 ${errors.password ? "border-red-500 focus:ring-red-500/20 focus:border-red-500" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-400">{errors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="signup-confirm-password" className="text-sm font-medium text-foreground">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      id="signup-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={form.confirmPassword}
                      onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                      className={`input-field pl-9 pr-10 ${errors.confirmPassword ? "border-red-500 focus:ring-red-500/20 focus:border-red-500" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-400">{errors.confirmPassword}</p>
                  )}
                </div>


                {/* API error */}
                {apiError && (
                  <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-400">
                    {apiError}
                  </div>
                )}

                {/* Submit */}
                <button
                  id="signup-submit"
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 text-sm mt-2"
                >
                  {loading ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Creating Account…
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              {/* Redirect to login */}
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-medium text-gold-300 hover:text-gold-200 transition-colors"
                >
                  Log In
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
