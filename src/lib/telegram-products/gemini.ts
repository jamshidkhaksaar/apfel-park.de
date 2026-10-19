import { resolveGeminiKey } from '@/lib/ai-provider-credentials';

export const telegramGeminiJson = async (
  system: string,
  parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>,
): Promise<Record<string, unknown>> => {
  const key = await resolveGeminiKey();
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent', {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(25000),
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts }],
      generationConfig: { temperature: 0, maxOutputTokens: 1500, responseMimeType: 'application/json', thinkingConfig: { thinkingLevel: 'LOW' } },
    }),
  });
  if (!response.ok) throw new Error(response.status === 429 ? 'research_rate_limited' : 'photo_quality_unavailable');
  const body = await response.json() as { candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ text?: string; thought?: boolean }> } }> };
  const candidate = body.candidates?.[0];
  if (candidate?.finishReason !== 'STOP') throw new Error('photo_quality_unavailable');
  const text = candidate.content?.parts?.filter(part => !part.thought).map(part => part.text ?? '').join('') ?? '';
  try {
    const result: unknown = JSON.parse(text);
    if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error();
    return result as Record<string, unknown>;
  } catch { throw new Error('photo_quality_unavailable'); }
};
