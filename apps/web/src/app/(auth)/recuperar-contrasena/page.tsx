"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, KeyRound, Mail } from "lucide-react";
import { FormEvent, useState } from "react";
import { AuthFooter } from "../_components/auth-footer";
import { AuthTopBar } from "../_components/auth-top-bar";

export default function RecoverPasswordPage() {
  const [sent, setSent] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background font-body-md text-on-surface">
      <AuthTopBar />

      <main className="relative flex flex-grow items-center justify-center overflow-hidden p-margin-page">
        <section className="auth-card-hover relative z-10 w-full max-w-md rounded-xl border border-outline-variant/30 bg-surface-container-lowest/95 p-8 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] backdrop-blur-sm md:p-10">
          <div className="mb-stack-lg text-center">
            <div className="mb-stack-md inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary-container text-on-primary-container shadow-inner">
              <KeyRound size={32} strokeWidth={1.9} />
            </div>
            <h1 className="mb-stack-sm hidden font-display-lg text-display-lg text-on-surface md:block">
              Recover Password
            </h1>
            <h1 className="mb-stack-sm block font-headline-md-mobile text-headline-md-mobile text-on-surface md:hidden">
              Recover Password
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              Enter your registered email address and we&apos;ll send you
              instructions to reset your password.
            </p>
          </div>

          {!sent ? (
            <form className="space-y-stack-lg" onSubmit={handleSubmit}>
              <div className="space-y-stack-sm">
                <label
                  className="block font-label-md text-label-md text-on-surface"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-on-surface-variant transition-colors group-focus-within:text-primary">
                    <Mail size={20} />
                  </div>
                  <input
                    className="block w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-3 pl-10 pr-3 font-body-md text-body-md text-on-surface placeholder:text-outline transition-all duration-200 focus:border-primary focus:shadow-[0_0_0_3px_rgba(68,65,196,0.1)] focus:outline-none focus:ring-2 focus:ring-primary"
                    id="email"
                    name="email"
                    placeholder="manager@salon.com"
                    required
                    type="email"
                  />
                </div>
              </div>

              <button
                className="flex w-full justify-center rounded-lg border border-transparent bg-primary px-4 py-3 font-label-md text-label-md text-on-primary shadow-sm transition-all duration-200 hover:bg-surface-tint hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-[0.98]"
                type="submit"
              >
                Send Instructions
              </button>
            </form>
          ) : (
            <div className="animate-fade-in-up space-y-stack-md py-stack-md text-center">
              <div className="mx-auto mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#E6F4EA] text-[#1E8E3E]">
                <CheckCircle2 size={26} fill="currentColor" strokeWidth={2} />
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">
                Instructions Sent
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Check your inbox for the next steps. If you don&apos;t see it,
                check your spam folder.
              </p>
              <button
                className="mt-stack-md flex w-full justify-center rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 font-label-md text-label-md text-primary transition-colors duration-200 hover:bg-surface-container-low"
                onClick={() => setSent(false)}
                type="button"
              >
                Try another email
              </button>
            </div>
          )}

          <div className="mt-stack-lg text-center">
            <Link
              className="group inline-flex items-center gap-1 font-body-md text-body-md text-primary transition-colors duration-200 hover:text-surface-tint hover:underline"
              href="/login"
            >
              <ArrowLeft
                className="transition-transform group-hover:-translate-x-1"
                size={16}
              />
              Return to Login
            </Link>
          </div>
        </section>
      </main>

      <AuthFooter />
    </div>
  );
}
