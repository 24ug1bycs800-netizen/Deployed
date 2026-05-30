import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { Film, User, Mail, Lock, AlertCircle, Loader } from "lucide-react";

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = (location.state as any)?.from || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, fullName);
      }
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          "Authentication failed. Please verify credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#080808] font-poppins relative">
      {/* DECORATIVE CINEMATIC BLURS */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-primary opacity-5 blur-[120px]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent opacity-5 blur-[120px]"></div>

      <div className="w-full max-w-md p-8 rounded-2xl bg-card border border-gray-700 shadow-premium relative z-10">
        {/* LOGO */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <Film className="w-10 h-10 text-primary text-premium-card" />
          <h2 className="text-2xl font-bold tracking-wider text-white">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-xs text-muted font-inter">
            {isLogin
              ? "Access your CineCircle cinematic portal"
              : "Start collaborative planning with friends"}
          </p>
        </div>

        {/* ERROR BOX */}
        {error && (
          <div className="mb-6 p-4 bg-error bg-opacity-10 border border-error border-opacity-30 rounded-xl flex items-center gap-2.5 text-sm text-red-400 font-inter">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4 font-inter text-sm">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-muted mb-2 font-poppins">
                FULL NAME
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-muted" />
                <input
                  type="text"
                  required
                  placeholder="Enter full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl focus:border-primary focus:outline-none text-white text-sm transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-muted mb-2 font-poppins">
              EMAIL ADDRESS
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-muted" />
              <input
                type="email"
                required
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl focus:border-primary focus:outline-none text-white text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted mb-2 font-poppins">
              PASSWORD
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-muted" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl focus:border-primary focus:outline-none text-white text-sm transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-secondary text-white font-bold font-poppins rounded-xl flex items-center justify-center gap-2 shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : isLogin ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* TOGGLE */}
        <div className="mt-6 text-center text-xs text-muted font-inter">
          <span>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="text-primary font-bold hover:underline font-poppins"
          >
            {isLogin ? "Create one" : "Sign in here"}
          </button>
        </div>
      </div>
    </div>
  );
};
