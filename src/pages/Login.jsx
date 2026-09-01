import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import GoogleIcon from "@/components/GoogleIcon";

function getAuthErrorMessage(error) {
  if (!error) return "Unable to sign in. Please try again.";

  const code = error.code;
  const status = error.status;
  const message = error.message?.toLowerCase() || "";

  if (
    code === "invalid_credentials" ||
    message.includes("invalid login credentials")
  ) {
    return "Email or password is incorrect.";
  }

  if (
    code === "email_not_confirmed" ||
    message.includes("email not confirmed")
  ) {
    return "Please verify your email before signing in.";
  }

  if (
    status === 429 ||
    code === "over_request_rate_limit" ||
    code === "over_email_send_rate_limit"
  ) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  return "Unable to sign in right now. Please try again.";
}

const fieldClassName = `
  h-12 rounded-xl border bg-white pl-11 pr-4 text-sm shadow-none
  transition-[border-color,box-shadow,background-color]
  placeholder:text-zinc-400 hover:border-[var(--accent-border)]
  focus-visible:border-[var(--accent)] focus-visible:ring-2
  focus-visible:ring-[var(--accent-bg)] disabled:bg-zinc-50
`;

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm"
        style={{ backgroundColor: "var(--accent)" }}
      >
        <span className="text-sm font-semibold">D</span>
      </div>
      <div>
        <p className="text-sm font-semibold tracking-tight text-zinc-950">
          Document Control
        </p>
        <p className="text-[11px] text-zinc-500">Secure workspace</p>
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoadingAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [error, setError] = useState("");

  const isBusy = activeAction !== null;
  const isFormDisabled = isBusy || isLoadingAuth;

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isFormDisabled) return;

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setError("");
    setActiveAction("password");

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (authError) throw authError;
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Password sign-in failed:", err);
      setError(getAuthErrorMessage(err));
    } finally {
      setActiveAction(null);
    }
  };

  const handleGoogle = async () => {
    if (isFormDisabled) return;

    setError("");
    setActiveAction("google");

    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/` },
      });

      if (authError) throw authError;
    } catch (err) {
      console.error("Google sign-in failed:", err);
      setError(getAuthErrorMessage(err));
      setActiveAction(null);
    }
  };

  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <div className="grid min-h-screen lg:grid-cols-[minmax(380px,0.92fr)_1.08fr]">
        <aside
          className="relative hidden overflow-hidden border-r lg:flex lg:flex-col lg:justify-between lg:px-14 lg:py-12 xl:px-20 xl:py-16"
          style={{
            backgroundColor: "var(--accent-bg)",
            borderColor: "var(--accent-border)",
          }}
        >
          <div
            className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full opacity-20 blur-3xl"
            style={{ backgroundColor: "var(--accent)" }}
          />
          <div
            className="pointer-events-none absolute -bottom-36 -left-28 h-96 w-96 rounded-full opacity-10 blur-3xl"
            style={{ backgroundColor: "var(--accent)" }}
          />

          <div className="relative z-10">
            <BrandMark />
          </div>

          <div className="relative z-10 max-w-xl">
            <span
              className="mb-6 inline-flex items-center gap-2 rounded-full border bg-white/70 px-3 py-1.5 text-xs font-medium backdrop-blur"
              style={{
                color: "var(--accent)",
                borderColor: "var(--accent-border)",
              }}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Workspace access
            </span>

            <h1 className="max-w-lg text-[44px] font-semibold leading-[1.06] tracking-[-0.045em] xl:text-[56px]">
              Everything you need,
              <br />
              in one workspace.
            </h1>

            <p className="mt-6 max-w-md text-[15px] leading-7 text-zinc-600">
              Manage documents, requests and responsibilities without losing
              track of what matters.
            </p>

            <div className="mt-9 grid max-w-md gap-3 text-sm text-zinc-700">
              {[
                "Simple document tracking",
                "Secure account access",
                "Clear team ownership",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full"
                    style={{
                      color: "var(--accent)",
                      backgroundColor: "rgba(255,255,255,.72)",
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between text-xs text-zinc-500">
            <span>Protected by secure authentication</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </aside>

        <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:px-12 xl:px-20">
          <div className="w-full max-w-[440px]">
            <div className="mb-10 lg:hidden">
              <BrandMark />
            </div>

            <div className="mb-8 flex items-start justify-between gap-4">
              <header>
                <p
                  className="mb-2 text-xs font-semibold uppercase tracking-[0.16em]"
                  style={{ color: "var(--accent)" }}
                >
                  Welcome back
                </p>
                <h2 className="text-3xl font-semibold tracking-[-0.035em] sm:text-[36px]">
                  Sign in to continue
                </h2>
                <p className="mt-3 text-sm leading-6 text-zinc-500">
                  Use your work email or continue with Google.
                </p>
              </header>

              {isLoadingAuth && (
                <div
                  className="mt-1 flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] text-zinc-500"
                  style={{ borderColor: "var(--accent-border)" }}
                  role="status"
                  aria-live="polite"
                >
                  <Loader2
                    className="h-3 w-3 animate-spin"
                    style={{ color: "var(--accent)" }}
                  />
                  Session
                </div>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={isFormDisabled}
              onClick={handleGoogle}
              className="h-12 w-full rounded-xl bg-white font-medium shadow-none transition-[border-color,background-color,box-shadow] hover:bg-zinc-50"
              style={{ borderColor: "var(--accent-border)" }}
            >
              {activeAction === "google" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <GoogleIcon className="mr-2 h-5 w-5" />
                  Continue with Google
                </>
              )}
            </Button>

            <div className="relative my-6">
              <div
                className="absolute inset-0 flex items-center"
                aria-hidden="true"
              >
                <div className="w-full border-t border-zinc-100" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-400">
                  or continue with email
                </span>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                aria-live="assertive"
                className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="leading-5">{error}</span>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
              aria-busy={isBusy}
            >
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-[13px] font-medium text-zinc-800"
                >
                  Email address
                </Label>
                <div className="group relative">
                  <Mail
                    className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-[var(--accent)]"
                    aria-hidden="true"
                  />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="name@company.com"
                    value={email}
                    disabled={isFormDisabled}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (error) setError("");
                    }}
                    className={fieldClassName}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <Label
                    htmlFor="password"
                    className="text-[13px] font-medium text-zinc-800"
                  >
                    Password
                  </Label>
                  <Link
                    to="/forgot-password"
                    className="rounded-sm text-xs font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                    style={{ color: "var(--accent)" }}
                  >
                    | Forgot password?
                  </Link>
                </div>

                <div className="group relative">
                  <Lock
                    className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-[var(--accent)]"
                    aria-hidden="true"
                  />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    disabled={isFormDisabled}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (error) setError("");
                    }}
                    className={`${fieldClassName} pr-12`}
                    required
                  />
                  <button
                    type="button"
                    disabled={isFormDisabled}
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-400 transition-[color,background-color] hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isFormDisabled || !email.trim() || !password}
                className="group h-12 w-full rounded-xl text-white shadow-none transition-[transform,filter,opacity] hover:brightness-95 active:scale-[0.995] disabled:opacity-50"
                style={{ backgroundColor: "var(--accent)" }}
              >
                {activeAction === "password" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <span className="flex items-center">
                    Sign in
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                )}
              </Button>
            </form>

            <p className="mt-7 text-center text-sm text-zinc-500">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="rounded-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                style={{ color: "var(--accent)" }}
              >
                Create account
              </Link>
            </p>

            <div className="mt-10 flex items-center justify-center gap-2 text-[11px] text-zinc-400 lg:hidden">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure access · © {new Date().getFullYear()}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
