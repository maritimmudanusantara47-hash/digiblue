import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

// Instance SweetAlert dengan tema standar DigiBlue
export const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});

export const showSuccess = (title: string, text?: string) => {
  return Swal.fire({
    icon: 'success',
    title,
    text,
    confirmButtonColor: '#0a2540', // DigiBlue Navy
    confirmButtonText: 'OK',
    customClass: {
      popup: 'rounded-2xl shadow-xl',
      confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-sm',
    },
  });
};

export const showError = (title: string, text?: string) => {
  return Swal.fire({
    icon: 'error',
    title,
    text: text || 'Terjadi kesalahan pada sistem. Silakan coba beberapa saat lagi.',
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Tutup',
    customClass: {
      popup: 'rounded-2xl shadow-xl',
      confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-sm',
    },
  });
};

export const showWarning = (title: string, text?: string) => {
  return Swal.fire({
    icon: 'warning',
    title,
    text,
    confirmButtonColor: '#0a2540',
    confirmButtonText: 'Mengerti',
    customClass: {
      popup: 'rounded-2xl shadow-xl',
      confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-sm',
    },
  });
};

export const showConfirm = async (
  title: string,
  text: string,
  confirmText: string = 'Ya, Lanjutkan',
  isDanger: boolean = false
): Promise<boolean> => {
  const result = await Swal.fire({
    title,
    text,
    icon: isDanger ? 'warning' : 'question',
    showCancelButton: true,
    confirmButtonColor: isDanger ? '#dc2626' : '#0a2540',
    cancelButtonColor: '#94a3b8',
    confirmButtonText: confirmText,
    cancelButtonText: 'Batal',
    reverseButtons: true,
    customClass: {
      popup: 'rounded-3xl shadow-2xl p-6',
      confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-sm',
      cancelButton: 'px-5 py-2.5 rounded-xl font-bold text-sm',
    },
  });
  return result.isConfirmed;
};

export default Swal;
