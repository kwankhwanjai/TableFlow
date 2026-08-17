import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Mail,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

import GoogleIcon from "@/components/GoogleIcon";

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

function getAuthErrorMessage(error) {
  if (!error) {
    return "Unable to sign in. Please try again.";
  }

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

/* -------------------------------------------------------------------------- */
/*                                   LOGIN                                    */
/* -------------------------------------------------------------------------- */

export default function Login() {
  const navigate = useNavigate();

  const { isAuthenticated, isLoadingAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  // null | "password" | "google"
  const [activeAction, setActiveAction] = useState(null);

  const [error, setError] = useState("");

  const isBusy = activeAction !== null;

  /* ------------------------------------------------------------------------ */
  /*                              AUTH LOADING                                */
  /* ------------------------------------------------------------------------ */

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-4"
        >
          <div className="w-11 h-11 rounded-full border border-zinc-200 flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-zinc-900" />
          </div>

          <span className="text-sm text-zinc-500">
            Checking your session...
          </span>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                         ALREADY AUTHENTICATED                            */
  /* ------------------------------------------------------------------------ */

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  /* ------------------------------------------------------------------------ */
  /*                              EMAIL LOGIN                                 */
  /* ------------------------------------------------------------------------ */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isBusy) return;

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

      if (authError) {
        throw authError;
      }

      navigate("/", {
        replace: true,
      });
    } catch (err) {
      console.error("Password sign-in failed:", err);

      setError(getAuthErrorMessage(err));
    } finally {
      setActiveAction(null);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                              GOOGLE LOGIN                                */
  /* ------------------------------------------------------------------------ */

  const handleGoogle = async () => {
    if (isBusy) return;

    setError("");
    setActiveAction("google");

    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) {
        throw authError;
      }
    } catch (err) {
      console.error("Google sign-in failed:", err);

      setError(getAuthErrorMessage(err));
      setActiveAction(null);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                                   UI                                     */
  /* ------------------------------------------------------------------------ */

  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <div className="min-h-screen grid lg:grid-cols-[1fr_1px_1fr]">
        {/* ------------------------------------------------------------------ */}
        {/*                          LEFT / BRAND                              */}
        {/* ------------------------------------------------------------------ */}

        <section className="hidden lg:flex flex-col justify-between px-14 py-12 xl:px-20 xl:py-16">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-black text-white rounded-xl flex items-center justify-center">
              <span className="text-sm font-semibold">D</span>
            </div>

            <span className="text-sm font-semibold tracking-tight">
              Document Control
            </span>
          </div>

          {/* Main Message */}
          <div className="max-w-lg">
            <div className="inline-flex items-center gap-2 mb-7">
              <span className="w-2 h-2 rounded-full bg-black" />

              <span className="text-xs font-medium tracking-wide uppercase text-zinc-500">
                Workspace
              </span>
            </div>

            <h1 className="text-[42px] xl:text-[52px] leading-[1.08] tracking-[-0.04em] font-semibold">
              Manage your work.
              <br />
              Keep it simple.
            </h1>

            <p className="mt-6 max-w-md text-[15px] leading-7 text-zinc-500">
              Track documents, email requests and responsibilities from one
              clean workspace.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Secure workspace</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </section>

        {/* Desktop Divider */}
        <div className="hidden lg:block bg-zinc-100" />

        {/* ------------------------------------------------------------------ */}
        {/*                            LOGIN SIDE                              */}
        {/* ------------------------------------------------------------------ */}

        <section className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-10 lg:px-14 xl:px-20">
          <div className="w-full max-w-[420px]">
            {/* Mobile Brand */}
            <div className="lg:hidden mb-14 flex items-center gap-3">
              <div className="w-9 h-9 bg-black text-white rounded-xl flex items-center justify-center">
                <span className="text-sm font-semibold">D</span>
              </div>

              <span className="text-sm font-semibold tracking-tight">
                Document Control
              </span>
            </div>

            {/* Header */}
            <header className="mb-9">
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-zinc-400">
                Account access
              </p>

              <h2 className="text-3xl sm:text-[34px] font-semibold tracking-[-0.035em] text-black">
                Welcome back
              </h2>

              <p className="mt-3 text-sm leading-6 text-zinc-500">
                Enter your details to access your workspace.
              </p>
            </header>

            {/* -------------------------------------------------------------- */}
            {/*                            GOOGLE                              */}
            {/* -------------------------------------------------------------- */}

            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={handleGoogle}
              className="
                w-full
                h-12
                rounded-xl
                border-zinc-200
                bg-white
                text-zinc-900
                font-medium
                shadow-none
                transition-all
                hover:bg-zinc-50
                hover:border-zinc-300
                disabled:bg-zinc-50
              "
            >
              {activeAction === "google" ? (
                <>
                  <Loader2
                    className="w-4 h-4 mr-2 animate-spin"
                    aria-hidden="true"
                  />
                  Connecting...
                </>
              ) : (
                <>
                  <GoogleIcon className="w-5 h-5 mr-2" />
                  Continue with Google
                </>
              )}
            </Button>

            {/* -------------------------------------------------------------- */}
            {/*                            DIVIDER                             */}
            {/* -------------------------------------------------------------- */}

            <div className="relative my-7">
              <div
                className="absolute inset-0 flex items-center"
                aria-hidden="true"
              >
                <div className="w-full border-t border-zinc-100" />
              </div>

              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-400">
                  or
                </span>
              </div>
            </div>

            {/* -------------------------------------------------------------- */}
            {/*                             ERROR                              */}
            {/* -------------------------------------------------------------- */}

            {error && (
              <div
                role="alert"
                aria-live="assertive"
                className="
                  mb-6
                  flex
                  items-start
                  gap-3
                  rounded-xl
                  border
                  border-zinc-200
                  bg-zinc-50
                  px-4
                  py-3.5
                  text-sm
                  text-zinc-800
                "
              >
                <AlertCircle
                  className="mt-0.5 w-4 h-4 shrink-0 text-black"
                  aria-hidden="true"
                />

                <span className="leading-5">{error}</span>
              </div>
            )}

            {/* -------------------------------------------------------------- */}
            {/*                             FORM                               */}
            {/* -------------------------------------------------------------- */}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* EMAIL */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-[13px] font-medium text-zinc-800"
                >
                  Email address
                </Label>

                <div className="relative group">
                  <Mail
                    className="
                      pointer-events-none
                      absolute
                      left-4
                      top-1/2
                      w-4
                      h-4
                      -translate-y-1/2
                      text-zinc-400
                      transition-colors
                      group-focus-within:text-black
                    "
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
                    autoFocus
                    spellCheck={false}
                    placeholder="name@company.com"
                    value={email}
                    disabled={isBusy}
                    onChange={(event) => {
                      setEmail(event.target.value);

                      if (error) {
                        setError("");
                      }
                    }}
                    className="
                      h-12
                      rounded-xl
                      border-zinc-200
                      bg-white
                      pl-11
                      pr-4
                      text-sm
                      text-black
                      shadow-none
                      placeholder:text-zinc-400
                      transition-all
                      hover:border-zinc-300
                      focus-visible:border-black
                      focus-visible:ring-1
                      focus-visible:ring-black
                      disabled:bg-zinc-50
                    "
                    required
                  />
                </div>
              </div>

              {/* PASSWORD */}
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
                    className="
                      text-xs
                      font-medium
                      text-zinc-500
                      transition-colors
                      hover:text-black
                      hover:underline
                      underline-offset-4
                      focus-visible:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-black
                      rounded-sm
                    "
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative group">
                  <Lock
                    className="
                      pointer-events-none
                      absolute
                      left-4
                      top-1/2
                      w-4
                      h-4
                      -translate-y-1/2
                      text-zinc-400
                      transition-colors
                      group-focus-within:text-black
                    "
                    aria-hidden="true"
                  />

                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    disabled={isBusy}
                    onChange={(event) => {
                      setPassword(event.target.value);

                      if (error) {
                        setError("");
                      }
                    }}
                    className="
                      h-12
                      rounded-xl
                      border-zinc-200
                      bg-white
                      pl-11
                      pr-12
                      text-sm
                      text-black
                      shadow-none
                      placeholder:text-zinc-400
                      transition-all
                      hover:border-zinc-300
                      focus-visible:border-black
                      focus-visible:ring-1
                      focus-visible:ring-black
                      disabled:bg-zinc-50
                    "
                    required
                  />

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => setShowPassword((current) => !current)}
                    className="
                      absolute
                      right-1.5
                      top-1/2
                      flex
                      h-9
                      w-9
                      -translate-y-1/2
                      items-center
                      justify-center
                      rounded-lg
                      text-zinc-400
                      transition-all
                      hover:bg-zinc-100
                      hover:text-black
                      focus-visible:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-black
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Eye className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {/* LOGIN BUTTON */}
              <Button
                type="submit"
                disabled={isBusy || !email.trim() || !password}
                className="
                  group
                  w-full
                  h-12
                  rounded-xl
                  bg-black
                  text-white
                  font-medium
                  shadow-none
                  transition-all
                  hover:bg-zinc-800
                  active:scale-[0.995]
                  disabled:bg-zinc-200
                  disabled:text-zinc-500
                  disabled:opacity-100
                "
              >
                {activeAction === "password" ? (
                  <>
                    <Loader2
                      className="w-4 h-4 mr-2 animate-spin"
                      aria-hidden="true"
                    />
                    Signing in...
                  </>
                ) : (
                  <div className="flex items-center">
                    <span>Sign in</span>

                    <ArrowRight
                      className="
                        ml-2
                        w-4
                        h-4
                        transition-transform
                        group-hover:translate-x-0.5
                      "
                      aria-hidden="true"
                    />
                  </div>
                )}
              </Button>
            </form>

            {/* -------------------------------------------------------------- */}
            {/*                            REGISTER                            */}
            {/* -------------------------------------------------------------- */}

            <div className="mt-8 text-center">
              <p className="text-sm text-zinc-500">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="
                    font-medium
                    text-black
                    underline-offset-4
                    hover:underline
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-black
                    rounded-sm
                  "
                >
                  Create account
                </Link>
              </p>
            </div>

            {/* Mobile Footer */}
            <div className="lg:hidden mt-16 text-center">
              <p className="text-[11px] text-zinc-400">
                Secure access · © {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
