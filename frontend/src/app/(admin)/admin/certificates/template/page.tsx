'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { showSuccess, showError } from '@/lib/swal';
import ModalPortal from '@/components/common/ModalPortal';

/* ─── Icons ─────────────────────────────────────────────────────── */
const Ico = {
  Back: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>,
  Save: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>,
  Reset: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>,
  Download: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
  Eye: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>,
  Edit: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
  QR: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="5" height="5" x="3" y="3" rx="1" /><rect width="5" height="5" x="16" y="3" rx="1" /><rect width="5" height="5" x="3" y="16" rx="1" /><path d="M21 16h-3a2 2 0 0 0-2 2v3" /><path d="M21 21v.01" /><path d="M12 7v3a2 2 0 0 1-2 2H7" /><path d="M3 12h.01" /><path d="M12 3h.01" /><path d="M12 16v.01" /><path d="M16 12h1" /><path d="M21 12v.01" /><path d="M12 21v-1" /></svg>,
  Info: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
  ChevronDown: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>,
  ZoomIn: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg>,
  ZoomOut: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" /></svg>,
  Fit: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>,
  Sliders: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></svg>,
  Close: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  Calendar: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>,
};

/* ─── Types ──────────────────────────────────────────────────────── */
interface FieldConfig {
  top: number;
  right?: number;
  left?: number;
  width?: number;
  height?: number;
  font_size?: number;
  size?: number;
  label: string;
}
type LayoutState = Record<string, FieldConfig>;

const DEFAULT_LAYOUT: LayoutState = {
  serial_no: { top: 13.0, right: 16.5, width: 105, font_size: 11.0, label: 'Nomor Seri (Top-Right)' },
  recipient_name: { top: 69.5, font_size: 32.5, label: 'Nama Peserta' },
  ribbon_text: { top: 99.0, height: 14.0, font_size: 22.5, label: 'Teks Ribbon' },
  level_value: { top: 122.8, font_size: 14.5, label: 'Level Sertifikasi' },
  meta_block: { top: 138.0, font_size: 10.5, label: 'Grade, Tanggal & Tempat' },
  qr_left: { top: 147.5, left: 67.0, size: 26, label: 'QR Kiri' },
  qr_right: { top: 147.5, left: 196.4, size: 26, label: 'QR Kanan' },
  back_title: { top: 20.0, font_size: 15.0, label: 'Judul Halaman Belakang' },

  // Field Study Layout
  fs_recipient_name: { top: 70.0, font_size: 33.0, label: 'Nama Peserta (Depan)' },
  fs_course_title: { top: 108.5, font_size: 19.0, label: 'Judul Pelatihan (Depan)' },
  fs_date_participation: { top: 134.5, font_size: 14.0, label: 'Tanggal Partisipasi (Depan)' },
  fs_date_issue: { top: 141.5, font_size: 14.0, label: 'Tempat & Tanggal Terbit (Depan)' },
  fs_back_name: { top: 25.5, left: 16.5, font_size: 11.5, label: 'Nama Peserta (Belakang)' },
  fs_back_reg_no: { top: 30.8, left: 16.5, font_size: 11.5, label: 'Nomor Registrasi (Belakang)' },
};

interface PresetItem {
  type: 'specialization' | 'foundation' | 'critical_thinking' | 'field_study';
  trackSlug?: string;
  name: string;
  serial: string;
  ribbon: string;
  level: string;
  grade: string;
  date: string;
  place: string;
  courseTitle: string;
  dateParticipation: string;
  dateIssue: string;
  regNo: string;
}

function toRomanMonth(m: number): string {
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  return roman[m - 1] || 'I';
}

function parseDateParts(dateStr: string): { monthRoman: string; month2: string; year4: string; formattedEn: string; formattedIssue: string } | null {
  if (!dateStr) return null;
  const clean = dateStr.replace(/^[A-Za-z\s]+,\s*/, '').trim();
  const d = new Date(clean);
  if (!isNaN(d.getTime())) {
    const m = d.getMonth() + 1;
    const y = d.getFullYear().toString();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return {
      monthRoman: toRomanMonth(m),
      month2: m.toString().padStart(2, '0'),
      year4: y,
      formattedEn: `${monthNames[m - 1]} ${d.getDate()}, ${y}`,
      formattedIssue: `Jakarta, ${d.getDate()} ${monthNames[m - 1]} ${y}`,
    };
  }
  return null;
}

function syncSerialWithDate(serial: string, dateStr: string): string {
  const parts = parseDateParts(dateStr);
  if (!parts || !serial) return serial;
  const match = serial.match(/^(CBEC(?:\/[A-Z0-9]+)?\/ID\/)([IVXLCDM]+)\/(\d{4})(\d+)$/i);
  if (match) {
    const prefix = match[1];
    const seq = match[4];
    return `${prefix}${parts.monthRoman}/${parts.year4}${seq}`;
  }
  return serial;
}

function syncRegNoWithDate(regNo: string, dateStr: string): string {
  const parts = parseDateParts(dateStr);
  if (!parts || !regNo) return regNo;
  const match = regNo.match(/^(CBETC[A-Z]*)(\d{3})(\d{2})(\d{4})$/i);
  if (match) {
    const prefix = match[1];
    const seq = match[2];
    return `${prefix}${seq}${parts.month2}${parts.year4}`;
  }
  return regNo;
}

