"use client";

import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { AuthResponse } from "@/types";
import Icon from "@/components/Icon";
import { useTranslations } from "next-intl";

type LoginForm = {
  email: string;
  password: string;
};

function PasswordToggleIcon({ show }: { show: boolean }) {
  if (show) {
    return (
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    );
  }

  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function LoginFormContent() {
  const t = useTranslations("Auth");

  const loginSchema = z.object({
    email: z.string().email(t("login_err_email")),
    password: z.string().min(6, t("login_err_pwd")),
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get("redirect");

  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setServerError("");

    try {
      const res = await api.post<AuthResponse>("/auth/login", data);
      const { token, user } = res.data.data;
      setAuth(user, token);

      if (redirect && redirect.startsWith("/")) {
        router.replace(redirect);
        return;
      }

      const role = user.roles?.[0]?.name ?? "student";
      if (role === "admin") {
        router.replace("/admin/dashboard");
      } else if (role === "assessor") {
        router.replace("/assessor/dashboard");
      } else {
        router.replace("/student/dashboard");
      }
    } catch (err: unknown) {
      const msg =
        (
          err as {
            response?: {
              data?: {
                message?: string;
              };
            };
          }
        )?.response?.data?.message ?? t("login_failed_fallback");

      setServerError(msg);
    }
  };

  const registerHref = redirect
    ? `/register?redirect=${encodeURIComponent(redirect)}`
    : "/register";

  return (
    <div className="bg-white rounded-3xl p-7 sm:p-9 border border-slate-200/90 shadow-[0_20px_50px_-15px_rgba(7,25,44,0.08)]">
      {/* Title & Introduction */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-[26px] font-extrabold text-[#07192C] font-heading tracking-tight mb-2">
          {t("login_title")}
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed">
          {t("login_desc")}
        </p>
      </div>

      {/* Redirect Context Banner */}
      {redirect && (
        <div className="bg-sky-50/80 border border-sky-200/90 text-sky-900 text-xs px-4 py-3 rounded-2xl mb-6 flex items-start gap-2.5 leading-relaxed">
          <Icon
            name="info"
            size={16}
            className="text-sky-600 shrink-0 mt-0.5"
          />
          <span>
            Silakan masuk untuk melanjutkan ke program pelatihan yang Anda pilih.
          </span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="login-email"
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
              id="login-email"
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

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="login-password"
              className="block text-xs font-bold text-slate-700 tracking-wide"
            >
              {t("password_label")}
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors"
            >
              {t("forgot_password_link")}
            </Link>
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className={`w-full h-12 pl-11 pr-11 rounded-xl text-sm font-medium text-slate-900 bg-slate-50/70 border transition-all placeholder:text-slate-400 focus:bg-white focus:outline-hidden ${errors.password
                  ? "border-rose-400 ring-2 ring-rose-400/10 focus:border-rose-500"
                  : "border-slate-200 focus:border-sky-600 focus:ring-4 focus:ring-sky-500/10"
                }`}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1"
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              <PasswordToggleIcon show={showPassword} />
            </button>
          </div>
          {errors.password && (
            <p className="text-xs font-medium text-rose-500 pt-0.5">
              {errors.password.message}
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
          id="login-submit"
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
              <span>{t("btn_processing")}</span>
            </span>
          ) : (
            <span>{t("btn_login")}</span>
          )}
        </button>
      </form>

      {/* Switch to Register */}
      <div className="mt-6 pt-5 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-500 font-normal">
          {t("no_account")}{" "}
          <Link
            href={registerHref}
            className="font-bold text-sky-600 hover:text-sky-700 hover:underline transition-colors ml-1"
          >
            {t("register_here")}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm text-center text-slate-400 text-sm">
          Memuat formulir masuk...
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
