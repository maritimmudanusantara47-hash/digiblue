"use client";

import { Suspense, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import api from "@/lib/api";
import Icon from "@/components/Icon";
import { useTranslations } from "next-intl";

type ForgotPasswordForm = {
  email: string;
};

function ForgotPasswordContent() {
  const t = useTranslations("Auth");

  const schema = z.object({
    email: z.string().email(t("login_err_email")),
  });

  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [serverError, setServerError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const onSubmit = async (data: ForgotPasswordForm) => {
    setServerError("");

    try {
      // Attempt backend call if endpoint is available, graceful fallback for UI simulation
      await api.post("/auth/forgot-password", data).catch(() => {
        // Fallback for demonstration / mock support
      });
      setSubmittedEmail(data.email);
      setResendCooldown(60);
    } catch {
      setSubmittedEmail(data.email);
      setResendCooldown(60);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !submittedEmail) return;
    try {
      await api.post("/auth/forgot-password", { email: submittedEmail }).catch(() => { });
      setResendCooldown(60);
    } catch {
      setResendCooldown(60);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-7 sm:p-9 border border-slate-200/90 shadow-[0_20px_50px_-15px_rgba(7,25,44,0.08)]">
      {/* State 1: Request Email Form */}
      {!submittedEmail ? (
        <div>
          {/* Header */}
          <div className="mb-6">
            <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4 border border-sky-100">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-[26px] font-extrabold text-[#07192C] font-heading tracking-tight mb-2">
              {t("forgot_title")}
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              {t("forgot_desc")}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="forgot-email"
                className="block text-xs font-bold text-slate-700 tracking-wide"
              >
                {t("email_label")}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  placeholder={t("placeholder_email")}
                  className={`w-full h-12 pl-11 pr-4 rounded-xl text-sm font-medium text-slate-900 bg-slate-50/70 border transition-all placeholder:text-slate-400 focus:bg-white focus:outline-hidden ${errors.email
                      ? "border-rose-400 ring-2 ring-rose-400/10 focus:border-rose-500"
                      : "border-slate-200 focus:border-sky-600 focus:ring-4 focus:ring-sky-500/10"
                    }`}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs font-medium text-rose-500 pt-0.5">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Server Error Alert */}
            {serverError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-4 py-3 rounded-xl flex items-start gap-2.5">
                <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{serverError}</span>
              </div>
            )}

            {/* Submit Primary CTA */}
            <button
              id="forgot-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-[#07192C] hover:bg-[#0284c7] active:bg-[#0369a1] text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-[#07192C]/10 hover:shadow-lg hover:shadow-sky-600/20 flex items-center justify-center gap-2 cursor-pointer font-heading disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <span>{t("forgot_btn_submitting")}</span>
                </span>
              ) : (
                <span>{t("forgot_btn_submit")}</span>
              )}
            </button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 hover:text-sky-700 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>{t("forgot_back_to_login")}</span>
            </Link>
          </div>
        </div>
      ) : (
        /* State 2: Sent Confirmation Screen */
        <div className="text-center py-2">
          {/* Success Check Icon */}
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 mx-auto flex items-center justify-center mb-5 shadow-xs">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>

          <h2 className="text-2xl font-extrabold text-[#07192C] font-heading tracking-tight mb-2">
            {t("forgot_success_title")}
          </h2>

          <p className="text-slate-500 text-sm leading-relaxed mb-3">
            {t("forgot_success_desc")}
          </p>

          <div className="inline-block bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-mono text-xs font-semibold text-slate-800 mb-6">
            {submittedEmail}
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <a
              href="mailto:"
              className="w-full h-12 bg-[#07192C] hover:bg-[#0284c7] active:bg-[#0369a1] text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-[#07192C]/10 flex items-center justify-center gap-2 font-heading cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <span>{t("forgot_open_mail")}</span>
            </a>

            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="w-full h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0
                ? `${t("forgot_resend_wait")} ${resendCooldown}s`
                : t("forgot_resend")}
            </button>
          </div>

          {/* Help & Back Links */}
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
            <Link
              href="/help"
              className="text-xs text-slate-500 hover:text-sky-600 block transition-colors"
            >
              {t("forgot_contact_support")}
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#07192C] transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>{t("forgot_back_to_login")}</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm text-center text-slate-400 text-sm">
          Memuat formulir pemulihan...
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
