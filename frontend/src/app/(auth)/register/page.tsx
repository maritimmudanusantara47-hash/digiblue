'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { AuthResponse } from '@/types';

const registerSchema = z.object({
  name:             z.string().min(3, 'Nama minimal 3 karakter'),
  email:            z.string().email('Format email tidak valid'),
  password:         z.string().min(8, 'Password minimal 8 karakter'),
  password_confirmation: z.string(),
  phone_number:     z.string().optional(),
  institution:      z.string().min(2, 'Masukkan nama institusi / universitas'),
}).refine(d => d.password === d.password_confirmation, {
  message: 'Konfirmasi password tidak cocok',
  path: ['password_confirmation'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router  = useRouter();
  const setAuth = useAuthStore(s => s.setAuth);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setServerError('');
    try {
      const res = await api.post<AuthResponse>('/auth/register', data);
      setAuth(res.data.data.user, res.data.data.token);
      router.replace('/student/dashboard');
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } })?.response?.data;
      const firstError = errData?.errors ? Object.values(errData.errors)[0][0] : errData?.message;
      setServerError(firstError ?? 'Registrasi gagal. Coba lagi.');
    }
  };

  return (
    <div className="animate-fadeup">
      <h1 className="text-2xl font-extrabold text-navy-dark mb-1">Buat Akun Baru 🚀</h1>
      <p className="text-slate-500 text-sm mb-8">Daftar untuk memulai perjalanan Blue Economy-mu</p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Nama */}
        <div className="flex flex-col gap-1.5">
          <label className="form-label">Nama Lengkap</label>
          <input id="reg-name" type="text" placeholder="Nama Lengkap"
            className={`form-input ${errors.name ? 'error' : ''}`} {...register('name')} />
          {errors.name && <span className="form-error">{errors.name.message}</span>}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="form-label">Email</label>
          <input id="reg-email" type="email" placeholder="email@kamu.com"
            className={`form-input ${errors.email ? 'error' : ''}`} {...register('email')} />
          {errors.email && <span className="form-error">{errors.email.message}</span>}
        </div>

        {/* Institusi */}
        <div className="flex flex-col gap-1.5">
          <label className="form-label">Institusi / Universitas</label>
          <input id="reg-institution" type="text" placeholder="Universitas Indonesia"
            className={`form-input ${errors.institution ? 'error' : ''}`} {...register('institution')} />
          {errors.institution && <span className="form-error">{errors.institution.message}</span>}
        </div>

        {/* No. WhatsApp */}
        <div className="flex flex-col gap-1.5">
          <label className="form-label">No. WhatsApp <span className="text-slate-400 font-normal">(opsional)</span></label>
          <input id="reg-phone" type="tel" placeholder="08xx-xxxx-xxxx"
            className="form-input" {...register('phone_number')} />
        </div>

        {/* Password row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="form-label">Password</label>
            <input id="reg-password" type="password" placeholder="Min. 8 karakter"
              className={`form-input ${errors.password ? 'error' : ''}`} {...register('password')} />
            {errors.password && <span className="form-error">{errors.password.message}</span>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="form-label">Konfirmasi</label>
            <input id="reg-password-confirm" type="password" placeholder="Ulangi password"
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
          {isSubmitting ? 'Mendaftarkan...' : 'Buat Akun'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-5">
        Sudah punya akun?{' '}
        <Link href="/login" className="font-semibold text-navy hover:text-gold transition-colors">
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}
