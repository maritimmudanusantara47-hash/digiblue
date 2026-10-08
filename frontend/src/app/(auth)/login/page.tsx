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

      // Prioritas redirect
      if (redirect && redirect.startsWith("/")) {
        router.replace(redirect);
        return;
      }

      // Redirect default berdasarkan role
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
    <div className="animate-fadeup">
      <h1 className="text-2xl font-extrabold text-navy-dark mb-1">
        {t("login_title")}
      </h1>

      <p className="text-slate-500 text-sm mb-6">{t("login_desc")}</p>

      {redirect && (
        <div className="bg-sky-50 border border-sky-200 text-sky-800 text-xs px-4 py-3 rounded-xl mb-6 flex items-center gap-2.5">
          <Icon
            name="info"
            size={16}
            className="text-sky-600 shrink-0"
          />

          <span>
            Please log in to continue the enrollment process for your selected
            course.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {/* Email */}
        <div className="form-group flex flex-col gap-1.5">
          <label className="form-label">{t("email_label")}</label>

          <input
            id="login-email"
            type="email"
            placeholder={t("placeholder_email")}
            className={`form-input ${errors.email ? "error" : ""}`}
            {...register("email")}
          />

          {errors.email && (
            <span className="form-error">{errors.email.message}</span>
          )}
        </div>

        {/* Password */}
        <div className="form-group flex flex-col gap-1.5">
          <label className="form-label">{t("password_label")}</label>

          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
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

        {/* Server Error */}
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
            {serverError}
          </div>
        )}

        {/* Submit */}
        <button
          id="login-submit"
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-[#0f2b48] font-bold text-sm rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer font-heading disabled:opacity-50 mt-1"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />

                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>

              {t("btn_processing")}
            </span>
          ) : (
            t("btn_login")
          )}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        {t("no_account")}{" "}
        <Link
          href={registerHref}
          className="font-semibold text-navy hover:text-gold transition-colors"
        >
          {t("register_here")}
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-400 text-sm">
          Memuat formulir masuk...
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
