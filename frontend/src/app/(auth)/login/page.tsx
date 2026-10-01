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

const loginSchema = z.object({
  email:    z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router   = useRouter();
  const setAuth  = useAuthStore(s => s.setAuth);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setServerError('');
    try {
      const res = await api.post<AuthResponse>('/auth/login', data);
      const { token, user } = res.data.data;
      setAuth(user, token);

      // Redirect berdasarkan role
      const role = user.roles?.[0]?.name ?? 'student';
      if (role === 'admin')         router.replace('/admin/dashboard');
      else if (role === 'assessor') router.replace('/assessor/dashboard');
      else                          router.replace('/student/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Login gagal. Periksa email dan password.';
      setServerError(msg);
    }
  };

  return (
    <div className="animate-fadeup">
      <h1 className="text-2xl font-extrabold text-navy-dark mb-1">Selamat Datang Kembali 👋</h1>
      <p className="text-slate-500 text-sm mb-8">Masuk ke akun DigiBlueCamp kamu</p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {/* Email */}
        <div className="form-group flex flex-col gap-1.5">
          <label className="form-label">Email</label>
          <input
            id="login-email"
            type="email"
            placeholder="email@kamu.com"
            className={`form-input ${errors.email ? 'error' : ''}`}
            {...register('email')}
          />
          {errors.email && <span className="form-error">{errors.email.message}</span>}
        </div>

        {/* Password */}
        <div className="form-group flex flex-col gap-1.5">
          <label className="form-label">Password</label>
          <input
            id="login-password"
            type="password"
            placeholder="••••••••"
            className={`form-input ${errors.password ? 'error' : ''}`}
            {...register('password')}
          />
          {errors.password && <span className="form-error">{errors.password.message}</span>}
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
          className="btn btn-primary btn-lg w-full mt-1"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Memproses...
            </span>
          ) : 'Masuk'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Belum punya akun?{' '}
        <Link href="/register" className="font-semibold text-navy hover:text-gold transition-colors">
          Daftar sekarang
        </Link>
      </p>
    </div>
  );
}
