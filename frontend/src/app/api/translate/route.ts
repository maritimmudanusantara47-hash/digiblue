import { NextResponse } from 'next/server';

// Simple in-memory cache (persists as long as the Next.js node process is running)
const cache: Record<string, string> = {};

export async function POST(req: Request) {
  try {
    const { text, target_lang } = await req.json();

    if (!text) {
      return NextResponse.json({ text: '' });
    }

    // Since our DB is in ID, we only need to call DeepL if target is EN
    if (target_lang.toLowerCase() !== 'en') {
      return NextResponse.json({ text });
    }

    const cacheKey = `${text}_EN`;
    if (cache[cacheKey]) {
      return NextResponse.json({ text: cache[cacheKey] });
    }

    const apiKey = process.env.DEEPL_API_KEY;
    if (!apiKey) {
      console.warn('DEEPL_API_KEY not found in environment');
      return NextResponse.json({ text }); // fallback to original
    }

    const url = 'https://api-free.deepl.com/v2/translate';
    const body = new URLSearchParams({
      text: text,
      target_lang: 'EN',
      source_lang: 'ID'
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepL API Error:', errorText);
      return NextResponse.json({ text }); // fallback
    }

    const data = await response.json();
    const translated = data.translations?.[0]?.text || text;
    
    // Save to cache
    cache[cacheKey] = translated;
    
    return NextResponse.json({ text: translated });
  } catch (err) {
    console.error('Translation error:', err);
    return NextResponse.json({ text: 'Error translating' }, { status: 500 });
  }
}
