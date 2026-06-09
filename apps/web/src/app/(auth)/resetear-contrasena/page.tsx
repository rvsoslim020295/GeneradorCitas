"use client";

import { ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound } from "lucide-react";
import { useState } from "react";
import { AuthFooter } from "../_components/auth-footer";
import { AuthTopBar } from "../_components/auth-top-bar";

function PasswordToggleButton({
  visible,
  onClick,
  label,
}: {
  visible: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      aria-label={label}
      className="absolute inset-y-0 right-0 flex items-center pr-3 text-outline transition-colors hover:text-on-surface-variant focus:outline-none"
      onClick={onClick}
      type="button"
    >
      {visible ? <EyeOff size={20} /> : <Eye size={20} />}
    </button>
  );
}

export default function ResetPasswordPage() {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="flex h-full flex-col justify-between overflow-y-auto bg-background font-body-md text-on-background">
      <AuthTopBar />

      <main className="flex flex-grow items-center justify-center p-margin-page">
        <section className="w-full max-w-md rounded-xl border border-surface-variant bg-surface-container-lowest p-8 shadow-[0_4px_6px_rgba(0,0,0,0.05)]">
          <div className="mb-stack-lg text-center">
            <div className="mb-stack-md inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
              <KeyRound size={24} strokeWidth={1.9} />
            </div>
            <h2 className="mb-stack-sm font-headline-md text-headline-md text-on-surface">
              Reset Password
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Please enter your new password below. Ensure it meets the security
              requirements.
            </p>
          </div>

          <form action="#" className="space-y-stack-md" method="POST">
            <div>
              <label
                className="mb-base block font-label-md text-label-md text-on-surface"
                htmlFor="new_password"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 pr-11 font-body-md text-body-md text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  id="new_password"
                  name="new_password"
                  required
                  type={showNewPassword ? "text" : "password"}
                />
                <PasswordToggleButton
                  label="Toggle new password visibility"
                  onClick={() => setShowNewPassword((current) => !current)}
                  visible={showNewPassword}
                />
              </div>
            </div>

            <div>
              <label
                className="mb-base block font-label-md text-label-md text-on-surface"
                htmlFor="confirm_password"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 pr-11 font-body-md text-body-md text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  id="confirm_password"
                  name="confirm_password"
                  required
                  type={showConfirmPassword ? "text" : "password"}
                />
                <PasswordToggleButton
                  label="Toggle confirm password visibility"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  visible={showConfirmPassword}
                />
              </div>
            </div>

            <div className="mt-stack-md rounded-lg bg-surface-container-low p-4">
              <h3 className="mb-base font-label-md text-label-md text-on-surface-variant">
                Password Requirements:
              </h3>
              <ul className="space-y-2 font-body-md text-body-md text-on-surface-variant">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="text-outline" size={16} />
                  At least 8 characters long
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="text-outline" size={16} />
                  Contains uppercase letter
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="text-outline" size={16} />
                  Contains a number or symbol
                </li>
              </ul>
            </div>

            <button
              className="mt-stack-lg flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-label-md text-label-md text-on-primary transition-all hover:opacity-90 active:scale-[0.98]"
              type="submit"
            >
              <span>Update Password</span>
              <ArrowRight size={18} />
            </button>
          </form>
        </section>
      </main>

      <AuthFooter compact />
    </div>
  );
}
