import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  let targetUrl = searchParams.get('url');
  const path = searchParams.get('path');

  if (!targetUrl && path) {
    const backendBase = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1')
      .replace(/\/api\/v1\/?$/, '')
      .replace(/\/api\/?$/, '');
    targetUrl = `${backendBase}/storage/${path.replace(/^\//, '')}`;
  }

  if (!targetUrl) {
    return new NextResponse('Parameter "url" atau "path" wajib disertakan.', { status: 400 });
  }

  try {
    const rangeHeader = request.headers.get('range');
    const headers: Record<string, string> = {};
    if (rangeHeader) {
      headers['Range'] = rangeHeader;
    }

    const response = await fetch(targetUrl, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok && response.status !== 206) {
      return new NextResponse(`Gagal memuat dokumen PDF: ${response.status} ${response.statusText}`, {
        status: response.status,
      });
    }

    const resHeaders = new Headers();
    resHeaders.set('Content-Type', response.headers.get('content-type') || 'application/pdf');
    resHeaders.set('Content-Disposition', 'inline; filename="document.pdf"');
    resHeaders.set('Accept-Ranges', 'bytes');
    resHeaders.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');

    const contentLength = response.headers.get('content-length');
    if (contentLength) resHeaders.set('Content-Length', contentLength);

    const contentRange = response.headers.get('content-range');
    if (contentRange) resHeaders.set('Content-Range', contentRange);

    const body = await response.arrayBuffer();

    return new NextResponse(body, {
      status: response.status,
      headers: resHeaders,
    });
  } catch (err: any) {
    return new NextResponse(`Kesalahan server saat memuat PDF: ${err?.message || 'Unknown error'}`, {
      status: 500,
    });
  }
}
