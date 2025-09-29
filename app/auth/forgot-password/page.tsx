import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background with gradient and pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-background to-purple-50 dark:from-gray-900 dark:via-background dark:to-blue-900"></div>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-gradient-to-br from-primary/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-gradient-to-tr from-green-400/20 to-primary/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--foreground)/0.02)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground)/0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md mx-auto px-4 sm:px-6">
        <ForgotPasswordForm />
      </div>

      {/* Floating elements for visual appeal */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-yellow-200/40 to-orange-300/40 rounded-full blur-xl animate-bounce delay-300"></div>
      <div className="absolute bottom-20 right-10 w-16 h-16 bg-gradient-to-br from-pink-200/40 to-red-300/40 rounded-full blur-xl animate-bounce delay-700"></div>
      <div className="absolute top-1/3 right-20 w-12 h-12 bg-gradient-to-br from-green-200/40 to-teal-300/40 rounded-full blur-xl animate-bounce delay-500"></div>
    </div>
  );
}
