"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/database";
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { updatePassword, isLoading, error, clearError } = useAuth();

  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Verify the reset link/session on mount
  useEffect(() => {
    let cancelled = false;

    async function verify() {
      setVerifying(true);
      setLocalError(null);

      try {
        const code = searchParams?.get("code");

        if (code) {
          // If Supabase sent an OTP code in the URL, exchange it for a session
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          if (!cancelled) setVerified(true);
        } else {
          // Some providers send hash with type=recovery; treat as verified
          if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
            if (!cancelled) setVerified(true);
          } else {
            // If neither code nor recovery hash is present, allow form but updateUser may fail
            if (!cancelled) setVerified(true);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setLocalError(
            e instanceof Error ? e.message : "Invalid or expired reset link. Please request a new one."
          );
          setVerified(false);
        }
      } finally {
        if (!cancelled) setVerifying(false);
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (!password || !confirm) {
      setLocalError("Please fill in both password fields");
      return;
    }
    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setLocalError("Passwords do not match");
      return;
    }

    try {
      await updatePassword(password);
      setSuccess(true);
      // Optionally redirect after a short delay
      setTimeout(() => router.push("/auth/signin?reset=success"), 1200);
    } catch {
      // error handled by hook
    }
  };

  // Loading/verification state
  if (verifying) {
    return (
      <div className="w-full max-w-md mx-auto animate-fade-in">
        <Card className="shadow-xl bg-white dark:bg-white text-gray-900 border border-gray-200 animate-slide-up">
          <CardContent className="p-8">
            <div className="flex items-center justify-center gap-3">
              <LoadingSpinner size="sm" />
              <span className="text-sm text-gray-700">Verifying reset link...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state (invalid/expired link)
  if (!verified && localError) {
    return (
      <div className="w-full max-w-md mx-auto animate-fade-in">
        <Card className="shadow-xl bg-white dark:bg-white text-gray-900 border border-gray-200 animate-slide-up">
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm text-red-700">{localError}</span>
            </div>
            <Button
              variant="outline"
              className="w-full h-12 text-base font-semibold cursor-pointer"
              onClick={() => router.push("/auth/forgot-password")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Request a new reset link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="w-full max-w-md mx-auto animate-fade-in">
        <Card className="shadow-xl bg-white dark:bg-white text-gray-900 border border-gray-200 animate-slide-up">
          <CardContent className="p-8 space-y-6 text-center">
            <div className="flex items-center justify-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-700">Password updated successfully</span>
            </div>
            <Button
              className="w-full h-12 text-base font-semibold cursor-pointer"
              onClick={() => router.push("/auth/signin")}
            >
              Proceed to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default: reset form
  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
          <div className="text-2xl font-bold text-white">P</div>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Set a new password</h1>
        <p className="text-muted-foreground">Enter a strong password you’ll remember</p>
      </div>

      {/* Card */}
      <Card className="shadow-xl bg-white dark:bg-white text-gray-900 border border-gray-200 animate-slide-up">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {(error || localError) && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-sm text-red-700">{localError || error}</span>
              </div>
            )}

            {/* New password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-900">
                New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <Input
                  id="password"
                  name="password"
                  type={showPw ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (localError) setLocalError(null);
                    if (error) clearError();
                  }}
                  disabled={isLoading}
                  className="pl-11 pr-11 h-12 text-base border-2 focus:border-primary focus:ring-4 focus:ring-primary/10 bg-white text-gray-900 placeholder:text-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-sm font-semibold text-gray-900">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <Input
                  id="confirm"
                  name="confirm"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    if (localError) setLocalError(null);
                    if (error) clearError();
                  }}
                  disabled={isLoading}
                  className="pl-11 pr-11 h-12 text-base border-2 focus:border-primary focus:ring-4 focus:ring-primary/10 bg-white text-gray-900 placeholder:text-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-base font-semibold cursor-pointer"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" variant="light" />
                    Updating password...
                  </div>
                ) : (
                  "Update password"
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 text-base font-semibold cursor-pointer"
                onClick={() => router.push("/auth/signin")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default ResetPasswordForm;
