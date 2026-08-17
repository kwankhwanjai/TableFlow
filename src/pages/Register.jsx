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
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";

/* -------------------------------------------------------------------------- */
/*                               ERROR MESSAGE                                */
/* -------------------------------------------------------------------------- */

function getAuthErrorMessage(error) {
  if (!error) {
    return "Something went wrong. Please try again.";
  }

  const code = error.code;
  const status = error.status;
  const message = error.message?.toLowerCase() || "";

  if (
    code === "user_already_exists" ||
    message.includes("already registered") ||
    message.includes("already exists")
  ) {
    return "An account with this email already exists.";
  }

  if (
    code === "weak_password" ||
    message.includes("password should") ||
    message.includes("password must")
  ) {
    return "Your password does not meet the security requirements.";
  }

  if (code === "email_address_invalid" || message.includes("invalid email")) {
    return "Please enter a valid email address.";
  }

  if (
    status === 429 ||
    code === "over_request_rate_limit" ||
    code === "over_email_send_rate_limit"
  ) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  if (
    message.includes("token has expired") ||
    message.includes("otp expired")
  ) {
    return "This verification code has expired. Please request a new one.";
  }

  if (
    message.includes("invalid token") ||
    message.includes("token is invalid")
  ) {
    return "The verification code is incorrect.";
  }

  return "Something went wrong. Please try again.";
}

/* -------------------------------------------------------------------------- */
/*                              LEFT BRAND PANEL                              */
/* -------------------------------------------------------------------------- */

