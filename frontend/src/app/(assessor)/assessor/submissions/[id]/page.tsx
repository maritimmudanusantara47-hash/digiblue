'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function AssessorSubmissionDetailRedirect() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const id = params?.id;
    if (id) {
      router.replace(`/assessor/submissions?submissionId=${id}`);
    } else {
      router.replace('/assessor/submissions');
    }
  }, [params, router]);

  return (
    <div className="flex items-center justify-center p-12 text-slate-400 text-sm">
      <div className="flex items-center gap-2">
        <svg className="animate-spin h-5 w-5 text-navy" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <span>Membuka data penilaian...</span>
      </div>
    </div>
  );
}