const PRESETS: Record<string, PresetItem> = {
  spec_tourism: {
    type: 'specialization',
    trackSlug: 'blue-tourism',
    name: 'Nabila Azzahro Widodo',
    serial: 'CBEC/BTR/ID/IX/20260001',
    ribbon: 'Certified Blue Economist in Blue Tourism - CBEc. (Tour.)',
    level: 'Blue Tourism Specialization',
    grade: 'Excellent',
    date: 'September 21, 2026',
    place: 'Jakarta',
    courseTitle: 'INTERNATIONAL BLUE ECONOMIST CERTIFICATION TRAINING COURSE',
    dateParticipation: '20 May – 11 June 2026',
    dateIssue: 'Jakarta, 11 June 2026',
    regNo: 'CBETCBTR001062026',
  },
  spec_shipping: {
    type: 'specialization',
    trackSlug: 'blue-shipping',
    name: 'Nabila Azzahro Widodo',
    serial: 'CBEC/BSP/ID/III/20260001',
    ribbon: 'Certified Blue Economist in Blue Shipping - CBEc. (Ship.)',
    level: 'Blue Shipping Specialization',
    grade: 'Excellent',
    date: 'March 21, 2026',
    place: 'Jakarta',
    courseTitle: 'INTERNATIONAL BLUE ECONOMIST CERTIFICATION TRAINING COURSE',
    dateParticipation: '20 May – 11 June 2026',
    dateIssue: 'Jakarta, 11 June 2026',
    regNo: 'CBETCBSP001032026',
  },
  spec_finance: {
    type: 'specialization',
    trackSlug: 'blue-finance',
    name: 'Nabila Azzahro Widodo',
    serial: 'CBEC/BFN/ID/IX/20260001',
    ribbon: 'Certified Blue Economist in Blue Finance - CBEc. (Fin.)',
    level: 'Blue Finance Specialization',
    grade: 'Excellent',
    date: 'September 21, 2026',
    place: 'Jakarta',
    courseTitle: 'INTERNATIONAL BLUE ECONOMIST CERTIFICATION TRAINING COURSE',
    dateParticipation: '20 May – 11 June 2026',
    dateIssue: 'Jakarta, 11 June 2026',
    regNo: 'CBETCBFN001062026',
  },
  spec_farming: {
    type: 'specialization',
    trackSlug: 'blue-farming',
    name: 'Nabila Azzahro Widodo',
    serial: 'CBEC/BFM/ID/IX/20260001',
    ribbon: 'Certified Blue Economist in Blue Farming - CBEc. (Farm.)',
    level: 'Blue Farming Specialization',
    grade: 'Excellent',
    date: 'September 21, 2026',
    place: 'Jakarta',
    courseTitle: 'INTERNATIONAL BLUE ECONOMIST CERTIFICATION TRAINING COURSE',
    dateParticipation: '20 May – 11 June 2026',
    dateIssue: 'Jakarta, 11 June 2026',
    regNo: 'CBETCBFM001062026',
  },
  spec_energy: {
    type: 'specialization',
    trackSlug: 'blue-energy',
    name: 'Nabila Azzahro Widodo',
    serial: 'CBEC/BEC/ID/IV/20260001',
    ribbon: 'Certified Blue Economist in Blue Energy - CBEc. (Ener.)',
    level: 'Blue Energy Specialization',
    grade: 'Excellent',
    date: 'April 21, 2026',
    place: 'Jakarta',
    courseTitle: 'INTERNATIONAL BLUE ECONOMIST CERTIFICATION TRAINING COURSE',
    dateParticipation: '20 May – 11 June 2026',
    dateIssue: 'Jakarta, 11 June 2026',
    regNo: 'CBETCBEC001062026',
  },
  spec_data_intelligence: {
    type: 'specialization',
    trackSlug: 'blue-data-intelligence',
    name: 'Nabila Azzahro Widodo',
    serial: 'CBEC/BDI/ID/I/20260001',
    ribbon: 'Certified Blue Economist in Blue Data Intelligence - CBEc. (DataIntel.)',
    level: 'Blue Data Intelligence Specialization',
    grade: 'Excellent',
    date: 'January 21, 2026',
    place: 'Jakarta',
    courseTitle: 'INTERNATIONAL BLUE ECONOMIST CERTIFICATION TRAINING COURSE',
    dateParticipation: '20 May – 11 June 2026',
    dateIssue: 'Jakarta, 11 June 2026',
    regNo: 'CBETCBDI001062026',
  },
  spec_community_development: {
    type: 'specialization',
    trackSlug: 'blue-community-development',
    name: 'Nabila Azzahro Widodo',
    serial: 'CBEC/BCD/ID/IX/20260001',
    ribbon: 'Certified Blue Economist in Blue Community Development - CBEc. (CommDev.)',
    level: 'Blue Community Development Specialization',
    grade: 'Excellent',
    date: 'September 21, 2026',
    place: 'Jakarta',
    courseTitle: 'INTERNATIONAL BLUE ECONOMIST CERTIFICATION TRAINING COURSE',
    dateParticipation: '20 May – 11 June 2026',
    dateIssue: 'Jakarta, 11 June 2026',
    regNo: 'CBETCBCD001062026',
  },
  spec_circular_economy: {
    type: 'specialization',
    trackSlug: 'blue-circular-economy',
    name: 'Nabila Azzahro Widodo',
    serial: 'CBEC/BCE/ID/III/20260001',
    ribbon: 'Certified Blue Economist in Blue Circular Economy - CBEc. (CirEc.)',
    level: 'Blue Circular Economy Specialization',
    grade: 'Excellent',
    date: 'March 21, 2026',
    place: 'Jakarta',
    courseTitle: 'INTERNATIONAL BLUE ECONOMIST CERTIFICATION TRAINING COURSE',
    dateParticipation: '20 May – 11 June 2026',
    dateIssue: 'Jakarta, 11 June 2026',
    regNo: 'CBETCBCE001062026',
  },
  spec_carbon: {
    type: 'specialization',
    trackSlug: 'blue-carbon',
    name: 'Nabila Azzahro Widodo',
    serial: 'CBEC/BCB/ID/IX/20260001',
    ribbon: 'Certified Blue Economist in Blue Carbon - CBEc. (Carb.)',
    level: 'Blue Carbon Specialization',
    grade: 'Excellent',
    date: 'September 21, 2026',
    place: 'Jakarta',
    courseTitle: 'INTERNATIONAL BLUE ECONOMIST CERTIFICATION TRAINING COURSE',
    dateParticipation: '20 May – 11 June 2026',
    dateIssue: 'Jakarta, 11 June 2026',
    regNo: 'CBETCBCB001062026',
  },
  spec_business_development: {
    type: 'specialization',
    trackSlug: 'blue-business-development',
    name: 'Nabila Azzahro Widodo',
    serial: 'CBEC/BZD/ID/IV/20260001',
    ribbon: 'Certified Blue Economist in Blue Business Development - CBEc. (BizDev.)',
    level: 'Blue Business Development Specialization',
    grade: 'Excellent',
    date: 'April 21, 2026',
    place: 'Jakarta',
    courseTitle: 'INTERNATIONAL BLUE ECONOMIST CERTIFICATION TRAINING COURSE',
    dateParticipation: '20 May – 11 June 2026',
    dateIssue: 'Jakarta, 11 June 2026',
    regNo: 'CBETCBZD001052026',
  },
  nabila: {
    type: 'specialization',
    trackSlug: 'blue-carbon',
    name: 'Nabila Azzahro Widodo',
    serial: 'CBEC/BCB/ID/IX/20260001',
    ribbon: 'Certified Blue Economist in Blue Carbon - CBEc. (Carb.)',
    level: 'Blue Carbon Specialization',
    grade: 'Excellent',
    date: 'September 21, 2026',
    place: 'Jakarta',
    courseTitle: 'INTERNATIONAL BLUE ECONOMIST CERTIFICATION TRAINING COURSE',
    dateParticipation: '20 May – 11 June 2026',
    dateIssue: 'Jakarta, 11 June 2026',
    regNo: 'CBETCBCB001062026',
  },
  budi: {
    type: 'foundation',
    name: 'Budi Santoso',
    serial: 'CBEC/ID/X/20260001',
    ribbon: 'Certified Blue Economist (CBEc)',
    level: 'Foundation Level',
    grade: 'Excellent',
    date: 'October 2, 2026',
    place: 'Jakarta, Indonesia',
    courseTitle: 'INTERNATIONAL BLUE ECONOMIST CERTIFICATION TRAINING COURSE',
    dateParticipation: '20 May – 11 June 2026',
    dateIssue: 'Jakarta, 11 June 2026',
    regNo: 'CBETC001062026',
  },
  critical_thinking: {
    type: 'critical_thinking',
    name: 'Diana Supriati',
    serial: 'CBEC/ID/VI/20260001',
    ribbon: 'INTERNATIONAL BLUE ECONOMIST CERTIFICATION TRAINING COURSE',
    level: 'Critical Thinking / Training Course',
    grade: 'Excellent',
    date: 'June 11, 2026',
    place: 'Jakarta',
    courseTitle: 'INTERNATIONAL BLUE ECONOMIST CERTIFICATION TRAINING COURSE',
    dateParticipation: '20 May – 11 June 2026',
    dateIssue: 'Jakarta, 11 June 2026',
    regNo: 'CBETC001062026',
  },
  field_study: {
    type: 'field_study',
    trackSlug: 'foundation',
    name: 'Diana Supriati',
    serial: 'CBEC/ID/VI/20260001',
    ribbon: 'INTERNATIONAL BLUE ECONOMIST CERTIFICATION TRAINING COURSE',
    level: 'Field Study / Training Course',
    grade: 'Excellent',
    date: 'June 11, 2026',
    place: 'Jakarta',
    courseTitle: 'International Blue Economist Certification Training Course',
    dateParticipation: '20 May – 11 June 2026',
    dateIssue: 'Jakarta, 11 June 2026',
    regNo: 'CBETC001062026',
  },
  fs_foundation: {
    type: 'field_study',
    trackSlug: 'foundation',
    name: 'Diana Supriati',
    serial: 'CBEC/ID/VI/20260001',
    ribbon: 'INTERNATIONAL BLUE ECONOMIST CERTIFICATION TRAINING COURSE',
    level: 'Field Study / Training Course',
    grade: 'Excellent',
    date: 'June 11, 2026',
    place: 'Jakarta',
    courseTitle: 'International Blue Economist Certification Training Course',
    dateParticipation: '20 May – 11 June 2026',
    dateIssue: 'Jakarta, 11 June 2026',
    regNo: 'CBETC001062026',
  },
  fs_tourism: {
    type: 'field_study',
    trackSlug: 'blue-tourism',
    name: 'Nabila Azzahro Widodo',
    serial: 'CBEC/BTR/ID/VI/20260001',
    ribbon: 'INTERNATIONAL BLUE ECONOMIST CERTIFICATION TRAINING COURSE',
    level: 'Field Study — Blue Tourism',
    grade: 'Excellent',
    date: 'June 11, 2026',
    place: 'Jakarta',
    courseTitle: 'International Blue Economist Certification Training Course - Blue Tourism Specialization',
    dateParticipation: '20 May – 11 June 2026',
    dateIssue: 'Jakarta, 11 June 2026',
    regNo: 'CBETCBTR001062026',
  },
  fs_energy: {
    type: 'field_study',
    trackSlug: 'blue-energy',
    name: 'Nabila Azzahro Widodo',
    serial: 'CBEC/BEC/ID/VI/20260001',
    ribbon: 'INTERNATIONAL BLUE ECONOMIST CERTIFICATION TRAINING COURSE',
    level: 'Field Study — Blue Energy',
    grade: 'Excellent',
    date: 'June 11, 2026',
    place: 'Jakarta',
    courseTitle: 'International Blue Economist Certification Training Course - Blue Energy Specialization',
    dateParticipation: '20 May – 11 June 2026',
    dateIssue: 'Jakarta, 11 June 2026',
    regNo: 'CBETCBEC001062026',
  },
  fs_farming: {
    type: 'field_study',
    trackSlug: 'blue-farming',
    name: 'Nabila Azzahro Widodo',
    serial: 'CBEC/BFM/ID/VI/20260001',
    ribbon: 'INTERNATIONAL BLUE ECONOMIST CERTIFICATION TRAINING COURSE',
    level: 'Field Study — Blue Farming',
    grade: 'Excellent',
    date: 'June 11, 2026',
    place: 'Jakarta',
    courseTitle: 'International Blue Economist Certification Training Course - Blue Farming Specialization',
    dateParticipation: '20 May – 11 June 2026',
    dateIssue: 'Jakarta, 11 June 2026',
    regNo: 'CBETCBFM001062026',
  },
  fs_finance: {
    type: 'field_study',
    trackSlug: 'blue-finance',
    name: 'Nabila Azzahro Widodo',
    serial: 'CBEC/BFN/ID/VI/20260001',
    ribbon: 'INTERNATIONAL BLUE ECONOMIST CERTIFICATION TRAINING COURSE',
    level: 'Field Study — Blue Finance',
    grade: 'Excellent',
    date: 'June 11, 2026',
    place: 'Jakarta',
    courseTitle: 'International Blue Economist Certification Training Course - Blue Finance Specialization',
    dateParticipation: '20 May – 11 June 2026',
    dateIssue: 'Jakarta, 11 June 2026',
    regNo: 'CBETCBFN001062026',
  },
  fs_shipping: {
    type: 'field_study',
    trackSlug: 'blue-shipping',
    name: 'Nabila Azzahro Widodo',
    serial: 'CBEC/BSP/ID/VI/20260001',
    ribbon: 'INTERNATIONAL BLUE ECONOMIST CERTIFICATION TRAINING COURSE',
    level: 'Field Study — Blue Shipping',
    grade: 'Excellent',
    date: 'June 11, 2026',
    place: 'Jakarta',
    courseTitle: 'International Blue Economist Certification Training Course - Blue Shipping Specialization',
    dateParticipation: '20 May – 11 June 2026',
    dateIssue: 'Jakarta, 11 June 2026',
    regNo: 'CBETCBSP001032026',
  },
  fs_carbon: {
    type: 'field_study',
    trackSlug: 'blue-carbon',
    name: 'Nabila Azzahro Widodo',
    serial: 'CBEC/BCB/ID/VI/20260001',
    ribbon: 'INTERNATIONAL BLUE ECONOMIST CERTIFICATION TRAINING COURSE',
    level: 'Field Study — Blue Carbon',
    grade: 'Excellent',
    date: 'June 11, 2026',
    place: 'Jakarta',
    courseTitle: 'International Blue Economist Certification Training Course - Blue Carbon Specialization',
    dateParticipation: '20 May – 11 June 2026',
    dateIssue: 'Jakarta, 11 June 2026',
    regNo: 'CBETCBCB001062026',
  },
  fs_business_development: {
    type: 'field_study',
    trackSlug: 'blue-business-development',
    name: 'Nabila Azzahro Widodo',
    serial: 'CBEC/BZD/ID/VI/20260001',
    ribbon: 'INTERNATIONAL BLUE ECONOMIST CERTIFICATION TRAINING COURSE',
    level: 'Field Study — Blue Business Dev',
    grade: 'Excellent',
    date: 'June 11, 2026',
    place: 'Jakarta',
    courseTitle: 'International Blue Economist Certification Training Course - Blue Business Development Specialization',
    dateParticipation: '20 May – 11 June 2026',
    dateIssue: 'Jakarta, 11 June 2026',
    regNo: 'CBETCBZD001052026',
  },
  fs_community_development: {
    type: 'field_study',
    trackSlug: 'blue-community-development',
    name: 'Nabila Azzahro Widodo',
    serial: 'CBEC/BCD/ID/VI/20260001',
    ribbon: 'INTERNATIONAL BLUE ECONOMIST CERTIFICATION TRAINING COURSE',
    level: 'Field Study — Blue Community Dev',
    grade: 'Excellent',
    date: 'June 11, 2026',
    place: 'Jakarta',
    courseTitle: 'International Blue Economist Certification Training Course - Blue Community Development Specialization',
    dateParticipation: '20 May – 11 June 2026',
    dateIssue: 'Jakarta, 11 June 2026',
    regNo: 'CBETCBCD001062026',
  },
  fs_circular_economy: {
    type: 'field_study',
    trackSlug: 'blue-circular-economy',
    name: 'Nabila Azzahro Widodo',
    serial: 'CBEC/BCE/ID/VI/20260001',
    ribbon: 'INTERNATIONAL BLUE ECONOMIST CERTIFICATION TRAINING COURSE',
    level: 'Field Study — Blue Circular Economy',
    grade: 'Excellent',
    date: 'June 11, 2026',
    place: 'Jakarta',
    courseTitle: 'International Blue Economist Certification Training Course - Blue Circular Economy Specialization',
    dateParticipation: '20 May – 11 June 2026',
    dateIssue: 'Jakarta, 11 June 2026',
    regNo: 'CBETCBCE001062026',
  },
  fs_data_intelligence: {
    type: 'field_study',
    trackSlug: 'blue-data-intelligence',
    name: 'Nabila Azzahro Widodo',
    serial: 'CBEC/BDI/ID/VI/20260001',
    ribbon: 'INTERNATIONAL BLUE ECONOMIST CERTIFICATION TRAINING COURSE',
    level: 'Field Study — Blue Data Intelligence',
    grade: 'Excellent',
    date: 'June 11, 2026',
    place: 'Jakarta',
    courseTitle: 'International Blue Economist Certification Training Course - Blue Data Intelligence Specialization',
    dateParticipation: '20 May – 11 June 2026',
    dateIssue: 'Jakarta, 11 June 2026',
    regNo: 'CBETCBDI001062026',
  },
};

