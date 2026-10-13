'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { Course } from '@/types';
import { getCertificateTemplatesForCourse } from '@/lib/certificateTemplates';
import CertificatePreviewCard from './CertificatePreviewCard';
import CertificatePreviewModal from './CertificatePreviewModal';

interface CertificatePreviewSectionProps {
  course: Course | null;
  locale?: string;
  className?: string;
}

export default function CertificatePreviewSection({
  course,
  locale = 'id',
  className = '',
}: CertificatePreviewSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTemplateId, setModalTemplateId] = useState<string | undefined>();
  const [modalSide, setModalSide] = useState<'front' | 'back'>('front');

  const templates = useMemo(() => {
    return getCertificateTemplatesForCourse(course, locale);
  }, [course, locale]);

  // Support opening via custom window event (e.g. from hero badge or benefit item)
  useEffect(() => {
    const handleOpenEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ templateId?: string; side?: 'front' | 'back' }>;
      if (customEvent.detail?.templateId) {
        setModalTemplateId(customEvent.detail.templateId);
      }
      if (customEvent.detail?.side) {
        setModalSide(customEvent.detail.side);
      }
      setIsModalOpen(true);
    };

    window.addEventListener('open-certificate-preview', handleOpenEvent);
    return () => {
      window.removeEventListener('open-certificate-preview', handleOpenEvent);
    };
  }, []);

  const handleOpenModal = (templateId?: string, side: 'front' | 'back' = 'front') => {
    setModalTemplateId(templateId);
    setModalSide(side);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  if (!course) return null;

  return (
    <>
      <CertificatePreviewCard
        templates={templates}
        onOpenModal={handleOpenModal}
        courseTitle={course.title}
        locale={locale}
        className={className}
      />

      <CertificatePreviewModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        templates={templates}
        initialTemplateId={modalTemplateId}
        initialSide={modalSide}
        courseTitle={course.title}
        locale={locale}
      />
    </>
  );
}

/** Helper function to open certificate preview modal from anywhere in the page */
export function triggerCertificatePreview(templateId?: string, side?: 'front' | 'back') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('open-certificate-preview', {
        detail: { templateId, side },
      })
    );
  }
}