function BrandPanel() {
  return (
    <section className="hidden lg:flex flex-col justify-between px-14 py-12 xl:px-20 xl:py-16">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white">
          <span className="text-sm font-semibold">D</span>
        </div>

        <span className="text-sm font-semibold tracking-tight text-black">
          Document Control
        </span>
      </div>

      {/* Content */}
      <div className="max-w-lg">
        <div className="mb-7 inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-black" />

          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Workspace
          </span>
        </div>

        <h1 className="text-[42px] font-semibold leading-[1.08] tracking-[-0.04em] text-black xl:text-[52px]">
          One account.
          <br />
          One workspace.
        </h1>

        <p className="mt-6 max-w-md text-[15px] leading-7 text-zinc-500">
          Create your account to manage documents, requests, email tracking and
          team responsibilities from one place.
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>Secure workspace</span>
        <span>© {new Date().getFullYear()}</span>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                                MOBILE BRAND                                */
/* -------------------------------------------------------------------------- */

function MobileBrand() {
  return (
    <div className="mb-14 flex items-center gap-3 lg:hidden">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white">
        <span className="text-sm font-semibold">D</span>
      </div>

      <span className="text-sm font-semibold tracking-tight">
        Document Control
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  REGISTER                                  */
/* -------------------------------------------------------------------------- */

export default function Register() {
  const navigate = useNavigate();

  const { isAuthenticated, isLoadingAuth } = useAuth();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");

  const [activeAction, setActiveAction] = useState(null);

  const [showOtp, setShowOtp] = useState(false);

  const [otpCode, setOtpCode] = useState("");

  const isBusy = activeAction !== null;

  /* ------------------------------------------------------------------------ */
  /*                              AUTH LOADING                                */
  /* ------------------------------------------------------------------------ */

  if (isLoadingAuth) {
    return (
      <div className="grid min-h-screen place-items-center bg-white">
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-4"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200">
            <Loader2 className="h-4 w-4 animate-spin text-black" />
          </div>

          <span className="text-sm text-zinc-500">
            Checking your session...
          </span>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  /* ------------------------------------------------------------------------ */
  /*                              CREATE ACCOUNT                              */
  /* ------------------------------------------------------------------------ */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isBusy) return;

    const normalizedEmail = email.trim().toLowerCase();

    setError("");

    if (!normalizedEmail) {
      setError("Please enter your email address.");

      return;
    }

    if (!password) {
      setError("Please enter a password.");

      return;
    }

    if (!confirmPassword) {
      setError("Please confirm your password.");

      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");

      return;
    }

    setActiveAction("register");

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });

      if (authError) {
        throw authError;
      }

      /*
       * If Supabase immediately creates
       * a valid session, go directly home.
       */
      if (data.session) {
        navigate("/", {
          replace: true,
        });

        return;
      }

      /*
       * Otherwise email verification
       * is required.
       */
      setEmail(normalizedEmail);
      setOtpCode("");
      setShowOtp(true);
    } catch (err) {
      console.error("Registration failed:", err);

      setError(getAuthErrorMessage(err));
    } finally {
      setActiveAction(null);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                                VERIFY OTP                                */
  /* ------------------------------------------------------------------------ */

  const handleVerify = async () => {
    if (isBusy || otpCode.length !== 6) {
      return;
    }

    setError("");
    setActiveAction("verify");

    try {
      const { error: authError } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),

        token: otpCode,

        type: "signup",
      });

      if (authError) {
        throw authError;
      }

      navigate("/", {
        replace: true,
      });
    } catch (err) {
      console.error("OTP verification failed:", err);

      setError(getAuthErrorMessage(err));
    } finally {
      setActiveAction(null);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                               RESEND OTP                                 */
  /* ------------------------------------------------------------------------ */

  const handleResend = async () => {
    if (isBusy) return;

    setError("");
    setActiveAction("resend");

    try {
      const { error: authError } = await supabase.auth.resend({
        type: "signup",

        email: email.trim().toLowerCase(),
      });

      if (authError) {
        throw authError;
      }

      setOtpCode("");

      toast({
        title: "Verification code sent",
        description: "Check your email for the new code.",
      });
    } catch (err) {
      console.error("Resend OTP failed:", err);

      setError(getAuthErrorMessage(err));
    } finally {
      setActiveAction(null);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                              GOOGLE SIGN UP                              */
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
      console.error("Google authentication failed:", err);

      setError(getAuthErrorMessage(err));

      setActiveAction(null);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                                BACK FORM                                 */
  /* ------------------------------------------------------------------------ */

  const handleBackToRegister = () => {
    if (isBusy) return;

    setShowOtp(false);
    setOtpCode("");
    setError("");
  };

  /* ======================================================================== */
  /*                              OTP SCREEN                                  */
  /* ======================================================================== */

  if (showOtp) {
    return (
      <main className="min-h-screen bg-white text-zinc-950">
        <div className="grid min-h-screen lg:grid-cols-[1fr_1px_1fr]">
          <BrandPanel />

          {/* Divider */}
          <div className="hidden bg-zinc-100 lg:block" />

          {/* OTP */}
          <section className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-10 lg:px-14 xl:px-20">
            <div className="w-full max-w-[420px]">
              <MobileBrand />

              {/* Back */}
              <button
                type="button"
                disabled={isBusy}
                onClick={handleBackToRegister}
                className="
                  mb-9
                  inline-flex
                  items-center
                  gap-2
                  rounded-lg
                  text-xs
                  font-medium
                  text-zinc-500
                  transition-colors
                  hover:text-black
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-black
                  disabled:pointer-events-none
                  disabled:opacity-50
                "
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back
              </button>

              {/* Icon */}
              <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white">
                <Mail className="h-5 w-5" aria-hidden="true" />
              </div>

              {/* Header */}
              <header className="mb-8">
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-zinc-400">
                  Email verification
                </p>

                <h1 className="text-3xl font-semibold tracking-[-0.035em] text-black sm:text-[34px]">
                  Check your email
                </h1>

                <p className="mt-3 text-sm leading-6 text-zinc-500">
                  We've sent a 6-digit verification code to
                </p>

                <p className="mt-1 break-all text-sm font-medium text-black">
                  {email}
                </p>
              </header>

              {/* Error */}
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
                    className="mt-0.5 h-4 w-4 shrink-0 text-black"
                    aria-hidden="true"
                  />

                  <span className="leading-5">{error}</span>
                </div>
              )}

              {/* OTP Input */}
              <div className="mb-7 flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otpCode}
                  onChange={(value) => {
                    setOtpCode(value);

                    if (error) {
                      setError("");
                    }
                  }}
                  autoFocus
                  autoComplete="one-time-code"
                  disabled={isBusy}
                >
                  <InputOTPGroup className="gap-2">
                    <InputOTPSlot
                      index={0}
                      className="
                        h-12
                        w-11
                        rounded-xl
                        border
                        border-zinc-200
                        text-base
                        font-semibold
                        shadow-none
                        first:rounded-xl
                        focus:border-black
                      "
                    />

                    <InputOTPSlot
                      index={1}
                      className="
                        h-12
                        w-11
                        rounded-xl
                        border
                        border-zinc-200
                        text-base
                        font-semibold
                        shadow-none
                      "
                    />

                    <InputOTPSlot
                      index={2}
                      className="
                        h-12
                        w-11
                        rounded-xl
                        border
                        border-zinc-200
                        text-base
                        font-semibold
                        shadow-none
                      "
                    />

                    <InputOTPSlot
                      index={3}
                      className="
                        h-12
                        w-11
                        rounded-xl
                        border
                        border-zinc-200
                        text-base
                        font-semibold
                        shadow-none
                      "
                    />

                    <InputOTPSlot
                      index={4}
                      className="
                        h-12
                        w-11
                        rounded-xl
                        border
                        border-zinc-200
                        text-base
                        font-semibold
                        shadow-none
                      "
                    />

                    <InputOTPSlot
                      index={5}
                      className="
                        h-12
                        w-11
                        rounded-xl
                        border
                        border-zinc-200
                        text-base
                        font-semibold
                        shadow-none
                        last:rounded-xl
                      "
                    />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {/* Verify */}
              <Button
                type="button"
                onClick={handleVerify}
                disabled={isBusy || otpCode.length !== 6}
                className="
                  group
                  h-12
                  w-full
                  rounded-xl
                  bg-black
                  font-medium
                  text-white
                  shadow-none
                  transition-all
                  hover:bg-zinc-800
                  active:scale-[0.995]
                  disabled:bg-zinc-200
                  disabled:text-zinc-500
                  disabled:opacity-100
                "
              >
                {activeAction === "verify" ? (
                  <>
                    <Loader2
                      className="mr-2 h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    Verifying...
                  </>
                ) : (
                  <div className="flex items-center">
                    <span>Verify email</span>

                    <ArrowRight
                      className="
                        ml-2
                        h-4
                        w-4
                        transition-transform
                        group-hover:translate-x-0.5
                      "
                      aria-hidden="true"
                    />
                  </div>
                )}
              </Button>

              {/* Resend */}
              <div className="mt-7 text-center">
                <p className="text-sm text-zinc-500">
                  Didn't receive the code?{" "}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isBusy}
                    className="
                      font-medium
                      text-black
                      underline-offset-4
                      hover:underline
                      focus-visible:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-black
                      disabled:cursor-not-allowed
                      disabled:text-zinc-400
                    "
                  >
                    {activeAction === "resend" ? "Sending..." : "Resend code"}
                  </button>
                </p>
              </div>

              {/* Security */}
              <div className="mt-10 flex items-start gap-3 border-t border-zinc-100 pt-6">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400"
                  aria-hidden="true"
                />

                <p className="text-xs leading-5 text-zinc-400">
                  Verification helps us confirm that this email address belongs
                  to you.
                </p>
              </div>

              {/* Mobile footer */}
              <div className="mt-14 text-center lg:hidden">
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

  /* ======================================================================== */
  /*                           REGISTER SCREEN                                */
  /* ======================================================================== */

  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <div className="grid min-h-screen lg:grid-cols-[1fr_1px_1fr]">
        <BrandPanel />

        {/* Divider */}
        <div className="hidden bg-zinc-100 lg:block" />

        {/* Register */}
        <section className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-10 lg:px-14 xl:px-20">
          <div className="w-full max-w-[420px]">
            <MobileBrand />

            {/* Header */}
            <header className="mb-8">
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-zinc-400">
                Create account
              </p>

              <h2 className="text-3xl font-semibold tracking-[-0.035em] text-black sm:text-[34px]">
                Get started
              </h2>

              <p className="mt-3 text-sm leading-6 text-zinc-500">
                Create your account to access your workspace.
              </p>
            </header>

            {/* Google */}
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={handleGoogle}
              className="
                mb-6
                h-12
                w-full
                rounded-xl
                border-zinc-200
                bg-white
                text-sm
                font-medium
                text-zinc-900
                shadow-none
                transition-all
                hover:border-zinc-300
                hover:bg-zinc-50
                disabled:bg-zinc-50
              "
            >
              {activeAction === "google" ? (
                <>
                  <Loader2
                    className="mr-2 h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  Connecting...
                </>
              ) : (
                <>
                  <GoogleIcon className="mr-2 h-5 w-5" />
                  Continue with Google
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative mb-6">
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

            {/* Error */}
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
                  className="mt-0.5 h-4 w-4 shrink-0 text-black"
                  aria-hidden="true"
                />

                <span className="leading-5">{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* EMAIL */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-[13px] font-medium text-zinc-800"
                >
                  Email address
                </Label>

                <div className="group relative">
                  <Mail
                    className="
                      pointer-events-none
                      absolute
                      left-4
                      top-1/2
                      h-4
                      w-4
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
                <Label
                  htmlFor="password"
                  className="text-[13px] font-medium text-zinc-800"
                >
                  Password
                </Label>

                <div className="group relative">
                  <Lock
                    className="
                      pointer-events-none
                      absolute
                      left-4
                      top-1/2
                      h-4
                      w-4
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
                    autoComplete="new-password"
                    placeholder="Create a password"
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
                      disabled:opacity-50
                    "
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="space-y-2">
                <Label
                  htmlFor="confirm"
                  className="text-[13px] font-medium text-zinc-800"
                >
                  Confirm password
                </Label>

                <div className="group relative">
                  <Lock
                    className="
                      pointer-events-none
                      absolute
                      left-4
                      top-1/2
                      h-4
                      w-4
                      -translate-y-1/2
                      text-zinc-400
                      transition-colors
                      group-focus-within:text-black
                    "
                    aria-hidden="true"
                  />

                  <Input
                    id="confirm"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Enter password again"
                    value={confirmPassword}
                    disabled={isBusy}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);

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
                    onClick={() =>
                      setShowConfirmPassword((current) => !current)
                    }
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
                      disabled:opacity-50
                    "
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Password match status */}
                {confirmPassword && password === confirmPassword && (
                  <div className="flex items-center gap-1.5 pt-1 text-xs text-zinc-500">
                    <CheckCircle2
                      className="h-3.5 w-3.5 text-black"
                      aria-hidden="true"
                    />
                    Passwords match
                  </div>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={
                  isBusy || !email.trim() || !password || !confirmPassword
                }
                className="
                  group
                  h-12
                  w-full
                  rounded-xl
                  bg-black
                  font-medium
                  text-white
                  shadow-none
                  transition-all
                  hover:bg-zinc-800
                  active:scale-[0.995]
                  disabled:bg-zinc-200
                  disabled:text-zinc-500
                  disabled:opacity-100
                "
              >
                {activeAction === "register" ? (
                  <>
                    <Loader2
                      className="mr-2 h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    Creating account...
                  </>
                ) : (
                  <div className="flex items-center">
                    <span>Create account</span>

                    <ArrowRight
                      className="
                        ml-2
                        h-4
                        w-4
                        transition-transform
                        group-hover:translate-x-0.5
                      "
                      aria-hidden="true"
                    />
                  </div>
                )}
              </Button>
            </form>

            {/* Login */}
            <div className="mt-8 text-center">
              <p className="text-sm text-zinc-500">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="
                    rounded-sm
                    font-medium
                    text-black
                    underline-offset-4
                    hover:underline
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-black
                  "
                >
                  Sign in
                </Link>
              </p>
            </div>

            {/* Mobile footer */}
            <div className="mt-14 text-center lg:hidden">
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
