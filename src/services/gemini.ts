const API_BASE = 'http://localhost:3001';

// Returns AsyncGenerator<string> — compatible with `for await (const chunk of stream)`
export async function* generateContentStream(
  prompt: string,
  systemPrompt: string,
  model: string,
  projectType: string,
  signal?: AbortSignal
): AsyncGenerator<string> {
  const response = await fetch(`${API_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, systemPrompt, model, projectType }),
    signal
  });

  if (!response.ok) {
    throw new Error(`Generation failed: ${response.status}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const parsed = JSON.parse(trimmed);
        // Ollama NDJSON: { response: "token", done: false }
        if (parsed.response) yield parsed.response;
        // SSE fallback: data: { text: "token" }
        if (parsed.text) yield parsed.text;
      } catch {
        // SSE line: "data: {...}"
        if (trimmed.startsWith('data: ')) {
          try {
            const d = JSON.parse(trimmed.slice(6));
            if (d.text) yield d.text;
            if (d.response) yield d.response;
          } catch {}
        }
      }
    }
  }
}

export async function generateContent(
  prompt: string,
  model: string,
  projectType?: string
): Promise<{ text: string }> {
  const r = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: prompt, history: [], model, projectType })
  });
  const d = await r.json();
  return { text: d.response || d.text || '' };
}

export async function computeVision(prompt: string): Promise<string> {
  const r = await fetch(`${API_BASE}/api/vision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  const d = await r.json();
  return d.url || d.svg || '';
}
