"use client";

import * as React from "react";
import { X, CheckCircle, AlertCircle, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "error" | "warning" | "info";
  title?: string;
  description?: string;
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

const toastVariants = {
  default: {
    container: "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
    icon: Info,
    iconColor: "text-blue-500",
  },
  success: {
    container:
      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    icon: CheckCircle,
    iconColor: "text-green-500",
  },
  error: {
    container:
      "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    icon: XCircle,
    iconColor: "text-red-500",
  },
  warning: {
    container:
      "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
    icon: AlertCircle,
    iconColor: "text-yellow-500",
  },
  info: {
    container:
      "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    icon: Info,
    iconColor: "text-blue-500",
  },
};

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  (
    {
      className,
      variant = "default",
      title,
      description,
      children,
      onClose,
      autoClose = true,
      autoCloseDelay = 5000,
      ...props
    },
    ref,
  ) => {
    const [isVisible, setIsVisible] = React.useState(true);
    const [isExiting, setIsExiting] = React.useState(false);
    const timeoutRef = React.useRef<NodeJS.Timeout>();

    const variantConfig = toastVariants[variant];
    const IconComponent = variantConfig.icon;

    const handleClose = React.useCallback(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 300);
    }, [onClose]);

    React.useEffect(() => {
      if (autoClose) {
        timeoutRef.current = setTimeout(() => {
          handleClose();
        }, autoCloseDelay);
      }

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, [autoClose, autoCloseDelay, handleClose]);

    const handleMouseEnter = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };

    const handleMouseLeave = () => {
      if (autoClose) {
        timeoutRef.current = setTimeout(() => {
          handleClose();
        }, autoCloseDelay);
      }
    };

    if (!isVisible) return null;

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm",
          "transform transition-all duration-300 ease-in-out",
          isExiting
            ? "opacity-0 scale-95 translate-x-full"
            : "opacity-100 scale-100 translate-x-0",
          variantConfig.container,
          className,
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role="alert"
        {...props}
      >
        {/* Icon */}
        <IconComponent
          className={cn(
            "w-5 h-5 flex-shrink-0 mt-0.5",
            variantConfig.iconColor,
          )}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {title}
            </div>
          )}
          {description && (
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {description}
            </div>
          )}
          {children}
        </div>

        {/* Close Button */}
        {onClose && (
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            aria-label="Close notification"
          >
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
          </button>
        )}

        {/* Progress bar for auto-close */}
        {autoClose && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-b-lg overflow-hidden">
            <div
              className={cn(
                "h-full rounded-b-lg transition-all ease-linear",
                variant === "success" && "bg-green-500",
                variant === "error" && "bg-red-500",
                variant === "warning" && "bg-yellow-500",
                variant === "info" && "bg-blue-500",
                variant === "default" && "bg-blue-500",
              )}
              style={{
                width: "100%",
                animation: `shrink ${autoCloseDelay}ms linear forwards`,
              }}
            />
          </div>
        )}

        <style jsx>{`
          @keyframes shrink {
            from {
              width: 100%;
            }
            to {
              width: 0%;
            }
          }
        `}</style>
      </div>
    );
  },
);

Toast.displayName = "Toast";

// Toast Container Component
interface ToastContainerProps {
  position?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "top-center"
    | "bottom-center";
  children: React.ReactNode;
}

const ToastContainer: React.FC<ToastContainerProps> = ({
  position = "top-right",
  children,
}) => {
  const positionClasses = {
    "top-right": "fixed top-4 right-4",
    "top-left": "fixed top-4 left-4",
    "bottom-right": "fixed bottom-4 right-4",
    "bottom-left": "fixed bottom-4 left-4",
    "top-center": "fixed top-4 left-1/2 transform -translate-x-1/2",
    "bottom-center": "fixed bottom-4 left-1/2 transform -translate-x-1/2",
  };

  return (
    <div
      className={cn(
        "z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none",
        positionClasses[position],
      )}
      aria-live="polite"
      aria-label="Notifications"
    >
      <div className="pointer-events-auto">{children}</div>
    </div>
  );
};

// Hook for managing toasts
interface ToastState {
  id: string;
  variant: ToastProps["variant"];
  title?: string;
  description?: string;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

let toastCounter = 0;

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastState[]>([]);

  const addToast = React.useCallback((toast: Omit<ToastState, "id">) => {
    const id = `toast-${++toastCounter}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = React.useCallback(
    (title: string, description?: string) => {
      return addToast({ variant: "success", title, description });
    },
    [addToast],
  );

  const error = React.useCallback(
    (title: string, description?: string) => {
      return addToast({ variant: "error", title, description });
    },
    [addToast],
  );

  const warning = React.useCallback(
    (title: string, description?: string) => {
      return addToast({ variant: "warning", title, description });
    },
    [addToast],
  );

  const info = React.useCallback(
    (title: string, description?: string) => {
      return addToast({ variant: "info", title, description });
    },
    [addToast],
  );

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };
}

export { Toast, ToastContainer, type ToastProps };
