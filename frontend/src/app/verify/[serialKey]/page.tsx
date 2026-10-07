import Icon from '@/components/Icon';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = {
  title: 'Verifikasi Sertifikat',
};

export default async function VerifyPage({ params }: { params: Promise<{ serialKey: string }> }) {
  const t = await getTranslations('Verify');
  const { serialKey } = await params;

  let result: { valid: boolean; message: string; data?: Record<string, string> } | null = null;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/verify/${serialKey}`,
      { cache: 'no-store' }
    );
    result = await res.json();
  } catch {
    result = { valid: false, message: t('msg_server_error') };
  }

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-2">
            <div className="w-7 h-7 bg-gold rounded-lg flex items-center justify-center font-extrabold text-navy-dark text-sm">D</div>
            <span className="text-white font-bold">DigiBlueCamp</span>
          </div>
        </div>

        <div className="card text-center">
          {result?.valid ? (
            <>
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl"><Icon name="check-circle-1" size={30} /></span>
              </div>
              <h1 className="text-xl font-extrabold text-navy-dark mb-1">{t('status_valid')}</h1>
              <p className="text-sm text-slate-500 mb-6">{result.message}</p>

              <div className="bg-slate-50 rounded-xl p-5 text-left space-y-3">
                {[
                  [t('lbl_recipient'),   result.data?.recipient_name],
                  [t('lbl_program'),         result.data?.program_name],
                  [t('lbl_level'),           result.data?.level],
                  [t('lbl_specialization'),    result.data?.specialization],
                  [t('lbl_serial'),      result.data?.serial_number],
                  [t('lbl_grade'),           result.data?.grade],
                  [t('lbl_issue_date'),  result.data?.date_of_issue],
                  [t('lbl_issue_place'),   result.data?.place_of_issue],
                ].map(([label, value]) => value ? (
                  <div key={label as string} className="flex justify-between items-start gap-4">
                    <span className="text-xs text-slate-400 font-medium min-w-[120px]">{label}</span>
                    <span className="text-sm font-semibold text-navy-dark text-right">{value as string}</span>
                  </div>
                ) : null)}
              </div>

              <p className="text-[11px] text-slate-400 mt-4">
                {t('desc_official')}
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl"><Icon name="xmark-circle" size={30} /></span>
              </div>
              <h1 className="text-xl font-extrabold text-navy-dark mb-2">{t('status_invalid')}</h1>
              <p className="text-sm text-slate-500">{result?.message}</p>
            </>
          )}
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          © 2026 DigiBlueCamp x The Blue Economist International Association
        </p>
      </div>
    </div>
  );
}
