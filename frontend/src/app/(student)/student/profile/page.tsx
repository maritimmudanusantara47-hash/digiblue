'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/Icon';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function StudentProfilePage() {
  const { user, updateUser } = useAuthStore();

  // Profile Form State
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [institution, setInstitution] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load existing data
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhoneNumber(user.phone_number || '');
      setInstitution(user.institution || '');
    }
  }, [user]);

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);

    if (!name.trim()) {
      setProfileMsg({ type: 'error', text: 'Nama lengkap wajib diisi.' });
      return;
    }

    try {
      setIsSavingProfile(true);
      const res = await api.put('/auth/profile', {
        name: name.trim(),
        phone_number: phoneNumber.trim() || null,
        institution: institution.trim() || null,
      });

      if (res.data?.data) {
        updateUser(res.data.data);
      } else {
        updateUser({
          name: name.trim(),
          phone_number: phoneNumber.trim(),
          institution: institution.trim(),
        });
      }

      setProfileMsg({ type: 'success', text: 'Data profil berhasil diperbarui!' });
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Gagal menyimpan profil.';
      setProfileMsg({ type: 'error', text: errMsg });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!currentPassword) {
      setPasswordMsg({ type: 'error', text: 'Password saat ini harus diisi.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'Password baru minimal 8 karakter.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Konfirmasi password baru tidak cocok.' });
      return;
    }

    try {
      setIsSavingPassword(true);
      await api.put('/auth/password', {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      setPasswordMsg({ type: 'success', text: 'Password berhasil diubah!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const errMsg =
        err.response?.data?.errors?.current_password?.[0] ||
        err.response?.data?.message ||
        'Gagal mengubah password.';
      setPasswordMsg({ type: 'error', text: errMsg });
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy-dark tracking-tight">Profil & Akun</h1>
        <p className="text-slate-500 text-sm mt-1">
          Kelola informasi identitas diri dan keamanan akun Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Card 1: Data Diri */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Icon name="user-4" size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">Informasi Pribadi</h2>
              <p className="text-xs text-slate-400">Data ini digunakan untuk sertifikat & koordinasi</p>
            </div>
          </div>

          {profileMsg && (
            <div
              className={`mt-4 p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                profileMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              <Icon name={profileMsg.type === 'success' ? 'check-circle-1' : 'info'} size={15} />
              <span>{profileMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
            {/* Nama Lengkap */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap & Gelar <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Budi Santoso, S.Kel"
                required
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                ⚠️ Pastikan nama benar karena akan dicetak langsung di sertifikat resmi.
              </p>
            </div>

            {/* Email (Readonly) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
              />
              <p className="text-[11px] text-slate-400 mt-1">Email akun login (tidak dapat diubah)</p>
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor WhatsApp / HP
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
              <p className="text-[11px] text-slate-400 mt-1">Untuk koordinasi angkatan dan grup materi.</p>
            </div>

            {/* Institusi */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Institusi / Universitas / Lembaga
              </label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="Contoh: Institut Pertanian Bogor"
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingProfile}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-navy-dark hover:bg-slate-800 text-white font-medium text-xs tracking-wide transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSavingProfile ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Icon name="check" size={14} />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Card 2: Ganti Password */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Icon name="locked-1" size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">Keamanan & Password</h2>
              <p className="text-xs text-slate-400">Perbarui kata sandi akun secara berkala</p>
            </div>
          </div>

          {passwordMsg && (
            <div
              className={`mt-4 p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                passwordMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              <Icon name={passwordMsg.type === 'success' ? 'check-circle-1' : 'info'} size={15} />
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="mt-5 space-y-4">
            {/* Password Lama */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password Saat Ini <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Masukkan password saat ini"
                required
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              />
            </div>

            {/* Password Baru */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password Baru (Min. 8 Karakter) <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Masukkan password baru"
                required
                minLength={8}
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              />
            </div>

            {/* Konfirmasi Password Baru */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Konfirmasi Password Baru <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                required
                minLength={8}
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingPassword}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs tracking-wide transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSavingPassword ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memperbarui...</span>
                </>
              ) : (
                <>
                  <Icon name="shield-2-check" size={14} />
                  <span>Perbarui Password</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
