"use client";

import { Suspense, useState, useMemo } from "react";
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

const COUNTRIES = [
  { code: "ID", name: "Indonesia", flag: "🇮🇩" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "PH", name: "Philippines", flag: "🇵🇭" },
  { code: "TH", name: "Thailand", flag: "🇹🇭" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳" },
  { code: "BN", name: "Brunei Darussalam", flag: "🇧🇳" },
  { code: "TL", name: "Timor-Leste", flag: "🇹🇱" },
  { code: "KH", name: "Cambodia", flag: "🇰🇭" },
  { code: "LA", name: "Laos", flag: "🇱🇦" },
  { code: "MM", name: "Myanmar", flag: "🇲🇲" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "CN", name: "China", flag: "🇨🇳" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
  { code: "FJ", name: "Fiji", flag: "🇫🇯" },
  { code: "PG", name: "Papua New Guinea", flag: "🇵🇬" },
  { code: "NA", name: "Namibia", flag: "🇳🇦" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "EG", name: "Egypt", flag: "🇪🇬" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "NO", name: "Norway", flag: "🇳🇴" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "TR", name: "Turkey", flag: "🇹🇷" },
  { code: "OTHER", name: "Other / Lainnya", flag: "🌍" },
];

type RegisterForm = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone_number?: string;
  country: string;
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

function RegisterFormContent() {
  const t = useTranslations("Auth");

  const registerSchema = z
    .object({
      name: z.string().min(3, t("reg_err_name")),
      email: z.string().email(t("reg_err_email")),
      password: z.string().min(8, t("reg_err_pwd")),
      password_confirmation: z.string(),
      phone_number: z.string().optional(),
      country: z.string().min(2, t("reg_err_country")),
    })
    .refine((d) => d.password === d.password_confirmation, {
      message: t("reg_err_pwd_match"),
      path: ["password_confirmation"],
    });

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get("redirect");

  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      country: "Indonesia",
    },
  });

  const watchedPassword = watch("password", "");

  // Ergonomic password strength score calculation
  const pwdStrength = useMemo(() => {
    if (!watchedPassword) return 0;
    let score = 0;
    if (watchedPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(watchedPassword) && /[0-9]/.test(watchedPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(watchedPassword) || watchedPassword.length >= 12) score += 1;
    return Math.min(3, score);
  }, [watchedPassword]);

  const onSubmit = async (data: RegisterForm) => {
    setServerError("");

    try {
      const res = await api.post<AuthResponse>("/auth/register", data);
      setAuth(res.data.data.user, res.data.data.token);

      if (redirect && redirect.startsWith("/")) {
        router.replace(redirect);
      } else {
        router.replace("/student/dashboard");
      }
    } catch (err: unknown) {
      const errData = (
        err as {
          response?: {
            data?: {
              errors?: Record<string, string[]>;
              message?: string;
            };
          };
        }
      )?.response?.data;

      const firstError = errData?.errors
        ? Object.values(errData.errors)[0]?.[0]
        : errData?.message;

      setServerError(firstError ?? t("reg_failed_fallback"));
    }
  };

  const loginHref = redirect
    ? `/login?redirect=${encodeURIComponent(redirect)}`
    : "/login";

  return (
    <div className="bg-white rounded-3xl p-7 sm:p-9 border border-slate-200/90 shadow-[0_20px_50px_-15px_rgba(7,25,44,0.08)]">
      {/* Title & Introduction */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-[26px] font-extrabold text-[#07192C] font-heading tracking-tight mb-2">
          {t("reg_title")}
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed">
          {t("reg_desc")}
        </p>
      </div>

      {/* Redirect Notice */}
      {redirect && (
        <div className="bg-sky-50/80 border border-sky-200/90 text-sky-900 text-xs px-4 py-3 rounded-2xl mb-6 flex items-start gap-2.5 leading-relaxed">
          <Icon
            name="info"
            size={16}
            className="text-sky-600 shrink-0 mt-0.5"
          />
          <span>
            Daftarkan akun untuk melanjutkan pendaftaran dan pembayaran kursus pilihan Anda.
          </span>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="reg-name"
            className="block text-xs font-bold text-slate-700 tracking-wide"
          >
            {t("name_label")}
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <input
              id="reg-name"
              type="text"
              autoComplete="name"
              placeholder={t("name_placeholder")}
              className={`w-full h-12 pl-11 pr-4 rounded-xl text-sm font-medium text-slate-900 bg-slate-50/70 border transition-all placeholder:text-slate-400 focus:bg-white focus:outline-hidden ${errors.name
                  ? "border-rose-400 ring-2 ring-rose-400/10 focus:border-rose-500"
                  : "border-slate-200 focus:border-sky-600 focus:ring-4 focus:ring-sky-500/10"
                }`}
              {...register("name")}
            />
          </div>
          {errors.name && (
            <p className="text-xs font-medium text-rose-500 pt-0.5">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label
            htmlFor="reg-email"
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
              id="reg-email"
              type="email"
              autoComplete="email"
              placeholder={t("email_placeholder")}
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

        {/* Country & Phone Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Country */}
          <div className="space-y-1.5">
            <label
              htmlFor="reg-country"
              className="block text-xs font-bold text-slate-700 tracking-wide"
            >
              {t("country_label")}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </span>
              <select
                id="reg-country"
                className={`w-full h-12 pl-11 pr-8 rounded-xl text-sm font-medium text-slate-900 bg-slate-50/70 border transition-all focus:bg-white focus:outline-hidden appearance-none cursor-pointer ${errors.country
                    ? "border-rose-400 ring-2 ring-rose-400/10 focus:border-rose-500"
                    : "border-slate-200 focus:border-sky-600 focus:ring-4 focus:ring-sky-500/10"
                  }`}
                {...register("country")}
              >
                <option value="" disabled>
                  {t("country_placeholder")}
                </option>
                {COUNTRIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </div>
            {errors.country && (
              <p className="text-xs font-medium text-rose-500 pt-0.5">
                {errors.country.message}
              </p>
            )}
          </div>

          {/* WhatsApp / Phone */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="reg-phone"
                className="block text-xs font-bold text-slate-700 tracking-wide"
              >
                {t("phone_label")}
              </label>
              <span className="text-[11px] font-normal text-slate-400">
                {t("phone_opt")}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </span>
              <input
                id="reg-phone"
                type="tel"
                autoComplete="tel"
                placeholder="08xx-xxxx-xxxx"
                className="w-full h-12 pl-11 pr-4 rounded-xl text-sm font-medium text-slate-900 bg-slate-50/70 border border-slate-200 transition-all placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-sky-600 focus:ring-4 focus:ring-sky-500/10"
                {...register("phone_number")}
              />
            </div>
          </div>
        </div>

        {/* Passwords */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="reg-password"
              className="block text-xs font-bold text-slate-700 tracking-wide"
            >
              {t("password_label")}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder={t("pwd_placeholder")}
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

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="reg-password-confirm"
              className="block text-xs font-bold text-slate-700 tracking-wide"
            >
              {t("pwd_confirm_label")}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="reg-password-confirm"
                type={showPasswordConfirmation ? "text" : "password"}
                autoComplete="new-password"
                placeholder={t("pwd_confirm_placeholder")}
                className={`w-full h-12 pl-11 pr-11 rounded-xl text-sm font-medium text-slate-900 bg-slate-50/70 border transition-all placeholder:text-slate-400 focus:bg-white focus:outline-hidden ${errors.password_confirmation
                    ? "border-rose-400 ring-2 ring-rose-400/10 focus:border-rose-500"
                    : "border-slate-200 focus:border-sky-600 focus:ring-4 focus:ring-sky-500/10"
                  }`}
                {...register("password_confirmation")}
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirmation((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1"
                aria-label={showPasswordConfirmation ? "Sembunyikan konfirmasi" : "Tampilkan konfirmasi"}
              >
                <PasswordToggleIcon show={showPasswordConfirmation} />
              </button>
            </div>
            {errors.password_confirmation && (
              <p className="text-xs font-medium text-rose-500 pt-0.5">
                {errors.password_confirmation.message}
              </p>
            )}
          </div>
        </div>

        {/* Real-time Password Strength Indicator (Subtle, ergonomic, no AI slop) */}
        {watchedPassword.length > 0 && (
          <div className="pt-1">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-1.5">
              <span>Kekuatan Password</span>
              <span className={
                pwdStrength === 3 ? "text-emerald-600 font-bold" :
                  pwdStrength === 2 ? "text-sky-600 font-bold" : "text-amber-600 font-bold"
              }>
                {pwdStrength === 3 ? t("pwd_strength_strong") :
                  pwdStrength === 2 ? t("pwd_strength_medium") : t("pwd_strength_weak")}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 h-1.5 w-full">
              <div className={`rounded-full transition-all ${pwdStrength >= 1 ? (pwdStrength === 1 ? "bg-amber-400" : "bg-sky-500") : "bg-slate-200"
                }`} />
              <div className={`rounded-full transition-all ${pwdStrength >= 2 ? (pwdStrength === 2 ? "bg-sky-500" : "bg-emerald-500") : "bg-slate-200"
                }`} />
              <div className={`rounded-full transition-all ${pwdStrength >= 3 ? "bg-emerald-500" : "bg-slate-200"
                }`} />
            </div>
          </div>
        )}

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

        {/* Terms notice */}
        <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
          {t("auth_terms_notice")}
        </p>

        {/* Submit Primary CTA */}
        <button
          id="reg-submit"
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
              <span>{t("btn_registering")}</span>
            </span>
          ) : (
            <span>{t("btn_register")}</span>
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="mt-6 pt-5 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-500 font-normal">
          {t("has_account")}{" "}
          <Link
            href={loginHref}
            className="font-bold text-sky-600 hover:text-sky-700 hover:underline transition-colors ml-1"
          >
            {t("login_here")}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm text-center text-slate-400 text-sm">
          Memuat formulir pendaftaran...
        </div>
      }
    >
      <RegisterFormContent />
    </Suspense>
  );
}
