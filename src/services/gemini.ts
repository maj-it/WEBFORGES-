/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * AI Bridge Service (X-Kernel Core)
 * This service proxies all AI requests to the secure server backend.
 * NO API KEYS ARE STORED OR EXPOSED HERE.
 */

export async function* generateContentStream(prompt: string, systemPrompt: string, model?: string, projectType?: string, signal?: AbortSignal) {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-project-type': projectType || 'web'
    },
    body: JSON.stringify({ prompt, systemPrompt, model, projectType }),
    signal
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `AI_REQUEST_FAILED: ${response.status}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) throw new Error("AI_STREAM_FAILURE: ReadableStream initialization failed.");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    
    // Ollama returns JSON chunks, but we might want just the 'response' field
    // or if the server forwarded raw chunks, we parse them.
    // Assuming server forwards Ollama internal format for now as per my previous server.ts edit
    try {
      const lines = chunk.split('\n').filter(l => l.trim());
      for (const line of lines) {
        const parsed = JSON.parse(line);
        if (parsed.response) yield parsed.response;
        if (parsed.message?.content) yield parsed.message.content;
      }
    } catch (e) {
      // If it's not JSON, it might be raw text (unlikely given Ollama stream)
      if (chunk) yield chunk;
    }
  }
}

export async function generateContent(prompt: string, model?: string, projectType?: string) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-project-type': projectType || 'web'
    },
    body: JSON.stringify({ 
      messages: [{ role: 'user', content: prompt }], 
      model,
      projectType
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `AI_REQUEST_FAILED: ${response.status}`);
  }

  const data = await response.json();
  return {
    text: data.message?.content || data.response || ""
  };
}

export async function computeVision(prompt: string, projectType?: string, signal?: AbortSignal) {
  try {
    const response = await fetch('/api/vision', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-project-type': projectType || 'web'
      },
      body: JSON.stringify({ prompt, projectType }),
      signal
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      let errorData;
      try {
        errorData = JSON.parse(text);
      } catch (e) {
        errorData = { error: `Neural cluster transmission failure (HTTP ${response.status})` };
      }
      throw new Error(errorData.error || "VISION_SYNTHESIS_FAILED");
    }
    
    // Safety check for JSON body to avoid "Unexpected token <" errors
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const textSample = await response.clone().text().catch(() => "N/A");
      console.error("Non-JSON Response Sample:", textSample.substring(0, 100));
      throw new Error(`VISION_DECODE_ERROR: Kernel returned ${contentType || 'no'} content-type instead of JSON. Sample: ${textSample.substring(0, 50)}...`);
    }

    let data;
    try {
      data = await response.json();
    } catch (e) {
      const textSample = await response.clone().text().catch(() => "N/A");
      throw new Error(`VISION_DECODE_ERROR: Failed to parse JSON body. Sample: ${textSample.substring(0, 50)}...`);
    }
    
    if (!data) throw new Error("VISION_DECODE_ERROR: Invalid kernel data format");
    return data;
  } catch (err: any) {
    if (err.name === 'AbortError') throw new Error("VISION_ABORTED: Render canceled by user or timeout");
    console.error("Vision Error:", err);
    throw err;
  }
}
