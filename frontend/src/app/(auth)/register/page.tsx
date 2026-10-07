'use client';

import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { AuthResponse } from '@/types';
import Icon from '@/components/Icon';
import { useTranslations } from 'next-intl';

const COUNTRIES = [
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'BN', name: 'Brunei Darussalam', flag: '🇧🇳' },
  { code: 'TL', name: 'Timor-Leste', flag: '🇹🇱' },
  { code: 'KH', name: 'Cambodia', flag: '🇰🇭' },
  { code: 'LA', name: 'Laos', flag: '🇱🇦' },
  { code: 'MM', name: 'Myanmar', flag: '🇲🇲' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'FJ', name: 'Fiji', flag: '🇫🇯' },
  { code: 'PG', name: 'Papua New Guinea', flag: '🇵🇬' },
  { code: 'NA', name: 'Namibia', flag: '🇳🇦' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'OTHER', name: 'Other / Lainnya', flag: '🌍' },
];

type RegisterForm = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone_number?: string;
  country: string;
};

function RegisterFormContent() {
  const t = useTranslations('Auth');
  const registerSchema = z.object({
    name:             z.string().min(3, t('reg_err_name')),
    email:            z.string().email(t('reg_err_email')),
    password:         z.string().min(8, t('reg_err_pwd')),
    password_confirmation: z.string(),
    phone_number:     z.string().optional(),
    country:          z.string().min(2, t('reg_err_country')),
  }).refine(d => d.password === d.password_confirmation, {
    message: t('reg_err_pwd_match'),
    path: ['password_confirmation'],
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get('redirect');

  const setAuth = useAuthStore(s => s.setAuth);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      country: 'Indonesia',
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setServerError('');
    try {
      const res = await api.post<AuthResponse>('/auth/register', data);
      setAuth(res.data.data.user, res.data.data.token);

      // Prioritaskan redirect jika user datang dari tombol daftar kursus
      if (redirect && redirect.startsWith('/')) {
        router.replace(redirect);
      } else {
        router.replace('/student/dashboard');
      }
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } })?.response?.data;
      const firstError = errData?.errors ? Object.values(errData.errors)[0][0] : errData?.message;
      setServerError(firstError ?? t('reg_failed_fallback'));
    }
  };

  const loginHref = redirect
    ? `/login?redirect=${encodeURIComponent(redirect)}`
    : '/login';

  return (
    <div className="animate-fadeup">
      <h1 className="text-2xl font-extrabold text-navy-dark mb-1">{t('reg_title')}</h1>
      <p className="text-slate-500 text-sm mb-6">{t('reg_desc')}</p>

      {redirect && (
        <div className="bg-sky-50 border border-sky-200 text-sky-800 text-xs px-4 py-3 rounded-xl mb-6 flex items-center gap-2.5">
          <Icon name="information" size={16} className="text-sky-600 shrink-0" />
          <span>Complete your account registration to proceed to the checkout for your selected course.</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Nama */}
        <div className="flex flex-col gap-1.5">
          <label className="form-label">{t('name_label')}</label>
          <input id="reg-name" type="text" placeholder={t("name_placeholder")}
            className={`form-input ${errors.name ? 'error' : ''}`} {...register('name')} />
          {errors.name && <span className="form-error">{errors.name.message}</span>}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="form-label">{t('email_label')}</label>
          <input id="reg-email" type="email" placeholder={t("email_placeholder")}
            className={`form-input ${errors.email ? 'error' : ''}`} {...register('email')} />
          {errors.email && <span className="form-error">{errors.email.message}</span>}
        </div>

        {/* Negara / Country */}
        <div className="flex flex-col gap-1.5">
          <label className="form-label">{t('country_label')}</label>
          <select
            id="reg-country"
            className={`form-input ${errors.country ? 'error' : ''}`}
            {...register('country')}
          >
            <option value="" disabled>{t('country_placeholder')}</option>
            {COUNTRIES.map(c => (
              <option key={c.name} value={c.name}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
          {errors.country && <span className="form-error">{errors.country.message}</span>}
        </div>

        {/* {t('phone_label')} */}
        <div className="flex flex-col gap-1.5">
          <label className="form-label">{t('phone_label')} <span className="text-slate-400 font-normal">{t('phone_opt')}</span></label>
          <input id="reg-phone" type="tel" placeholder="08xx-xxxx-xxxx"
            className="form-input" {...register('phone_number')} />
        </div>

        {/* Password row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="form-label">{t('password_label')}</label>
            <input id="reg-password" type="password" placeholder={t("pwd_placeholder")}
              className={`form-input ${errors.password ? 'error' : ''}`} {...register('password')} />
            {errors.password && <span className="form-error">{errors.password.message}</span>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="form-label">{t('pwd_confirm_label')}</label>
            <input id="reg-password-confirm" type="password" placeholder={t("pwd_confirm_placeholder")}
              className={`form-input ${errors.password_confirmation ? 'error' : ''}`}
              {...register('password_confirmation')} />
            {errors.password_confirmation && (
              <span className="form-error">{errors.password_confirmation.message}</span>
            )}
          </div>
        </div>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
            {serverError}
          </div>
        )}

        <button id="reg-submit" type="submit" disabled={isSubmitting}
          className="btn btn-primary btn-lg w-full mt-1">
          {isSubmitting ? t('btn_registering') : t('btn_register')}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-5">
        {t('has_account')}{' '}
        <Link href={loginHref} className="font-semibold text-navy hover:text-gold transition-colors">
          {t('login_here')}
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 text-sm">Memuat formulir pendaftaran...</div>}>
      <RegisterFormContent />
    </Suspense>
  );
}
