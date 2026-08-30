import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import GoogleIcon from "@/components/GoogleIcon";

function getAuthErrorMessage(error) {
  if (!error) return "Something went wrong. Please try again.";

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

function BrandPanel() {
  return (
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
          New workspace account
        </span>

        <h1 className="max-w-lg text-[44px] font-semibold leading-[1.06] tracking-[-0.045em] xl:text-[56px]">
          Start organized.
          <br />
          Stay in control.
        </h1>

        <p className="mt-6 max-w-md text-[15px] leading-7 text-zinc-600">
          Create one secure account for documents, email requests and team
          responsibilities.
        </p>

        <div className="mt-9 grid max-w-md gap-3 text-sm text-zinc-700">
          {[
            "One secure account",
            "Email verification",
            "Fast workspace access",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full bg-white/70"
                style={{ color: "var(--accent)" }}
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
  );
}

function MobileBrand() {
  return (
    <div className="mb-10 lg:hidden">
      <BrandMark />
    </div>
  );
}

function ErrorAlert({ error }) {
  if (!error) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="leading-5">{error}</span>
    </div>
  );
}

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
  const [resendMessage, setResendMessage] = useState("");

  const isBusy = activeAction !== null;
  const isFormDisabled = isBusy || isLoadingAuth;
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isFormDisabled) return;

    const normalizedEmail = email.trim().toLowerCase();
    setError("");
    setResendMessage("");

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

      if (authError) throw authError;

      if (data.session) {
        navigate("/", { replace: true });
        return;
      }

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

  const handleVerify = async () => {
    if (isFormDisabled || otpCode.length !== 6) return;

    setError("");
    setActiveAction("verify");

    try {
      const { error: authError } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otpCode,
        type: "signup",
      });

      if (authError) throw authError;
      navigate("/", { replace: true });
    } catch (err) {
      console.error("OTP verification failed:", err);
      setError(getAuthErrorMessage(err));
    } finally {
      setActiveAction(null);
    }
  };

  const handleResend = async () => {
    if (isFormDisabled) return;

    setError("");
    setResendMessage("");
    setActiveAction("resend");

    try {
      const { error: authError } = await supabase.auth.resend({
        type: "signup",
        email: email.trim().toLowerCase(),
      });

      if (authError) throw authError;

      setOtpCode("");
      setResendMessage("A new verification code has been sent.");
    } catch (err) {
      console.error("Resend OTP failed:", err);
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
      console.error("Google authentication failed:", err);
      setError(getAuthErrorMessage(err));
      setActiveAction(null);
    }
  };

  const handleBackToRegister = () => {
    if (isBusy) return;
    setShowOtp(false);
    setOtpCode("");
    setError("");
    setResendMessage("");
  };

  if (showOtp) {
    return (
      <main className="min-h-screen bg-white text-zinc-950">
        <div className="grid min-h-screen lg:grid-cols-[minmax(380px,0.92fr)_1.08fr]">
          <BrandPanel />

          <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:px-12 xl:px-20">
            <div className="w-full max-w-[440px]">
              <MobileBrand />

              <button
                type="button"
                disabled={isBusy}
                onClick={handleBackToRegister}
                className="mb-8 inline-flex items-center gap-2 rounded-lg text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to account details
              </button>

              <div
                className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{
                  color: "var(--accent)",
                  backgroundColor: "var(--accent-bg)",
                }}
              >
                <Mail className="h-5 w-5" />
              </div>

              <header className="mb-8">
                <p
                  className="mb-2 text-xs font-semibold uppercase tracking-[0.16em]"
                  style={{ color: "var(--accent)" }}
                >
                  Email verification
                </p>
                <h1 className="text-3xl font-semibold tracking-[-0.035em] sm:text-[36px]">
                  Check your inbox
                </h1>
                <p className="mt-3 text-sm leading-6 text-zinc-500">
                  Enter the 6-digit code sent to
                  <span className="ml-1 break-all font-medium text-zinc-900">
                    {email}
                  </span>
                  .
                </p>
              </header>

              <ErrorAlert error={error} />

              {resendMessage && (
                <div
                  className="mb-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm"
                  style={{
                    color: "var(--accent)",
                    backgroundColor: "var(--accent-bg)",
                    borderColor: "var(--accent-border)",
                  }}
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  {resendMessage}
                </div>
              )}

              <div className="mb-7 flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otpCode}
                  onChange={(value) => {
                    setOtpCode(value.replace(/\D/g, ""));
                    if (error) setError("");
                  }}
                  autoFocus
                  autoComplete="one-time-code"
                  disabled={isFormDisabled}
                >
                  <InputOTPGroup className="gap-2">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className="h-12 w-11 rounded-xl border border-zinc-200 text-base font-semibold shadow-none first:rounded-xl last:rounded-xl focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-bg)]"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                type="button"
                onClick={handleVerify}
                disabled={isFormDisabled || otpCode.length !== 6}
                className="group h-12 w-full rounded-xl text-white shadow-none transition-[transform,filter,opacity] hover:brightness-95 active:scale-[0.995] disabled:opacity-50"
                style={{ backgroundColor: "var(--accent)" }}
              >
                {activeAction === "verify" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <span className="flex items-center">
                    Verify email
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                )}
              </Button>

              <p className="mt-7 text-center text-sm text-zinc-500">
                Didn&apos;t receive the code?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isFormDisabled}
                  className="font-semibold underline-offset-4 hover:underline disabled:opacity-50"
                  style={{ color: "var(--accent)" }}
                >
                  {activeAction === "resend" ? "Sending..." : "Resend code"}
                </button>
              </p>

              <div className="mt-9 flex items-start gap-3 border-t border-zinc-100 pt-6 text-xs leading-5 text-zinc-400">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                Verification confirms this email belongs to you before workspace
                access is granted.
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <div className="grid min-h-screen lg:grid-cols-[minmax(380px,0.92fr)_1.08fr]">
        <BrandPanel />

        <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:px-12 xl:px-20">
          <div className="w-full max-w-[440px]">
            <MobileBrand />

            <div className="mb-7 flex items-start justify-between gap-4">
              <header>
                <p
                  className="mb-2 text-xs font-semibold uppercase tracking-[0.16em]"
                  style={{ color: "var(--accent)" }}
                >
                  Create account
                </p>
                <h2 className="text-3xl font-semibold tracking-[-0.035em] sm:text-[36px]">
                  Get started
                </h2>
                <p className="mt-3 text-sm leading-6 text-zinc-500">
                  Create an account to access your workspace.
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
              className="mb-5 h-12 w-full rounded-xl bg-white font-medium shadow-none transition-[border-color,background-color,box-shadow] hover:bg-zinc-50"
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

            <div className="relative mb-5">
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

            <ErrorAlert error={error} />

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
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
                <Label
                  htmlFor="password"
                  className="text-[13px] font-medium text-zinc-800"
                >
                  Password
                </Label>
                <div className="group relative">
                  <Lock
                    className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-[var(--accent)]"
                    aria-hidden="true"
                  />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Create a password"
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
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirm"
                  className="text-[13px] font-medium text-zinc-800"
                >
                  Confirm password
                </Label>
                <div className="group relative">
                  <Lock
                    className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-[var(--accent)]"
                    aria-hidden="true"
                  />
                  <Input
                    id="confirm"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Enter password again"
                    value={confirmPassword}
                    disabled={isFormDisabled}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      if (error) setError("");
                    }}
                    className={`${fieldClassName} pr-12`}
                    required
                  />
                  <button
                    type="button"
                    disabled={isFormDisabled}
                    onClick={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                    className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-400 transition-[color,background-color] hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50"
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

                {passwordsMatch && (
                  <div
                    className="flex items-center gap-1.5 pt-1 text-xs"
                    style={{ color: "var(--accent)" }}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Passwords match
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={
                  isFormDisabled ||
                  !email.trim() ||
                  !password ||
                  !confirmPassword
                }
                className="group mt-1 h-12 w-full rounded-xl text-white shadow-none transition-[transform,filter,opacity] hover:brightness-95 active:scale-[0.995] disabled:opacity-50"
                style={{ backgroundColor: "var(--accent)" }}
              >
                {activeAction === "register" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <span className="flex items-center">
                    Create account
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                )}
              </Button>
            </form>

            <p className="mt-7 text-center text-sm text-zinc-500">
              Already have an account?{" "}
              <Link
                to="/login"
                className="rounded-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                style={{ color: "var(--accent)" }}
              >
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
