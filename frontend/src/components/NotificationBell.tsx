'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import api from '@/lib/api';
import type { UserNotification } from '@/types';

interface NotificationBellProps {
  className?: string;
  buttonClassName?: string;
}

export default function NotificationBell({
  className = '',
  buttonClassName = '',
}: NotificationBellProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [markingAll, setMarkingAll] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Format relative time (Bahasa Indonesia)
  const formatTimeAgo = (dateString: string) => {
    try {
      const now = new Date();
      const date = new Date(dateString);
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) return 'Baru saja';
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      if (diffInMinutes < 60) return `${diffInMinutes} mnt lalu`;
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours} jam lalu`;
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays} hari lalu`;

      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return '';
    }
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications?per_page=15');
      if (res.data) {
        setNotifications(res.data.data || []);
        setUnreadCount(res.data.unread_count ?? 0);
      }
    } catch {
      // Ignored if user session is expired or not authenticated
    }
  }, []);

  // Polling data notifikasi setiap 30 detik saat window aktif
  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchNotifications();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Klik di luar dropdown untuk menutup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(prev => !prev);
  };

  const handleMarkAsRead = async (notification: UserNotification, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (!notification.is_read) {
      try {
        await api.patch(`/notifications/${notification.id}/read`);
        setNotifications(prev =>
          prev.map(n => (n.id === notification.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }

    if (notification.action_url) {
      setIsOpen(false);
      router.push(notification.action_url);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDeleteNotification = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => {
        const item = prev.find(n => n.id === id);
        if (item && !item.is_read) {
          setUnreadCount(c => Math.max(0, c - 1));
        }
        return prev.filter(n => n.id !== id);
      });
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  // Helper styling icon sesuai tipe notifikasi
  const getNotificationIconMeta = (type: string, iconName?: string | null) => {
    switch (type) {
      case 'submission_graded':
        return {
          icon: iconName || 'pencil-1',
          bg: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60',
        };
      case 'new_submission':
        return {
          icon: iconName || 'pen-to-square',
          bg: 'bg-purple-50 text-purple-600 border border-purple-200/60',
        };
      case 'certificate_issued':
        return {
          icon: iconName || 'certificate-badge-1',
          bg: 'bg-amber-50 text-amber-600 border border-amber-200/60',
        };
      case 'enrollment_activated':
        return {
          icon: iconName || 'book-1',
          bg: 'bg-sky-50 text-sky-600 border border-sky-200/60',
        };
      case 'new_enrollment':
      case 'payment_received':
        return {
          icon: iconName || 'credit-card-multiple',
          bg: 'bg-blue-50 text-blue-600 border border-blue-200/60',
        };
      default:
        return {
          icon: iconName || 'bell',
          bg: 'bg-slate-100 text-slate-600 border border-slate-200',
        };
    }
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Trigger Bell Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        className={`relative p-2.5 rounded-xl border border-slate-200/80 bg-white text-slate-700 hover:text-sky-600 hover:border-sky-300 hover:bg-sky-50/50 transition-all duration-200 shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-400/30 ${buttonClassName}`}
        aria-label="Notifikasi"
        title="Notifikasi"
      >
        <Icon name="bell" size={19} className="transition-transform group-hover:scale-105" />

        {/* Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] px-1 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-60"></span>
            <span className="relative inline-flex items-center justify-center rounded-full h-5 min-w-[20px] px-1 bg-gradient-to-r from-rose-500 to-red-600 text-[10px] font-black text-white shadow-xs border-2 border-white leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-fadeup origin-top-right">
          {/* Header */}
          <div className="px-4 py-3.5 bg-slate-50/90 border-b border-slate-200/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-[#07192C]">Notifikasi</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700 border border-sky-200">
                  {unreadCount} baru
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={markingAll}
                className="text-[11px] font-bold text-sky-600 hover:text-sky-800 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Icon name="check-circle-1" size={13} />
                <span>{markingAll ? 'Memproses...' : 'Tandai semua dibaca'}</span>
              </button>
            )}
          </div>

          {/* List of Notifications */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Icon name="bell" size={24} />
                </div>
                <p className="text-xs font-bold text-slate-700">Belum Ada Notifikasi</p>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-[200px] mx-auto">
                  Semua aktivitas penilaian, sertifikat, dan pendaftaran akan muncul di sini.
                </p>
              </div>
            ) : (
              notifications.map(item => {
                const meta = getNotificationIconMeta(item.type, item.icon);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleMarkAsRead(item)}
                    className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer group ${
                      !item.is_read
                        ? 'bg-sky-50/40 hover:bg-sky-50/70'
                        : 'bg-white hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Notification Type Icon */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${meta.bg}`}
                    >
                      <Icon name={meta.icon} size={17} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1.5">
                        <p
                          className={`text-xs leading-snug line-clamp-1 ${
                            !item.is_read ? 'font-bold text-[#07192C]' : 'font-semibold text-slate-700'
                          }`}
                        >
                          {item.title}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium mt-0.5">
                          {formatTimeAgo(item.created_at)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>

                      {/* Action URL Pill */}
                      {item.action_url && (
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-sky-600 group-hover:text-sky-700">
                          <span>Buka halaman</span>
                          <Icon name="chevron-right" size={10} />
                        </div>
                      )}
                    </div>

                    {/* Right Unread Indicator / Dismiss */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {!item.is_read && (
                        <span className="w-2 h-2 rounded-full bg-sky-500 shadow-xs"></span>
                      )}
                      <button
                        type="button"
                        onClick={e => handleDeleteNotification(item.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all cursor-pointer"
                        title="Hapus"
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-slate-50/80 border-t border-slate-200/60 text-center">
            <span className="text-[10px] text-slate-400 font-medium">
              DigiBlueCamp In-App Notification Center
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
