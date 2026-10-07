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
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M3 3L21 21"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M10.58 10.59A2 2 0 0 0 13.41 13.42"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M9.88 4.25A9.97 9.97 0 0 1 12 4C17.2 4 20.7 8.4 21.5 10.5C21.2 11.3 20.5 12.5 19.47 13.7M6.7 6.72C4.94 7.8 3.78 9.46 3.5 10.5C4.3 12.6 7.8 17 12 17C13.42 17 14.66 16.57 15.72 15.92"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
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
  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      country: "Indonesia",
    },
  });

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
    <div className="animate-fadeup">
      <h1 className="text-2xl font-extrabold text-navy-dark mb-1">
        {t("reg_title")}
      </h1>

      <p className="text-slate-500 text-sm mb-6">{t("reg_desc")}</p>

      {redirect && (
        <div className="bg-sky-50 border border-sky-200 text-sky-800 text-xs px-4 py-3 rounded-xl mb-6 flex items-center gap-2.5">
          <Icon
            name="information"
            size={16}
            className="text-sky-600 shrink-0"
          />
          <span>
            Complete your account registration to proceed to the checkout for
            your selected course.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Nama */}
        <div className="flex flex-col gap-1.5">
          <label className="form-label">{t("name_label")}</label>

          <input
            id="reg-name"
            type="text"
            placeholder={t("name_placeholder")}
            className={`form-input ${errors.name ? "error" : ""}`}
            {...register("name")}
          />

          {errors.name && (
            <span className="form-error">{errors.name.message}</span>
          )}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="form-label">{t("email_label")}</label>

          <input
            id="reg-email"
            type="email"
            placeholder={t("email_placeholder")}
            className={`form-input ${errors.email ? "error" : ""}`}
            {...register("email")}
          />

          {errors.email && (
            <span className="form-error">{errors.email.message}</span>
          )}
        </div>

        {/* Country */}
        <div className="flex flex-col gap-1.5">
          <label className="form-label">{t("country_label")}</label>

          <select
            id="reg-country"
            className={`form-input ${errors.country ? "error" : ""}`}
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

          {errors.country && (
            <span className="form-error">{errors.country.message}</span>
          )}
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-1.5">
          <label className="form-label">
            {t("phone_label")}{" "}
            <span className="text-slate-400 font-normal">{t("phone_opt")}</span>
          </label>

          <input
            id="reg-phone"
            type="tel"
            placeholder="08xx-xxxx-xxxx"
            className="form-input"
            {...register("phone_number")}
          />
        </div>

        {/* Password row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="form-label">{t("password_label")}</label>

            <div className="relative">
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                placeholder={t("pwd_placeholder")}
                className={`form-input pr-11 ${errors.password ? "error" : ""}`}
                {...register("password")}
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy transition-colors p-1"
                aria-label={
                  showPassword ? "Sembunyikan password" : "Tampilkan password"
                }
              >
                <PasswordToggleIcon show={showPassword} />
              </button>
            </div>

            {errors.password && (
              <span className="form-error">{errors.password.message}</span>
            )}
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1.5">
            <label className="form-label">{t("pwd_confirm_label")}</label>

            <div className="relative">
              <input
                id="reg-password-confirm"
                type={showPasswordConfirmation ? "text" : "password"}
                placeholder={t("pwd_confirm_placeholder")}
                className={`form-input pr-11 ${
                  errors.password_confirmation ? "error" : ""
                }`}
                {...register("password_confirmation")}
              />

              <button
                type="button"
                onClick={() => setShowPasswordConfirmation((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy transition-colors p-1"
                aria-label={
                  showPasswordConfirmation
                    ? "Sembunyikan konfirmasi password"
                    : "Tampilkan konfirmasi password"
                }
              >
                <PasswordToggleIcon show={showPasswordConfirmation} />
              </button>
            </div>

            {errors.password_confirmation && (
              <span className="form-error">
                {errors.password_confirmation.message}
              </span>
            )}
          </div>
        </div>

        {/* Server Error */}
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
            {serverError}
          </div>
        )}

        {/* Submit */}
        <button
          id="reg-submit"
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-[#0f2b48] font-bold text-sm rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer font-heading disabled:opacity-50 mt-1"
        >
          {isSubmitting ? t('btn_registering') : t('btn_register')}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-5">
        {t("has_account")}{" "}
        <Link
          href={loginHref}
          className="font-semibold text-navy hover:text-gold transition-colors"
        >
          {t("login_here")}
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-400 text-sm">
          Memuat formulir pendaftaran...
        </div>
      }
    >
      <RegisterFormContent />
    </Suspense>
  );
}
