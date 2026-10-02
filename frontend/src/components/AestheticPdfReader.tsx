'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

export interface AestheticPdfReaderProps {
  url: string;
  title?: string;
  allowDownload?: boolean;
  downloadFilename?: string;
  initialPage?: number;
  watermarkText?: string;
  height?: string;
  className?: string;
}

export default function AestheticPdfReader({
  url,
  title = 'Dokumen Materi Pembelajaran',
  allowDownload = false,
  downloadFilename = 'bahan-belajar-digibluecamp.pdf',
  initialPage = 1,
  watermarkText = 'DigiBlueCamp Digital Learning • Hak Cipta Dilindungi',
  height = '78vh',
  className = '',
}: AestheticPdfReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const continuousContainerRef = useRef<HTMLDivElement>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [pageInput, setPageInput] = useState<string>(String(initialPage));
  const [scale, setScale] = useState<number>(1.2);
  const [rotation, setRotation] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'single' | 'continuous'>('single');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [rendering, setRendering] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showProtectionNotice, setShowProtectionNotice] = useState<boolean>(false);

  // Render task cancellation ref to avoid canvas collisions
  const renderTaskRef = useRef<any>(null);

  // Proxy URL to prevent CORS issues
  const proxyUrl = url.startsWith('http') || url.startsWith('/')
    ? `/api/pdf-proxy?url=${encodeURIComponent(url)}`
    : `/api/pdf-proxy?path=${encodeURIComponent(url)}`;

  // ─── 1. Load PDF Document ──────────────────────────────────────────────────
  useEffect(() => {
    let isCancelled = false;

    async function loadPdf() {
      try {
        setLoading(true);
        setError(null);

        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        const loadingTask = pdfjs.getDocument({
          url: proxyUrl,
          cMapUrl: 'https://unpkg.com/pdfjs-dist@4.0.379/cmaps/',
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (isCancelled) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setPageInput('1');
        setLoading(false);
      } catch (err: any) {
        if (isCancelled) return;
        console.error('Error loading PDF:', err);
        setError(err?.message || 'Gagal memuat dokumen PDF. Pastikan tautan berkas valid.');
        setLoading(false);
      }
    }

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [proxyUrl]);

  // ─── 2. Render Single Page on Canvas ───────────────────────────────────────
  const renderPage = useCallback(
    async (pageNum: number) => {
      if (!pdfDoc || !canvasRef.current || viewMode !== 'single') return;

      try {
        setRendering(true);

        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const page = await pdfDoc.getPage(pageNum);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: scale * dpr, rotation });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / dpr}px`;
        canvas.style.height = `${viewport.height / dpr}px`;

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        const task = page.render(renderContext);
        renderTaskRef.current = task;
        await task.promise;
        setRendering(false);
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Error rendering page:', err);
        }
        setRendering(false);
      }
    },
    [pdfDoc, scale, rotation, viewMode]
  );

  useEffect(() => {
    if (viewMode === 'single' && pdfDoc) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, scale, rotation, viewMode, renderPage]);

  // ─── 3. Render Continuous Pages ───────────────────────────────────────────
  useEffect(() => {
    if (viewMode !== 'continuous' || !pdfDoc || !continuousContainerRef.current) return;

    let isCancelled = false;
    const container = continuousContainerRef.current;
    container.innerHTML = '';

    async function renderAllPages() {
      setRendering(true);
      const dpr = window.devicePixelRatio || 1;

      for (let i = 1; i <= pdfDoc.numPages; i++) {
        if (isCancelled) break;

        const pageWrapper = document.createElement('div');
        pageWrapper.className = 'relative flex flex-col items-center mb-6 last:mb-0';

        const pageBadge = document.createElement('div');
        pageBadge.className = 'text-[11px] font-semibold text-slate-400 mb-2 select-none';
        pageBadge.innerText = `Halaman ${i} dari ${pdfDoc.numPages}`;
        pageWrapper.appendChild(pageBadge);

        const canvas = document.createElement('canvas');
        canvas.className = 'rounded-xl shadow-xl transition-shadow bg-white';
        pageWrapper.appendChild(canvas);

        container.appendChild(pageWrapper);

        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: scale * dpr, rotation });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / dpr}px`;
        canvas.style.height = `${viewport.height / dpr}px`;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;
        }
      }
      setRendering(false);
    }

    renderAllPages();

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, viewMode, scale, rotation]);

  // ─── 4. Navigation & Zoom Handlers ────────────────────────────────────────
  const goToPage = (page: number) => {
    const target = Math.max(1, Math.min(page, numPages));
    setCurrentPage(target);
    setPageInput(String(target));
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(pageInput, 10);
    if (!isNaN(val)) {
      goToPage(val);
    } else {
      setPageInput(String(currentPage));
    }
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.6));
  const resetZoom = () => setScale(1.2);
  const rotateClockwise = () => setRotation(prev => (prev + 90) % 360);

  // ─── 5. Fullscreen Toggle ──────────────────────────────────────────────────
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // ─── 6. Anti-Download & Keyboard Safeguards ─────────────────────────────────
  const triggerProtectionNotice = useCallback(() => {
    if (allowDownload) return;
    setShowProtectionNotice(true);
    setTimeout(() => setShowProtectionNotice(false), 2800);
  }, [allowDownload]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if input is focused
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      // Protection: block Ctrl+S / Cmd+S (Save) and Ctrl+P / Cmd+P (Print)
      if (!allowDownload && (e.ctrlKey || e.metaKey)) {
        if (e.key.toLowerCase() === 's' || e.key.toLowerCase() === 'p') {
          e.preventDefault();
          e.stopPropagation();
          triggerProtectionNotice();
          return;
        }
      }

      // Keyboard navigation
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        goToPage(currentPage + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        goToPage(currentPage - 1);
      } else if (e.key === '+' || e.key === '=') {
        zoomIn();
      } else if (e.key === '-') {
        zoomOut();
      } else if (e.key === '0') {
        resetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, numPages, allowDownload, triggerProtectionNotice]);

  // ─── 7. Download Handler (Only when allowed) ──────────────────────────────
  const handleDownload = () => {
    if (!allowDownload) return;
    const a = document.createElement('a');
    a.href = proxyUrl;
    a.download = downloadFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      ref={containerRef}
      onContextMenu={e => {
        if (!allowDownload) {
          e.preventDefault();
          triggerProtectionNotice();
        }
      }}
      className={`relative flex flex-col rounded-3xl overflow-hidden border transition-all duration-300 select-none ${
        theme === 'dark'
          ? 'bg-slate-950 border-slate-800 text-slate-100 shadow-2xl'
          : 'bg-slate-100 border-slate-300 text-slate-800 shadow-xl'
      } ${isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen' : ''} ${className}`}
      style={!isFullscreen ? { height } : undefined}
    >
      {/* ─── Top Control Toolbar ─────────────────────────────────────────── */}
      <header
        className={`flex-shrink-0 flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b backdrop-blur-md transition-colors ${
          theme === 'dark'
            ? 'bg-slate-900/90 border-slate-800 text-white'
            : 'bg-white/95 border-slate-200 text-slate-800'
        }`}
      >
        {/* Left: Title & Status Badge */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-bold truncate max-w-[220px] sm:max-w-[340px] md:max-w-md">
              {title}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              {!allowDownload ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Mode Baca Langsung Terproteksi
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-400 bg-sky-950/60 border border-sky-800/60 px-2 py-0.5 rounded-full">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Bahan Belajar (Dapat Diunduh)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Pagination (Active in Single View) */}
        {viewMode === 'single' && numPages > 0 && (
          <div className="flex items-center gap-1 sm:gap-2 bg-slate-800/40 p-1 rounded-xl border border-slate-700/50">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1 || rendering}
              title="Halaman Sebelumnya (←)"
              className="p-1.5 rounded-lg hover:bg-slate-700/60 disabled:opacity-30 disabled:cursor-not-allowed transition text-xs flex items-center justify-center"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1 text-xs">
              <input
                type="text"
                value={pageInput}
                onChange={e => setPageInput(e.target.value)}
                onBlur={handlePageInputSubmit}
                className="w-10 sm:w-12 text-center py-1 px-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-sky-400 focus:outline-none focus:border-sky-500"
              />
              <span className="text-slate-400 text-xs font-medium">/ {numPages}</span>
            </form>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= numPages || rendering}
              title="Halaman Selanjutnya (→)"
              className="p-1.5 rounded-lg hover:bg-slate-700/60 disabled:opacity-30 disabled:cursor-not-allowed transition text-xs flex items-center justify-center"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* Right: Zoom, Layout, Rotation, Fullscreen & Conditional Download */}
        <div className="flex items-center gap-1.5">
          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-800/40 p-1 rounded-xl border border-slate-700/50">
            <button
              onClick={zoomOut}
              disabled={scale <= 0.6}
              title="Perkecil (-)"
              className="p-1.5 rounded-lg hover:bg-slate-700/60 disabled:opacity-30 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
              </svg>
            </button>
            <button
              onClick={resetZoom}
              title="Reset Zoom (0)"
              className="px-2 py-1 text-[11px] font-bold text-sky-400 hover:text-sky-300 transition"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              onClick={zoomIn}
              disabled={scale >= 3.0}
              title="Perbesar (+)"
              className="p-1.5 rounded-lg hover:bg-slate-700/60 disabled:opacity-30 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* View Mode Toggle: Single vs Continuous */}
          <button
            onClick={() => setViewMode(prev => (prev === 'single' ? 'continuous' : 'single'))}
            title={viewMode === 'single' ? 'Ubah ke Mode Scroll Berkelanjutan' : 'Ubah ke Mode Per Halaman'}
            className="p-2 rounded-xl bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700/50 transition text-xs font-semibold flex items-center gap-1"
          >
            {viewMode === 'single' ? '📄 Per Halaman' : '📜 Scroll Kontinu'}
          </button>

          {/* Rotate Clockwise */}
          <button
            onClick={rotateClockwise}
            title="Putar 90° Searah Jarum Jam"
            className="p-2 rounded-xl bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700/50 transition text-xs"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Theme Canvas Toggle */}
          <button
            onClick={() => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))}
            title="Ganti Mode Warna Latar Pembaca"
            className="p-2 rounded-xl bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700/50 transition text-xs"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Keluar Layar Penuh (Esc)' : 'Tampilan Layar Penuh'}
            className="p-2 rounded-xl bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700/50 transition text-xs"
          >
            {isFullscreen ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>

          {/* Download Button (Only visible if allowDownload is TRUE) */}
          {allowDownload && (
            <button
              onClick={handleDownload}
              className="ml-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-sky-500/20 transition-all hover:scale-105 active:scale-95"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Unduh Template (PDF)</span>
            </button>
          )}
        </div>
      </header>

      {/* ─── Protection Alert Toast ─────────────────────────────────────── */}
      {showProtectionNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 animate-fadeup bg-rose-600/95 text-white px-5 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-xs font-semibold border border-rose-400/40">
          <span className="text-base">🛡️</span>
          <span>Dokumen dilindungi. Pengunduhan & pencetakan dinonaktifkan untuk materi ini.</span>
        </div>
      )}

      {/* ─── Reading Canvas & Document Body ─────────────────────────────── */}
      <main
        className={`flex-1 overflow-auto relative p-4 sm:p-8 flex items-center justify-center transition-colors ${
          theme === 'dark' ? 'bg-slate-900/95' : 'bg-slate-200/90'
        }`}
      >
        {/* Loading Spinner */}
        {loading && (
          <div className="flex flex-col items-center gap-4 text-center my-16">
            <div className="relative w-14 h-14">
              <div className="w-14 h-14 rounded-full border-4 border-sky-400/20 border-t-sky-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-lg">🌊</div>
            </div>
            <div>
              <p className="font-bold text-sm text-sky-400">Menyiapkan Reader Digital DigiBlue...</p>
              <p className="text-xs text-slate-400 mt-1">Merender dokumen dengan resolusi tinggi</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="max-w-md p-6 rounded-2xl bg-rose-950/50 border border-rose-800 text-center my-12">
            <div className="text-4xl mb-3">⚠️</div>
            <h5 className="font-bold text-rose-300 text-sm mb-1">Gagal Membuka Dokumen</h5>
            <p className="text-xs text-rose-200 leading-relaxed mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition"
            >
              Muat Ulang Halaman
            </button>
          </div>
        )}

        {/* View Mode 1: Single Page Canvas */}
        {!loading && !error && viewMode === 'single' && (
          <div className="relative inline-block my-auto">
            {/* Watermark Overlay across Canvas */}
            <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center overflow-hidden opacity-10 select-none">
              <div className="transform -rotate-45 text-slate-400 font-extrabold text-sm sm:text-lg tracking-wider text-center leading-loose whitespace-pre-line">
                {watermarkText}
                {'\n'}
                {watermarkText}
                {'\n'}
                {watermarkText}
              </div>
            </div>

            {/* Rendering Spinner Overlay */}
            {rendering && (
              <div className="absolute top-3 right-3 z-20 bg-slate-900/80 backdrop-blur-sm text-sky-400 text-[10px] font-semibold px-2 py-1 rounded-lg border border-sky-500/30 flex items-center gap-1.5">
                <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <span>Rendering...</span>
              </div>
            )}

            <canvas
              ref={canvasRef}
              className="rounded-2xl shadow-2xl transition-all border border-slate-700/40 bg-white"
            />
          </div>
        )}

        {/* View Mode 2: Continuous Scroll Container */}
        {!loading && !error && viewMode === 'continuous' && (
          <div
            ref={continuousContainerRef}
            className="flex flex-col items-center w-full max-w-4xl py-6"
          />
        )}
      </main>

      {/* ─── Bottom Footer Status Bar ───────────────────────────────────── */}
      <footer
        className={`flex-shrink-0 flex items-center justify-between px-5 py-2 text-[11px] font-medium border-t ${
          theme === 'dark'
            ? 'bg-slate-950 border-slate-800 text-slate-400'
            : 'bg-white border-slate-200 text-slate-500'
        }`}
      >
        <div className="flex items-center gap-2">
          <span>DigiBlueCamp Smart Reader v2.0</span>
          <span>•</span>
          <span>{numPages > 0 ? `${numPages} Halaman Total` : 'Memuat...'}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline">Pintasan: [←/→] Balik Halaman, [+/-] Zoom</span>
          <span className="text-emerald-500 font-semibold">● Terhubung Aman</span>
        </div>
      </footer>
    </div>
  );
}
