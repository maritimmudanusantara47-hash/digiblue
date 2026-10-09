export async function translateText(text: string | undefined | null, targetLocale: string): Promise<string> {
  if (!text) return '';
  if (targetLocale === 'id') return text;
  
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, target_lang: targetLocale })
    });
    
    if (!res.ok) return text;
    
    const data = await res.json();
    return data.text || text;
  } catch (err) {
    console.error('Failed to translate', err);
    return text;
  }
}
