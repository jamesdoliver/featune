'use client'

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useUser } from "@/lib/hooks/useUser";
import { signOut } from "@/app/(auth)/actions";
import { useCartStore } from "@/stores/cartStore";

export default function Header() {
  const { user, profile, loading } = useUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemCount = useCartStore((state) => state.getItemCount());
  const openDrawer = useCartStore((state) => state.openDrawer);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  // Derive display name and initial
  const displayName = profile?.full_name || user?.email || "User";
  const displayEmail = user?.email || "";
  const initial = displayName.charAt(0).toUpperCase();
  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border-default bg-bg-primary/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1">
          <span className="text-xl font-bold tracking-tight text-text-primary">
            FEA<span className="text-accent">TUNE</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/search"
            className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            Browse
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            Sell
          </Link>
        </nav>

        {/* Auth section */}
        <div className="flex items-center gap-3">
          {/* Cart icon */}
          <button
            onClick={openDrawer}
            className="relative text-text-secondary transition-colors hover:text-text-primary"
            aria-label="Open cart"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-white">
                {itemCount}
              </span>
            )}
          </button>

          {loading ? (
            // Loading skeleton placeholder
            <div className="h-8 w-8 animate-pulse rounded-full bg-bg-elevated" />
          ) : user ? (
            // Logged in: user avatar + dropdown
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1 text-sm font-medium text-text-primary transition-colors hover:text-accent focus:outline-none"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                Welcome, <span className="text-accent">{firstName}</span>
                <svg
                  className={`h-4 w-4 text-text-muted transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg border border-border-default bg-bg-card shadow-lg">
                  {/* User info */}
                  <div className="border-b border-border-default px-4 py-3">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {displayName}
                    </p>
                    {displayEmail && displayName !== displayEmail && (
                      <p className="truncate text-xs text-text-muted">
                        {displayEmail}
                      </p>
                    )}
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    <Link
                      href="/account"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
                    >
                      Account
                    </Link>

                    {profile?.is_creator && (
                      <Link
                        href="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
                      >
                        Dashboard
                      </Link>
                    )}

                    {profile?.is_admin && (
                      <Link
                        href="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
                      >
                        Admin
                      </Link>
                    )}
                  </div>

                  {/* Divider + Log out */}
                  <div className="border-t border-border-default py-1">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        signOut();
                      }}
                      className="block w-full px-4 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
                    >
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Logged out: login + signup
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
