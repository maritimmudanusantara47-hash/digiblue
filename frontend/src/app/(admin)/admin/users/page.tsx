'use client';

import Icon from '@/components/Icon';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { useTranslations } from 'next-intl';
import { showConfirm, showSuccess, showError } from '@/lib/swal';

interface User {
  id: number;
  name: string;
  email: string;
  phone_number?: string;
  country?: string;
  institution?: string;
  email_verified_at: string | null;
  created_at: string;
  roles: { name: string }[];
}

const ROLE_BADGE: Record<string, string> = {
  admin:    'bg-gold/20 text-yellow-700 border-gold/40',
  assessor: 'bg-purple-100 text-purple-700 border-purple-300',
  student:  'bg-blue-100 text-blue-700 border-blue-300',
};

export default function AdminUsersPage() {
  const t = useTranslations('AdminUsers');
  const [users, setUsers]     = useState<User[]>([]);
  const [search, setSearch]   = useState('');
  const [roleFilter, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const perPage = 15;

  const handleManualVerify = async (userId: number) => {
    const isConfirmed = await showConfirm(
      'Verifikasi Email User?',
      'Apakah Anda yakin ingin memverifikasi email user ini secara manual?',
      'Ya, Verifikasi'
    );
    if (!isConfirmed) return;
    setVerifyingId(userId);
    try {
      const res = await api.post(`/admin/users/${userId}/verify`);
      showSuccess('Berhasil!', res.data.message || 'User berhasil diverifikasi!');
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, email_verified_at: new Date().toISOString() } : u));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showError('Gagal!', msg || 'Gagal memverifikasi user.');
    } finally {
      setVerifyingId(null);
    }
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
      if (search)     params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      const res = await api.get(`/admin/users?${params}`);
      const d   = res.data.data;
      setUsers(d?.data ?? d ?? []);
      setTotal(d?.meta?.total ?? d?.total ?? 0);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="animate-fadeup">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-navy-dark">{t('title')}</h1>
        <p className="text-slate-500 text-sm mt-1">{t('subtitle')}</p>
      </div>

      <div className="card mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-wrap">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"><Icon name="search-1" size={14} /></span>
            <input
              id="user-search"
              type="text"
              placeholder={t('placeholder_search')}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="form-input pl-9 py-2 text-sm w-64"
            />
          </div>
          <select
            id="role-filter"
            value={roleFilter}
            onChange={e => { setRole(e.target.value); setPage(1); }}
            className="form-input py-2 text-sm"
          >
            <option value="">{t('opt_all_roles')}</option>
            <option value="admin">{t('opt_admin')}</option>
            <option value="assessor">{t('opt_assessor')}</option>
            <option value="student">{t('opt_student')}</option>
          </select>
        </div>
        <span className="text-slate-400 text-sm">{total} {t('lbl_registered_users')}</span>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-navy text-white">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">{t('col_no')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('col_name')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('col_email')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('col_country')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('col_role')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('col_verified')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('col_joined')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-navy" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      {t('msg_loading')}
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    {t('msg_empty')}
                  </td>
                </tr>
              ) : users.map((u, i) => {
                const role = u.roles?.[0]?.name ?? 'student';
                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-400">{(page - 1) * perPage + i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center font-bold text-navy text-xs">
                          {u.name[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-navy-dark">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{u.country ?? u.institution ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${ROLE_BADGE[role] ?? 'bg-slate-100 text-slate-600 border-slate-300'}`}>
                        {role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.email_verified_at ? (
                        <span className="inline-flex items-center text-emerald-600 text-xs font-semibold bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                          <Icon name="check" size={14} className="mr-1" />
                          {t('lbl_verified')}
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center text-amber-600 text-xs font-semibold bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                            <Icon name="hourglass" size={14} className="mr-1" />
                            {t('lbl_unverified')}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleManualVerify(u.id)}
                            disabled={verifyingId === u.id}
                            className="px-2 py-1 text-[11px] font-bold bg-navy text-white rounded-lg hover:bg-navy-dark transition shadow-xs disabled:opacity-50 whitespace-nowrap"
                            title="Verifikasi email user ini langsung tanpa harus klik email"
                          >
                            {verifyingId === u.id ? '...' : 'Verifikasi'}
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-secondary btn-sm disabled:opacity-40"><Icon name="arrow-left" size={16} className="mr-1.5" />{t('btn_prev')}</button>
            <span className="text-sm text-slate-500">{t('lbl_page')} {page} {t('lbl_of')} {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-secondary btn-sm disabled:opacity-40">{t('btn_next')} <Icon name="arrow-right" size={14} className="ml-1.5" /></button>
          </div>
        )}
      </div>
    </div>
  );
}