// Ukuran virtual canvas A4 Landscape (297 × 210 mm)
const CANVAS_W = 880;
const CANVAS_H = Math.round(CANVAS_W * (210 / 297)); // ~622px
const SCALE = CANVAS_W / 297;
const mmToPx = (mm: number) => mm * SCALE;

const FIELD_LIST_FRONT = [
  { key: 'recipient_name', label: 'Nama Peserta' },
  { key: 'ribbon_text', label: 'Teks Ribbon' },
  { key: 'serial_no', label: 'Nomor Seri' },
  { key: 'level_value', label: 'Level Sertifikasi' },
  { key: 'meta_block', label: 'Grade, Tanggal & Tempat' },
  { key: 'qr_left', label: 'QR Kiri' },
  { key: 'qr_right', label: 'QR Kanan' },
];

const FIELD_LIST_BACK = [
  { key: 'back_title', label: 'Judul Halaman Belakang' },
];

const FIELD_LIST_FS_FRONT = [
  { key: 'fs_recipient_name', label: 'Nama Peserta (Depan)' },
  { key: 'fs_course_title', label: 'Judul Pelatihan (Depan)' },
  { key: 'fs_date_participation', label: 'Tanggal Partisipasi (Depan)' },
  { key: 'fs_date_issue', label: 'Tempat & Tanggal Terbit (Depan)' },
];

const FIELD_LIST_FS_BACK = [
  { key: 'fs_back_name', label: 'Nama Peserta (Belakang)' },
  { key: 'fs_back_reg_no', label: 'Nomor Registrasi (Belakang)' },
];

const FRONT_FIELDS = [
  'recipient_name',
  'ribbon_text',
  'serial_no',
  'level_value',
  'meta_block',
  'qr_left',
  'qr_right',
  'fs_recipient_name',
  'fs_course_title',
  'fs_date_participation',
  'fs_date_issue',
];

const BACK_FIELDS = [
  'back_title',
  'fs_back_name',
  'fs_back_reg_no',
];

