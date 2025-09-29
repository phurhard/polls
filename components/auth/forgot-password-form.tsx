"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Mail, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function ForgotPasswordForm() {
  const router = useRouter();
  const { requestPasswordReset, isLoading, error, clearError } = useAuth();

  const [email, setEmail] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (!email) {
      setLocalError("Email is required");
      return;
    }
    if (!validateEmail(email)) {
      setLocalError("Please enter a valid email address");
      return;
    }

    try {
      await requestPasswordReset(email);
      setSubmitted(true);
    } catch {
      // error is handled by hook; leave localError as null here
    }
  };

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
          <div className="text-2xl font-bold text-white">P</div>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Forgot password
        </h1>
        <p className="text-muted-foreground">
          Enter your email to receive a password reset link
        </p>
      </div>

      {/* Card */}
      <Card className="shadow-xl bg-white dark:bg-white text-gray-900 border border-gray-200 animate-slide-up">
        <CardContent className="p-8">
          {submitted ? (
            <div className="space-y-6 text-center">
              <div className="flex items-center justify-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-700">
                  If an account exists for <strong>{email}</strong>, a reset link has been sent. Please check your inbox and spam folder.
                </span>
              </div>
              <Button
                className="w-full h-12 text-base font-semibold cursor-pointer"
                onClick={() => router.push("/auth/signin")}
              >
                Return to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Errors */}
              {(error || localError) && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-sm text-red-700">
                    {localError || error}
                  </span>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-900">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (localError) setLocalError(null);
                      if (error) clearError();
                    }}
                    disabled={isLoading}
                    className="pl-11 h-12 text-base border-2 focus:border-primary focus:ring-4 focus:ring-primary/10 bg-white text-gray-900 placeholder:text-gray-500"
                  />
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
                      Sending reset link...
                    </div>
                  ) : (
                    "Send reset link"
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ForgotPasswordForm;
