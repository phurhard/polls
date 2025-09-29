"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface NavigationProps {
  currentUser?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export function Navigation({ currentUser }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  const handleSignOut = () => {
    // TODO: Implement actual sign out logic
    console.log("Signing out...");
    router.push("/auth/signin");
  };

  const navItems = [
    { href: "/polls", label: "Browse Polls" },
    { href: "/polls/create", label: "Create Poll" },
  ];

  const authenticatedNavItems = [
    { href: "/dashboard", label: "Dashboard" },
    ...navItems,
  ];

  const currentNavItems = currentUser ? authenticatedNavItems : navItems;

  return (
    <nav className="bg-white border-b box-shadow-sm border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Polls</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {currentNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-600 hover:text-gray-900 hover:underline px-3 py-2 text-sm font-medium transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {currentUser ? (
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  <span className="text-gray-600">Welcome, </span>
                  <span className="font-medium text-gray-900">{currentUser.name}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push("/auth/signin")}
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  onClick={() => router.push("/auth/signup")}
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4">
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {currentNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}

                  <div className="border-t border-gray-200 pt-3">
                    {currentUser ? (
                      <div className="space-y-3">
                        <div className="px-3 py-2">
                          <div className="text-sm font-medium text-gray-900">
                            {currentUser.name}
                          </div>
                          <div className="text-xs text-gray-600">
                            {currentUser.email}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            handleSignOut();
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          Sign Out
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            router.push("/auth/signin");
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          Sign In
                        </Button>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            router.push("/auth/signup");
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          Sign Up
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </nav>
  );
}