export default function CertificateTemplateAdminPage() {
  const [layout, setLayout] = useState<LayoutState>(DEFAULT_LAYOUT);
  const [templateImg, setTemplateImg] = useState<string | null>(null);
  const [templateImgSpec, setTemplateImgSpec] = useState<string | null>(null);
  const [templateImgFound, setTemplateImgFound] = useState<string | null>(null);
  const [templateBackImg, setTemplateBackImg] = useState<string | null>(null);
  const [templateImgFsFront, setTemplateImgFsFront] = useState<string | null>(null);
  const [templateImgFsBack, setTemplateImgFsBack] = useState<string | null>(null);
  const [templateImgCtBack, setTemplateImgCtBack] = useState<string | null>(null);
  const [specBacks, setSpecBacks] = useState<Record<string, string>>({});
  const [fsBacks, setFsBacks] = useState<Record<string, string>>({});
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [selectedKey, setSelectedKey] = useState('recipient_name');
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetOk, setResetOk] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sample, setSample] = useState<PresetItem>(PRESETS.spec_tourism || PRESETS.nabila);
  const [openSection, setOpenSection] = useState<'fields' | 'preview' | null>('fields');

  // Multi-device responsive states & auto-fit zoom
  const mainRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [zoomMode, setZoomMode] = useState<'fit' | number>('fit');
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  useEffect(() => {
    api.get('/admin/certificates/template/layout').then(res => {
      if (res.data?.data && Object.keys(res.data.data).length > 0)
        setLayout(prev => ({ ...prev, ...res.data.data }));
    }).catch(() => { });

    api.get('/admin/certificates/template/image').then(res => {
      const { base64, mime_type, foundation_base64, back_base64, back_mime_type, field_study_front_base64, field_study_back_base64, critical_thinking_front_base64, critical_thinking_back_base64, specialization_backs, field_study_backs } = res.data.data;
      if (base64) {
        const specUrl = `data:${mime_type || 'image/png'};base64,${base64}`;
        setTemplateImg(specUrl);
        setTemplateImgSpec(specUrl);
      }
      if (foundation_base64) {
        setTemplateImgFound(`data:image/png;base64,${foundation_base64}`);
      }
      if (back_base64) setTemplateBackImg(`data:${back_mime_type || 'image/png'};base64,${back_base64}`);
      const ctFront = field_study_front_base64 || critical_thinking_front_base64;
      if (ctFront) setTemplateImgFsFront(`data:image/png;base64,${ctFront}`);
      if (field_study_back_base64) setTemplateImgFsBack(`data:image/png;base64,${field_study_back_base64}`);
      if (critical_thinking_back_base64) setTemplateImgCtBack(`data:image/png;base64,${critical_thinking_back_base64}`);
      if (specialization_backs) setSpecBacks(specialization_backs);
      if (field_study_backs) setFsBacks(field_study_backs);
    }).catch(() => { });
  }, []);

  // Monitor container size dynamically across laptops, tablets, and phones
  useEffect(() => {
    if (!mainRef.current) return;
    const updateSize = () => {
      if (mainRef.current) {
        setContainerSize({
          width: mainRef.current.clientWidth,
          height: mainRef.current.clientHeight,
        });
      }
    };
    updateSize();

    const ro = new ResizeObserver(updateSize);
    ro.observe(mainRef.current);
    window.addEventListener('resize', updateSize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Hitung skala otomatis agar sertifikat A4 muat 100% di layar laptop tanpa terpotong
  const fitScale = useMemo(() => {
    if (containerSize.width === 0 || containerSize.height === 0) return 0.72;
    // Berikan margin/padding aman
    const padX = 36;
    const padY = 72; // ruang untuk toolbar dan hint teks
    const availW = Math.max(160, containerSize.width - padX);
    const availH = Math.max(160, containerSize.height - padY);
    const scaleX = availW / CANVAS_W;
    const scaleY = availH / CANVAS_H;
    // Batasi maksimum 1.1x agar tidak pecah, minimum muat utuh
    return Math.min(scaleX, scaleY, 1.1);
  }, [containerSize]);

  const effectiveScale = useMemo(() => {
    if (zoomMode === 'fit') return fitScale;
    return zoomMode;
  }, [zoomMode, fitScale]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/admin/certificates/template/layout', { fields: layout });
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2500);
      showSuccess('Tersimpan', 'Layout sertifikat berhasil disimpan.');
    } catch { showError('Gagal!', 'Gagal menyimpan layout sertifikat.'); }
    finally { setSaving(false); }
  };

  const handleResetCurrentPage = async () => {
    try {
      setResetting(true);
      setShowResetModal(false);
      const isBack = activeSide === 'back';
      const pageName = isBack ? 'Halaman Belakang' : 'Halaman Depan';
      const targetKeys = isBack ? BACK_FIELDS : FRONT_FIELDS;

      const updated: LayoutState = { ...layout };
      targetKeys.forEach(k => {
        if (DEFAULT_LAYOUT[k]) {
          updated[k] = JSON.parse(JSON.stringify(DEFAULT_LAYOUT[k]));
        }
      });

      setLayout(updated);
      await api.put('/admin/certificates/template/layout', { fields: updated });
      setResetOk(true);
      setTimeout(() => setResetOk(false), 2500);
      showSuccess('Berhasil!', `Layout ${pageName} berhasil di-reset ke default.`);
    } catch {
      showError('Gagal!', 'Gagal reset layout sertifikat.');
    } finally {
      setResetting(false);
    }
  };

  const handleResetAll = async () => {
    try {
      setResetting(true);
      setShowResetModal(false);
      const clean: LayoutState = JSON.parse(JSON.stringify(DEFAULT_LAYOUT));
      setLayout(clean);
      setSample(PRESETS.nabila);
      await api.put('/admin/certificates/template/layout', { fields: clean });
      setResetOk(true);
      setTimeout(() => setResetOk(false), 2500);
      showSuccess('Berhasil!', 'Seluruh template sertifikat berhasil di-reset ke default.');
    } catch {
      showError('Gagal!', 'Gagal reset layout sertifikat.');
    } finally {
      setResetting(false);
    }
  };

  const handleResetField = (key: string) => {
    if (DEFAULT_LAYOUT[key]) setLayout(prev => ({ ...prev, [key]: { ...DEFAULT_LAYOUT[key] } }));
  };

  const updateField = (key: string, prop: keyof FieldConfig, val: number) => {
    setLayout(prev => ({ ...prev, [key]: { ...prev[key], [prop]: val } }));
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const isCt = sample.type === 'critical_thinking' || sample.type === 'field_study';
      const endpoint = isCt ? '/admin/certificates/1/download?type=critical_thinking' : '/admin/certificates/1/download';
      const res = await api.get(endpoint, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = isCt ? 'Contoh-Sertifikat-Critical-Thinking.pdf' : 'Contoh-Sertifikat.pdf';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch { showError('Gagal!', 'Gagal mengunduh PDF contoh.'); }
    finally { setDownloading(false); }
  };

  const sel = layout[selectedKey];

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none">

      {/* ── Header ── */}
      <header className="flex-shrink-0 z-30 bg-slate-900 border-b border-slate-800 px-3 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between gap-3 overflow-x-auto">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link href="/admin/certificates" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-700 transition">
            <Ico.Back /> <span className="hidden sm:inline">Keluar ke Admin</span><span className="sm:hidden">Kembali</span>
          </Link>
          <div>
            <h1 className="text-xs sm:text-sm font-bold text-white leading-tight">Template Sertifikat Designer</h1>
            <p className="text-[10px] sm:text-[11px] text-slate-500">A4 Landscape · 297 × 210 mm</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Page side toggle */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => {
                setActiveSide('front');
                setSelectedKey((sample.type === 'critical_thinking' || sample.type === 'field_study') ? 'fs_recipient_name' : 'recipient_name');
              }}
              className={`text-xs px-2 sm:px-2.5 py-1 rounded-md transition ${activeSide === 'front' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-white'}`}
            >
              Halaman Depan
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSide('back');
                setSelectedKey((sample.type === 'critical_thinking' || sample.type === 'field_study') ? 'fs_back_name' : 'back_title');
              }}
              className={`text-xs px-2 sm:px-2.5 py-1 rounded-md transition ${activeSide === 'back' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-white'}`}
            >
              Halaman Belakang
            </button>
          </div>

          {/* Preview sample toggle */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => {
                setSample(PRESETS.spec_tourism);
                setSelectedKey(activeSide === 'front' ? 'recipient_name' : 'back_title');
              }}
              className={`text-xs px-2 sm:px-2.5 py-1 rounded-md transition ${sample.type === 'specialization' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              Spesialisasi
            </button>
            <button
              onClick={() => {
                setSample(PRESETS.budi);
                setSelectedKey(activeSide === 'front' ? 'recipient_name' : 'back_title');
              }}
              className={`text-xs px-2 sm:px-2.5 py-1 rounded-md transition ${sample.type === 'foundation' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              Foundation
            </button>
            <button
              onClick={() => {
                setSample(PRESETS.field_study);
                setSelectedKey(activeSide === 'front' ? 'fs_recipient_name' : 'fs_back_name');
              }}
              className={`text-xs px-2 sm:px-2.5 py-1 rounded-md transition ${sample.type === 'field_study' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              Field Study
            </button>
            <button
              onClick={() => {
                setSample(PRESETS.critical_thinking);
                setSelectedKey(activeSide === 'front' ? 'fs_recipient_name' : 'fs_back_name');
              }}
              className={`text-xs px-2 sm:px-2.5 py-1 rounded-md transition ${sample.type === 'critical_thinking' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              Critical Thinking
            </button>
          </div>

          {/* Sub-selector for Specialization tracks */}
          {sample.type === 'specialization' && (
            <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-lg px-2 py-1">
              <span className="text-[11px] text-slate-400 hidden md:inline font-medium">Peminatan:</span>
              <select
                value={sample.trackSlug || 'blue-tourism'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'blue-tourism') setSample(PRESETS.spec_tourism);
                  else if (val === 'blue-shipping') setSample(PRESETS.spec_shipping);
                  else if (val === 'blue-finance') setSample(PRESETS.spec_finance);
                  else if (val === 'blue-farming') setSample(PRESETS.spec_farming);
                  else if (val === 'blue-energy') setSample(PRESETS.spec_energy);
                  else if (val === 'blue-data-intelligence') setSample(PRESETS.spec_data_intelligence);
                  else if (val === 'blue-community-development') setSample(PRESETS.spec_community_development);
                  else if (val === 'blue-circular-economy') setSample(PRESETS.spec_circular_economy);
                  else if (val === 'blue-business-development') setSample(PRESETS.spec_business_development);
                  else setSample(PRESETS.spec_carbon);
                }}
                className="text-xs bg-slate-900 border border-slate-700 text-white font-semibold rounded px-2 py-0.5 outline-hidden cursor-pointer"
              >
                <option value="blue-tourism">Blue Tourism – CBEc. (Tour.)</option>
                <option value="blue-shipping">Blue Shipping – CBEc. (Ship.)</option>
                <option value="blue-finance">Blue Finance – CBEc. (Fin.)</option>
                <option value="blue-farming">Blue Farming – CBEc. (Farm.)</option>
                <option value="blue-energy">Blue Energy – CBEc. (Ener.)</option>
                <option value="blue-carbon">Blue Carbon – CBEc. (Carb.)</option>
                <option value="blue-data-intelligence">Blue Data Intelligence – CBEc. (DataIntel.)</option>
                <option value="blue-community-development">Blue Community Dev – CBEc. (CommDev.)</option>
                <option value="blue-circular-economy">Blue Circular Economy – CBEc. (CirEc.)</option>
                <option value="blue-business-development">Blue Business Dev – CBEc. (BizDev.)</option>
              </select>
            </div>
          )}

          {/* Sub-selector for Field Study tracks */}
          {sample.type === 'field_study' && (
            <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-lg px-2 py-1">
              <span className="text-[11px] text-slate-400 hidden md:inline font-medium">Peminatan FS:</span>
              <select
                value={sample.trackSlug || 'foundation'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'blue-tourism') setSample(PRESETS.fs_tourism);
                  else if (val === 'blue-energy') setSample(PRESETS.fs_energy);
                  else if (val === 'blue-farming') setSample(PRESETS.fs_farming);
                  else if (val === 'blue-finance') setSample(PRESETS.fs_finance);
                  else if (val === 'blue-shipping') setSample(PRESETS.fs_shipping);
                  else if (val === 'blue-carbon') setSample(PRESETS.fs_carbon);
                  else if (val === 'blue-business-development') setSample(PRESETS.fs_business_development);
                  else if (val === 'blue-community-development') setSample(PRESETS.fs_community_development);
                  else if (val === 'blue-circular-economy') setSample(PRESETS.fs_circular_economy);
                  else if (val === 'blue-data-intelligence') setSample(PRESETS.fs_data_intelligence);
                  else setSample(PRESETS.fs_foundation || PRESETS.field_study);
                }}
                className="text-xs bg-slate-900 border border-slate-700 text-white font-semibold rounded px-2 py-0.5 outline-hidden cursor-pointer"
              >
                <option value="foundation">FS: Foundation</option>
                <option value="blue-tourism">FS: Blue Tourism</option>
                <option value="blue-energy">FS: Blue Energy</option>
                <option value="blue-farming">FS: Blue Farming</option>
                <option value="blue-finance">FS: Blue Finance</option>
                <option value="blue-shipping">FS: Blue Shipping</option>
                <option value="blue-carbon">FS: Blue Carbon</option>
                <option value="blue-business-development">FS: Blue Business Development</option>
                <option value="blue-community-development">FS: Blue Community Development</option>
                <option value="blue-circular-economy">FS: Blue Circular Economy</option>
                <option value="blue-data-intelligence">FS: Blue Data Intelligence</option>
              </select>
            </div>
          )}

          {/* Edit mode toggle */}
          <button onClick={() => setEditMode(v => !v)} className={`flex items-center gap-1.5 text-xs px-2.5 sm:px-3 py-1.5 rounded-lg border transition ${editMode ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'}`}>
            <Ico.Edit /> <span className="hidden sm:inline">{editMode ? 'Mode Edit' : 'Edit Posisi'}</span>
          </button>

          {/* Toggle Panel di Layar Mobile/Tablet */}
          <button
            onClick={() => setMobilePanelOpen(v => !v)}
            className={`lg:hidden flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition ${mobilePanelOpen ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 text-slate-300 border-slate-700'}`}
            title="Buka panel pengaturan posisi"
          >
            <Ico.Sliders />
            <span className="text-[11px]">Pengaturan</span>
          </button>

          <button onClick={handleDownload} disabled={downloading} className="hidden md:flex items-center gap-1.5 text-xs px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition">
            <Ico.Download /> <span className="hidden lg:inline">{downloading ? 'Mengunduh...' : 'Unduh PDF'}</span>
          </button>

          <button onClick={() => setShowResetModal(true)} disabled={resetting} title="Reset posisi tata letak ke default" className={`flex items-center gap-1.5 text-xs px-2.5 sm:px-3 py-1.5 rounded-lg border transition ${resetOk ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}>
            <Ico.Reset /> <span className="hidden xl:inline">{resetOk ? 'Direset!' : 'Reset'}</span>
          </button>

          <button onClick={handleSave} disabled={saving} className={`flex items-center gap-1.5 text-xs font-bold px-3 sm:px-4 py-1.5 rounded-lg transition shadow-sm ${savedOk ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
            {savedOk ? <><Ico.Check /> Tersimpan</> : <><Ico.Save /> {saving ? 'Menyimpan...' : 'Simpan'}</>}
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 min-h-0 flex relative overflow-hidden">

        {/* Backdrop untuk drawer mobile */}
        {mobilePanelOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden"
            onClick={() => setMobilePanelOpen(false)}
          />
        )}

        {/* Canvas Area */}
        <main
          ref={mainRef}
          className="flex-1 overflow-auto p-3 sm:p-5 flex flex-col items-center justify-between gap-3 bg-[#0a0a0f] relative"
        >
          {editMode && (
            <div className="flex items-center gap-2 text-[11px] sm:text-xs text-blue-300 bg-blue-950/60 border border-blue-800/60 px-3 py-1.5 rounded-lg shadow-sm">
              <Ico.Edit /> Klik teks di sertifikat atau pilih menu di kanan untuk menggeser posisi
            </div>
          )}

          {/* Scaled Canvas Container (Menjaga rasio dan tidak pernah terpotong) */}
          <div
            className="relative flex items-center justify-center my-auto transition-all duration-150"
            style={{
              width: Math.round(CANVAS_W * effectiveScale),
              height: Math.round(CANVAS_H * effectiveScale),
              minWidth: Math.round(CANVAS_W * effectiveScale),
              minHeight: Math.round(CANVAS_H * effectiveScale),
            }}
          >
            <div
              className="relative shadow-2xl rounded overflow-hidden border border-slate-800 bg-[#F8F8F8]"
              style={{
                width: CANVAS_W,
                height: CANVAS_H,
                transform: `scale(${effectiveScale})`,
                transformOrigin: 'top left',
                position: 'absolute',
                top: 0,
                left: 0,
              }}
            >
              {activeSide === 'front' ? (
                <>
                  {/* FRONT TEMPLATE */}
                  {(sample.type === 'critical_thinking' || sample.type === 'field_study') ? (
                    <>
                      {templateImgFsFront
                        ? <img src={templateImgFsFront} alt="Template Critical Thinking Depan" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
                        : <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">Memuat template critical thinking depan...</div>
                      }

                      {/* Recipient Name */}
                      <div
                        onClick={() => { setSelectedKey('fs_recipient_name'); setEditMode(true); setMobilePanelOpen(true); }}
                        className={`absolute cursor-pointer transition-all ${editMode && selectedKey === 'fs_recipient_name' ? 'ring-2 ring-blue-500 bg-blue-50/20 rounded' : editMode ? 'hover:ring-1 hover:ring-blue-300' : ''}`}
                        style={{ top: mmToPx(layout.fs_recipient_name?.top ?? 70.0), left: 0, right: 0, height: mmToPx(16), lineHeight: `${mmToPx(16)}px`, textAlign: 'center', fontSize: `${(layout.fs_recipient_name?.font_size ?? 33.0) * (SCALE / 3.4)}px`, fontWeight: 700, color: '#000000', fontFamily: "'Arial MT Pro', Arial, sans-serif", zIndex: 10 }}
                      >
                        {sample.name}
                      </div>

                      {/* Training Course Title */}
                      <div
                        onClick={() => { setSelectedKey('fs_course_title'); setEditMode(true); setMobilePanelOpen(true); }}
                        className={`absolute cursor-pointer transition-all ${editMode && selectedKey === 'fs_course_title' ? 'ring-2 ring-blue-500 bg-blue-50/20 rounded' : editMode ? 'hover:ring-1 hover:ring-blue-300' : ''}`}
                        style={{ top: mmToPx(layout.fs_course_title?.top ?? 108.5), left: mmToPx(15), right: mmToPx(15), textAlign: 'center', fontSize: `${(layout.fs_course_title?.font_size ?? 19.0) * (SCALE / 3.4)}px`, fontWeight: 700, color: '#133e7c', fontFamily: "'Arial MT Pro', Arial, sans-serif", zIndex: 10 }}
                      >
                        {sample.courseTitle || 'INTERNATIONAL BLUE ECONOMIST CERTIFICATION TRAINING COURSE'}
                      </div>

                      {/* Date of Participation */}
                      <div
                        onClick={() => { setSelectedKey('fs_date_participation'); setEditMode(true); setMobilePanelOpen(true); }}
                        className={`absolute cursor-pointer transition-all ${editMode && selectedKey === 'fs_date_participation' ? 'ring-2 ring-blue-500 bg-blue-50/20 rounded' : editMode ? 'hover:ring-1 hover:ring-blue-300' : ''}`}
                        style={{ top: mmToPx(layout.fs_date_participation?.top ?? 134.5), left: 0, right: 0, textAlign: 'center', fontSize: `${(layout.fs_date_participation?.font_size ?? 14.0) * (SCALE / 3.4)}px`, fontWeight: 700, color: '#000000', fontFamily: "'Arial MT Pro', Arial, sans-serif", zIndex: 10 }}
                      >
                        <span className="px-2" style={{ backgroundColor: '#F8F8F8' }}>on {sample.dateParticipation || '20 May – 11 June 2026'}</span>
                      </div>

                      {/* Place & Issue Date */}
                      <div
                        onClick={() => { setSelectedKey('fs_date_issue'); setEditMode(true); setMobilePanelOpen(true); }}
                        className={`absolute cursor-pointer transition-all ${editMode && selectedKey === 'fs_date_issue' ? 'ring-2 ring-blue-500 bg-blue-50/20 rounded' : editMode ? 'hover:ring-1 hover:ring-blue-300' : ''}`}
                        style={{ top: mmToPx(layout.fs_date_issue?.top ?? 141.5), left: 0, right: 0, textAlign: 'center', fontSize: `${(layout.fs_date_issue?.font_size ?? 14.0) * (SCALE / 3.4)}px`, fontWeight: 400, color: '#000000', fontFamily: "'Arial MT Pro', Arial, sans-serif", zIndex: 10 }}
                      >
                        <span className="px-2" style={{ backgroundColor: '#F8F8F8' }}>{sample.dateIssue || 'Jakarta, 11 June 2026'}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      {(() => {
                        const isFoundationSample = sample.level.toLowerCase().includes('foundation');
                        const activeFrontImg = isFoundationSample ? (templateImgFound || templateImg) : (templateImgSpec || templateImg);
                        return activeFrontImg
                          ? <img src={activeFrontImg} alt="Template" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
                          : <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">Memuat template depan...</div>;
                      })()}

                      {/* Serial Number */}
                      <div
                        onClick={() => { setSelectedKey('serial_no'); setEditMode(true); setMobilePanelOpen(true); }}
                        className={`absolute cursor-pointer transition-all ${editMode && selectedKey === 'serial_no' ? 'ring-2 ring-blue-500 bg-blue-50/70 rounded' : editMode ? 'hover:ring-1 hover:ring-blue-300' : ''}`}
                        style={{ top: mmToPx(layout.serial_no?.top ?? 13), right: mmToPx(layout.serial_no?.right ?? 16.5), width: mmToPx(layout.serial_no?.width ?? 105), height: mmToPx(7.5), lineHeight: `${mmToPx(7.5)}px`, backgroundColor: 'transparent', fontSize: `${(layout.serial_no?.font_size ?? 11) * (SCALE / 3.4)}px`, fontFamily: "'Poppins', sans-serif", color: '#111827', textAlign: 'right', zIndex: 10 }}
                      >
                        Certificate Serial No. {sample.serial}
                      </div>

                      {/* Recipient Name */}
                      <div
                        onClick={() => { setSelectedKey('recipient_name'); setEditMode(true); setMobilePanelOpen(true); }}
                        className={`absolute cursor-pointer transition-all ${editMode && selectedKey === 'recipient_name' ? 'ring-2 ring-blue-500 bg-blue-50/20 rounded' : editMode ? 'hover:ring-1 hover:ring-blue-300' : ''}`}
                        style={{ top: mmToPx(layout.recipient_name?.top ?? 69.5), left: 0, right: 0, height: mmToPx(16), lineHeight: `${mmToPx(16)}px`, textAlign: 'center', fontSize: `${(layout.recipient_name?.font_size ?? 32.5) * (SCALE / 3.4)}px`, fontWeight: 700, color: '#000', fontFamily: "'Arial MT Pro', Arial, sans-serif", zIndex: 10 }}
                      >
                        {sample.name}
                      </div>

                      {/* Ribbon Text */}
                      <div
                        onClick={() => { setSelectedKey('ribbon_text'); setEditMode(true); setMobilePanelOpen(true); }}
                        className={`absolute cursor-pointer transition-all ${editMode && selectedKey === 'ribbon_text' ? 'ring-2 ring-blue-500 bg-amber-400/10 rounded' : editMode ? 'hover:ring-1 hover:ring-blue-300' : ''}`}
                        style={{ top: mmToPx(layout.ribbon_text?.top ?? 100.5), left: mmToPx(20), right: mmToPx(20), height: mmToPx(layout.ribbon_text?.height ?? 14), lineHeight: `${mmToPx(layout.ribbon_text?.height ?? 14)}px`, textAlign: 'center', fontSize: `${(layout.ribbon_text?.font_size ?? 22.5) * (SCALE / 3.4)}px`, fontWeight: 700, color: '#173874', fontFamily: "'Arial MT Pro', Arial, sans-serif", zIndex: 10 }}
                      >
                        {sample.ribbon}
                      </div>

                      {/* Level */}
                      <div
                        onClick={() => { setSelectedKey('level_value'); setEditMode(true); setMobilePanelOpen(true); }}
                        className={`absolute cursor-pointer transition-all ${editMode && selectedKey === 'level_value' ? 'ring-2 ring-blue-500 bg-blue-50/30 rounded' : editMode ? 'hover:ring-1 hover:ring-blue-300' : ''}`}
                        style={{ top: mmToPx(layout.level_value?.top ?? 124.5), left: 0, right: 0, textAlign: 'center', fontSize: `${(layout.level_value?.font_size ?? 14.5) * (SCALE / 3.4)}px`, fontWeight: 700, color: '#000', fontFamily: "'Poppins', sans-serif", zIndex: 10 }}
                      >
                        {sample.level}
                      </div>

                      {/* Meta Block */}
                      <div
                        onClick={() => { setSelectedKey('meta_block'); setEditMode(true); setMobilePanelOpen(true); }}
                        className={`absolute cursor-pointer transition-all ${editMode && selectedKey === 'meta_block' ? 'ring-2 ring-blue-500 bg-blue-50/50 rounded' : editMode ? 'hover:ring-1 hover:ring-blue-300' : ''}`}
                        style={{ top: mmToPx(layout.meta_block?.top ?? 138.2), left: mmToPx(103.5), width: mmToPx(90), height: mmToPx(18.5), backgroundColor: '#F8F8F8', textAlign: 'center', fontSize: `${(layout.meta_block?.font_size ?? 11.5) * (SCALE / 3.4)}px`, lineHeight: 1.55, color: '#111827', fontFamily: "'Poppins', sans-serif", zIndex: 10 }}
                      >
                        <div><strong>Grade:</strong> {sample.grade}</div>
                        <div><strong>Date of issue:</strong> {sample.date}</div>
                        <div><strong>Place of issue:</strong> {sample.place}</div>
                      </div>

                      {/* QR Left */}
                      <div
                        onClick={() => { setSelectedKey('qr_left'); setEditMode(true); setMobilePanelOpen(true); }}
                        className={`absolute cursor-pointer transition-all ${editMode && selectedKey === 'qr_left' ? 'ring-2 ring-blue-500' : editMode ? 'hover:ring-1 hover:ring-blue-300' : ''}`}
                        style={{ top: mmToPx(layout.qr_left?.top ?? 147.5), left: mmToPx(layout.qr_left?.left ?? 67), width: mmToPx(layout.qr_left?.size ?? 26), height: mmToPx(layout.qr_left?.size ?? 26), zIndex: 10 }}
                      >
                        <div className="w-full h-full p-1 bg-white border border-slate-300 rounded flex items-center justify-center">
                          <Ico.QR />
                        </div>
                      </div>

                      {/* QR Right */}
                      <div
                        onClick={() => { setSelectedKey('qr_right'); setEditMode(true); setMobilePanelOpen(true); }}
                        className={`absolute cursor-pointer transition-all ${editMode && selectedKey === 'qr_right' ? 'ring-2 ring-blue-500' : editMode ? 'hover:ring-1 hover:ring-blue-300' : ''}`}
                        style={{ top: mmToPx(layout.qr_right?.top ?? 147.5), left: mmToPx(layout.qr_right?.left ?? 196.4), width: mmToPx(layout.qr_right?.size ?? 26), height: mmToPx(layout.qr_right?.size ?? 26), zIndex: 10 }}
                      >
                        <div className="w-full h-full p-1 bg-white border border-slate-300 rounded flex items-center justify-center">
                          <Ico.QR />
                        </div>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  {/* BACK TEMPLATE */}
                  {(sample.type === 'critical_thinking' || sample.type === 'field_study') ? (
                    <>
                      {(() => {
                        const customFsBack = (sample.type === 'field_study' && sample.trackSlug && fsBacks[sample.trackSlug])
                          ? `data:image/png;base64,${fsBacks[sample.trackSlug]}`
                          : null;
                        const activeBack = sample.type === 'field_study'
                          ? (customFsBack || templateImgFsBack || templateImgCtBack)
                          : (templateImgCtBack || templateImgFsBack);
                        return activeBack
                          ? <img src={activeBack} alt={sample.type === 'field_study' ? 'Template Field Study Belakang' : 'Template Critical Thinking Belakang'} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
                          : <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">Memuat template belakang...</div>;
                      })()}

                      {/* Standardized Field Study / Critical Thinking Back Info */}
                      {(() => {
                        const computedNameTop = layout.fs_back_name?.top ?? 25.5;
                        const computedNameLeft = layout.fs_back_name?.left ?? 16.5;
                        const computedRegTop = layout.fs_back_reg_no?.top ?? 30.8;
                        const computedRegLeft = layout.fs_back_reg_no?.left ?? 16.5;

                        return (
                          <>
                            {/* Clean mask covering Canva's uneven label text */}
                            <div
                              style={{
                                position: 'absolute',
                                top: mmToPx(23.5),
                                left: mmToPx(14.0),
                                width: mmToPx(240.0),
                                height: mmToPx(14.5),
                                backgroundColor: '#F8F8F8',
                                pointerEvents: 'none',
                                zIndex: 5,
                              }}
                            />

                            {/* Back Name */}
                            <div
                              onClick={() => { setSelectedKey('fs_back_name'); setEditMode(true); setMobilePanelOpen(true); }}
                              className={`absolute cursor-pointer transition-all ${editMode && selectedKey === 'fs_back_name' ? 'ring-2 ring-blue-500 bg-blue-50/20 rounded' : editMode ? 'hover:ring-1 hover:ring-blue-300' : ''}`}
                              style={{ top: mmToPx(computedNameTop), left: mmToPx(computedNameLeft), fontSize: `${(layout.fs_back_name?.font_size ?? 11.5) * (SCALE / 3.4)}px`, color: '#111827', fontFamily: "Arial, sans-serif", zIndex: 10 }}
                            >
                              <span style={{ fontWeight: 400 }}>Name : </span>
                              <strong style={{ fontWeight: 700 }}>{sample.name}</strong>
                            </div>

                            {/* Back Registration Number */}
                            <div
                              onClick={() => { setSelectedKey('fs_back_reg_no'); setEditMode(true); setMobilePanelOpen(true); }}
                              className={`absolute cursor-pointer transition-all ${editMode && selectedKey === 'fs_back_reg_no' ? 'ring-2 ring-blue-500 bg-blue-50/20 rounded' : editMode ? 'hover:ring-1 hover:ring-blue-300' : ''}`}
                              style={{ top: mmToPx(computedRegTop), left: mmToPx(computedRegLeft), fontSize: `${(layout.fs_back_reg_no?.font_size ?? 11.5) * (SCALE / 3.4)}px`, color: '#111827', fontFamily: "Arial, sans-serif", zIndex: 10 }}
                            >
                              <span style={{ fontWeight: 400 }}>Registration Number : </span>
                              <strong style={{ fontWeight: 700 }}>{sample.regNo || 'CBETC001062026'}</strong>
                            </div>
                          </>
                        );
                      })()}
                    </>
                  ) : (
                    <>
                      {(() => {
                        const customSpecBack = (sample.type === 'specialization' && sample.trackSlug && specBacks[sample.trackSlug])
                          ? `data:image/png;base64,${specBacks[sample.trackSlug]}`
                          : null;
                        const backImgSrc = customSpecBack || templateBackImg;

                        return (
                          <>
                            {backImgSrc
                              ? <img src={backImgSrc} alt="Template Belakang" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
                              : <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">Memuat template belakang...</div>
                            }

                            {/* Back Side Title Block (only rendered if no custom specialization background with embedded table) */}
                            {!customSpecBack && (
                              <div
                                onClick={() => { setSelectedKey('back_title'); setEditMode(true); setMobilePanelOpen(true); }}
                                className={`absolute cursor-pointer transition-all ${editMode && selectedKey === 'back_title' ? 'ring-2 ring-blue-500 bg-blue-50/20 rounded p-1.5' : editMode ? 'hover:ring-1 hover:ring-blue-300' : ''}`}
                                style={{
                                  top: mmToPx(layout.back_title?.top ?? 20.0),
                                  left: mmToPx(20),
                                  right: mmToPx(20),
                                  textAlign: 'center',
                                  fontFamily: "'Poppins', sans-serif",
                                  zIndex: 10,
                                }}
                              >
                                {sample.name.includes('Budi') ? (
                                  <>
                                    <div style={{ fontSize: `${(layout.back_title?.font_size ?? 15.0) * (SCALE / 3.4)}px`, fontWeight: 700, color: '#000000', lineHeight: 1.25 }}>
                                      List of Competency Units of Certified Blue Economist (CBEc)
                                    </div>
                                    <div style={{ fontSize: `${Math.max(10, (layout.back_title?.font_size ?? 15.0) - 2.0) * (SCALE / 3.4)}px`, fontWeight: 400, color: '#000000', marginTop: `${mmToPx(2.2)}px`, lineHeight: 1.2 }}>
                                      Foundation Level
                                    </div>
                                  </>
                                ) : (
                                  <div style={{ fontSize: `${(layout.back_title?.font_size ?? 15.0) * (SCALE / 3.4)}px`, fontWeight: 700, color: '#000000', lineHeight: 1.25, marginTop: `${mmToPx(3.5)}px` }}>
                                    List of Competency Units of {sample.ribbon}
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Bottom Toolbar: Auto Fit & Zoom Controls */}
          <div className="flex items-center justify-between w-full max-w-xl gap-2 pt-1 flex-wrap">
            <span className="text-slate-500 text-[10px] sm:text-[11px] truncate">
              A4 (297×210mm) · Skala layar: <strong className="text-slate-300">{Math.round(effectiveScale * 100)}%</strong>
            </span>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 shadow-md ml-auto">
              <button
                type="button"
                onClick={() => {
                  const current = effectiveScale;
                  setZoomMode(Math.max(0.4, Number((current - 0.1).toFixed(2))));
                }}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Perkecil (-)"
              >
                <Ico.ZoomOut />
              </button>

              <button
                type="button"
                onClick={() => setZoomMode('fit')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${zoomMode === 'fit' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Sesuaikan otomatis dengan layar laptop/perangkat"
              >
                Fit Layar
              </button>

              <button
                type="button"
                onClick={() => setZoomMode(0.75)}
                className={`px-1.5 py-0.5 rounded text-[11px] transition ${zoomMode === 0.75 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                75%
              </button>

              <button
                type="button"
                onClick={() => setZoomMode(1.0)}
                className={`px-1.5 py-0.5 rounded text-[11px] transition ${zoomMode === 1.0 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                100%
              </button>

              <button
                type="button"
                onClick={() => {
                  const current = effectiveScale;
                  setZoomMode(Math.min(1.5, Number((current + 0.1).toFixed(2))));
                }}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Perbesar (+)"
              >
                <Ico.ZoomIn />
              </button>
            </div>
          </div>
        </main>

        {/* Sidebar Controls (Responsif: Docked di desktop, Slide-over di laptop kecil/tablet/HP) */}
        <aside
          className={`fixed lg:static inset-y-0 right-0 z-40 w-80 max-w-[85vw] bg-slate-900 border-l border-slate-800 flex flex-col overflow-hidden transition-transform duration-200 ease-in-out ${mobilePanelOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full lg:translate-x-0'
            }`}
        >
          {/* Mobile drawer header */}
          <div className="lg:hidden px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Ico.Sliders /> Pengaturan Elemen Sertifikat
            </span>
            <button
              onClick={() => setMobilePanelOpen(false)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <Ico.Close />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800">

            {activeSide === 'back' && (
              <div className="p-3 bg-indigo-950/40 border-b border-indigo-800/40 text-[11px] text-indigo-200">
                <div className="font-semibold text-indigo-300 flex items-center gap-1.5 mb-1">
                  <Ico.Info /> Desain Halaman Belakang
                </div>
                {(sample.type === 'critical_thinking' || sample.type === 'field_study')
                  ? 'Struktur kurikulum Critical Thinking / Completion (30 Jam, 1.5 ECTS) resmi konsorsium.'
                  : 'Template background unit kompetensi resmi konsorsium. Judul di atas tabel dirender dinamis.'
                }
              </div>
            )}

            {/* Section: Field Selector */}
            <div>
              <button onClick={() => setOpenSection(openSection === 'fields' ? null : 'fields')}
                className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/50 transition">
                <span className="flex items-center gap-2"><Ico.Edit /> Pilih Elemen Teks</span>
                <span className={`transition-transform ${openSection === 'fields' ? 'rotate-180' : ''}`}><Ico.ChevronDown /></span>
              </button>

              {openSection === 'fields' && (
                <div className="px-3 pb-3 space-y-1">
                  {((sample.type === 'critical_thinking' || sample.type === 'field_study')
                    ? (activeSide === 'front' ? FIELD_LIST_FS_FRONT : FIELD_LIST_FS_BACK)
                    : (activeSide === 'front' ? FIELD_LIST_FRONT : FIELD_LIST_BACK)
                  ).map(({ key, label }) => (
                    <button key={key} onClick={() => { setSelectedKey(key); setEditMode(true); }}
                      className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-xs transition ${selectedKey === key ? 'bg-blue-600/25 text-blue-200 border border-blue-500/30 font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
                      {label}
                      {selectedKey === key && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Section: Controls for selected field */}
            {sel && (
              <div className="px-4 py-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">{sel.label}</span>
                  <div className="flex items-center gap-1.5">
                    {['recipient_name', 'ribbon_text', 'fs_recipient_name', 'fs_course_title'].includes(selectedKey) && (
                      <span className="text-[10px] text-amber-300 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded font-medium">Arial MT Pro</span>
                    )}
                    {['serial_no', 'level_value', 'meta_block', 'back_title'].includes(selectedKey) && (
                      <span className="text-[10px] text-sky-300 bg-sky-950/60 border border-sky-800/60 px-2 py-0.5 rounded font-medium">Poppins</span>
                    )}
                    <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded font-mono">mm</span>
                  </div>
                </div>

                {/* Top */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="text-slate-400">Posisi Vertikal (Top)</span>
                    <span className="font-mono text-blue-400 font-bold">{sel.top} mm</span>
                  </div>
                  <input type="range" min="5" max="190" step="0.5" value={sel.top}
                    onChange={e => updateField(selectedKey, 'top', parseFloat(e.target.value))}
                    className="w-full accent-blue-500 h-1.5 cursor-pointer" />
                </div>

                {/* Left */}
                {typeof sel.left === 'number' && (
                  <div>
                    <div className="flex justify-between text-[11px] mb-1.5">
                      <span className="text-slate-400">Posisi Horizontal (Left)</span>
                      <span className="font-mono text-blue-400 font-bold">{sel.left} mm</span>
                    </div>
                    <input type="range" min="10" max="250" step="0.5" value={sel.left ?? 0}
                      onChange={e => updateField(selectedKey, 'left', parseFloat(e.target.value))}
                      className="w-full accent-blue-500 h-1.5 cursor-pointer" />
                  </div>
                )}

                {/* Right */}
                {typeof sel.right === 'number' && (
                  <div>
                    <div className="flex justify-between text-[11px] mb-1.5">
                      <span className="text-slate-400">Posisi Horizontal (Right)</span>
                      <span className="font-mono text-blue-400 font-bold">{sel.right} mm</span>
                    </div>
                    <input type="range" min="5" max="100" step="0.5" value={sel.right ?? 0}
                      onChange={e => updateField(selectedKey, 'right', parseFloat(e.target.value))}
                      className="w-full accent-blue-500 h-1.5 cursor-pointer" />
                  </div>
                )}

                {/* Font size */}
                {sel.font_size !== undefined && (
                  <div>
                    <div className="flex justify-between text-[11px] mb-1.5">
                      <span className="text-slate-400">Ukuran Huruf</span>
                      <span className="font-mono text-blue-400 font-bold">{sel.font_size} pt</span>
                    </div>
                    <input type="range" min="7" max="40" step="0.5" value={sel.font_size}
                      onChange={e => updateField(selectedKey, 'font_size', parseFloat(e.target.value))}
                      className="w-full accent-blue-500 h-1.5 cursor-pointer" />
                  </div>
                )}

                {/* QR size */}
                {sel.size !== undefined && (
                  <div>
                    <div className="flex justify-between text-[11px] mb-1.5">
                      <span className="text-slate-400">Ukuran QR</span>
                      <span className="font-mono text-blue-400 font-bold">{sel.size} mm</span>
                    </div>
                    <input type="range" min="15" max="40" step="1" value={sel.size}
                      onChange={e => updateField(selectedKey, 'size', parseFloat(e.target.value))}
                      className="w-full accent-blue-500 h-1.5 cursor-pointer" />
                  </div>
                )}

                <button onClick={() => handleResetField(selectedKey)}
                  className="w-full text-[11px] text-slate-500 hover:text-amber-400 flex items-center justify-center gap-1.5 pt-1 transition cursor-pointer">
                  <Ico.Reset /> Reset &quot;{sel.label}&quot; ke default
                </button>
              </div>
            )}

            {/* Section: Live Test Inputs */}
            <div>
              <button onClick={() => setOpenSection(openSection === 'preview' ? null : 'preview')}
                className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/50 transition">
                <span className="flex items-center gap-2"><Ico.Eye /> Uji Coba Teks</span>
                <span className={`transition-transform ${openSection === 'preview' ? 'rotate-180' : ''}`}><Ico.ChevronDown /></span>
              </button>

              {openSection === 'preview' && (
                <div className="px-4 pb-4 space-y-3">
                  {(sample.type === 'critical_thinking' || sample.type === 'field_study') ? (
                    <>
                      {/* Nama Peserta */}
                      <div>
                        <label className="text-[11px] text-slate-500 block mb-1">Nama Peserta</label>
                        <input
                          type="text"
                          value={sample.name}
                          onChange={e => setSample({ ...sample, name: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Judul Pelatihan */}
                      <div>
                        <label className="text-[11px] text-slate-500 block mb-1">Judul Pelatihan</label>
                        <input
                          type="text"
                          value={sample.courseTitle || ''}
                          onChange={e => setSample({ ...sample, courseTitle: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Tanggal Partisipasi */}
                      <div>
                        <label className="text-[11px] text-slate-500 block mb-1">Tanggal Partisipasi</label>
                        <input
                          type="text"
                          value={sample.dateParticipation || ''}
                          onChange={e => setSample({ ...sample, dateParticipation: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                          placeholder="20 May – 11 June 2026"
                        />
                      </div>

                      {/* Tempat & Tanggal Terbit */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] text-slate-500">Tempat &amp; Tanggal Terbit</label>
                          <button
                            type="button"
                            onClick={() => {
                              const today = new Date();
                              const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                              const todayIssue = `Jakarta, ${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()}`;
                              const newRegNo = sample.regNo ? syncRegNoWithDate(sample.regNo, todayIssue) : sample.regNo;
                              const newSerial = syncSerialWithDate(sample.serial, todayIssue);
                              setSample({ ...sample, dateIssue: todayIssue, regNo: newRegNo, serial: newSerial });
                            }}
                            className="text-[10px] text-blue-400 hover:text-blue-300 font-medium transition cursor-pointer flex items-center gap-1"
                            title="Set tanggal ke hari ini dan update otomatis bulan/tahun nomor registrasi & serial"
                          >
                            <Ico.Calendar /> Tanggal Hari Ini (Dinamis)
                          </button>
                        </div>
                        <input
                          type="text"
                          value={sample.dateIssue || ''}
                          onChange={e => {
                            const newDateIssue = e.target.value;
                            const newRegNo = sample.regNo ? syncRegNoWithDate(sample.regNo, newDateIssue) : sample.regNo;
                            const newSerial = syncSerialWithDate(sample.serial, newDateIssue);
                            setSample({ ...sample, dateIssue: newDateIssue, regNo: newRegNo, serial: newSerial });
                          }}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                          placeholder="Jakarta, 11 June 2026"
                        />
                      </div>

                      {/* Nomor Registrasi Belakang */}
                      <div>
                        <label className="text-[11px] text-slate-500 block mb-1">Nomor Registrasi (Halaman Belakang)</label>
                        <input
                          type="text"
                          value={sample.regNo || ''}
                          onChange={e => setSample({ ...sample, regNo: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                          placeholder="CBETC001062026"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Nomor Seri */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] text-slate-500">Nomor Seri</label>
                          <button
                            type="button"
                            onClick={() => {
                              const match = sample.serial.match(/(20\d{2}[\/\-_]?)(\d+)/);
                              if (match) {
                                const prefix = match[1];
                                const numStr = match[2];
                                const nextNum = (parseInt(numStr, 10) + 1).toString().padStart(numStr.length, '0');
                                const nextSerial = sample.serial.replace(`${prefix}${numStr}`, `${prefix}${nextNum}`);
                                setSample({ ...sample, serial: nextSerial });
                              }
                            }}
                            className="text-[10px] text-blue-400 hover:text-blue-300 font-medium transition cursor-pointer flex items-center gap-1"
                            title="Klik untuk menaikkan nomor urut berikutnya (+1)"
                          >
                            +1 Urutan Selanjutnya
                          </button>
                        </div>
                        <input
                          type="text"
                          value={sample.serial}
                          onChange={e => setSample({ ...sample, serial: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                          placeholder="Contoh: CBEC/ID/IX/20260187"
                        />
                      </div>

                      {/* Nama Peserta */}
                      <div>
                        <label className="text-[11px] text-slate-500 block mb-1">Nama Peserta</label>
                        <input
                          type="text"
                          value={sample.name}
                          onChange={e => setSample({ ...sample, name: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Teks Ribbon */}
                      <div>
                        <label className="text-[11px] text-slate-500 block mb-1">Teks Ribbon</label>
                        <input
                          type="text"
                          value={sample.ribbon}
                          onChange={e => setSample({ ...sample, ribbon: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Level & Grade */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-slate-500 block mb-1">Level</label>
                          <input
                            type="text"
                            value={sample.level}
                            onChange={e => setSample({ ...sample, level: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-500 block mb-1">Grade</label>
                          <input
                            type="text"
                            value={sample.grade}
                            onChange={e => setSample({ ...sample, grade: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Date of issue & Place of issue */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] text-slate-500">Date of issue</label>
                            <button
                              type="button"
                              onClick={() => {
                                const today = new Date();
                                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                                const todayDate = `${monthNames[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`;
                                const newSerial = syncSerialWithDate(sample.serial, todayDate);
                                setSample({ ...sample, date: todayDate, serial: newSerial });
                              }}
                              className="text-[10px] text-blue-400 hover:text-blue-300 font-medium transition cursor-pointer flex items-center gap-1"
                              title="Set tanggal ke hari ini dan update otomatis bulan/tahun nomor serial"
                            >
                              <Ico.Calendar /> Hari Ini
                            </button>
                          </div>
                          <input
                            type="text"
                            value={sample.date}
                            onChange={e => {
                              const newDate = e.target.value;
                              const newSerial = syncSerialWithDate(sample.serial, newDate);
                              setSample({ ...sample, date: newDate, serial: newSerial });
                            }}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-500 block mb-1">Place of issue</label>
                          <input
                            type="text"
                            value={sample.place}
                            onChange={e => setSample({ ...sample, place: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="px-4 py-3 flex gap-2.5 items-start">
              <span className="text-blue-400 mt-0.5 shrink-0"><Ico.Info /></span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Perubahan posisi yang disimpan akan otomatis digunakan saat mengunduh sertifikat PDF resmi.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* ── Modal: Konfirmasi & Pilihan Lingkup Reset ──────────────────── */}
      {showResetModal && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadein"
            onClick={() => setShowResetModal(false)}
          >
            <div
              className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg p-6 sm:p-7 relative my-auto animate-fadeup text-white"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Modal */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Ico.Reset />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                      Reset Layout Sertifikat
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Pilih lingkup pengaturan tata letak yang ingin dikembalikan ke default:
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
                  title="Tutup dialog"
                >
                  <Ico.Close />
                </button>
              </div>

              {/* Pilihan Opsi Reset */}
              <div className="py-5 space-y-3">
                {/* Opsi 1: Reset Halaman Aktif Saja */}
                <button
                  type="button"
                  onClick={handleResetCurrentPage}
                  className="w-full text-left p-4 rounded-2xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 hover:border-blue-500/50 transition group flex items-start gap-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                    <Ico.Edit />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-blue-200 group-hover:text-blue-100">
                        Reset {activeSide === 'back' ? 'Halaman Belakang' : 'Halaman Depan'} Saja
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Direkomendasikan
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {activeSide === 'back'
                        ? 'Hanya mengembalikan posisi elemen Halaman Belakang (Nama Peserta Belakang, Nomor Registrasi Belakang, Judul Kurikulum). Halaman Depan tetap aman.'
                        : 'Hanya mengembalikan posisi elemen Halaman Depan (Nama, Nomor Seri, Ribbon, Grade, QR Code). Halaman Belakang tetap aman.'}
                    </p>
                  </div>
                </button>

                {/* Opsi 2: Reset Seluruh Template */}
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="w-full text-left p-4 rounded-2xl border border-slate-700/80 bg-slate-800/40 hover:bg-rose-500/10 hover:border-rose-500/30 transition group flex items-start gap-3.5 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-700/50 text-slate-400 group-hover:bg-rose-500/20 group-hover:text-rose-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                    <Ico.Reset />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-sm text-slate-200 group-hover:text-rose-200">
                      Reset Seluruh Template (Semua Halaman)
                    </span>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Mengembalikan seluruh tata letak (baik Halaman Depan maupun Halaman Belakang) ke setelan awal pabrik.
                    </p>
                  </div>
                </button>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
