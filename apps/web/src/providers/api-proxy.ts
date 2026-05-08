import { effectiveMaxTokens } from '../state/maxTokens';
import type { AppConfig, ChatMessage } from '../types';
import { isLocalApiBaseUrl } from '../utils/apiBaseUrl';
import type { StreamHandlers } from './anthropic';
import { parseSseFrame } from './sse';

export async function streamProxyEndpoint(
  endpoint: string,
  cfg: AppConfig,
  system: string,
  history: ChatMessage[],
  signal: AbortSignal,
  handlers: StreamHandlers,
): Promise<void> {
  const localGateway = isLocalApiBaseUrl(cfg.baseUrl);
  if (!cfg.apiKey && !localGateway) {
    handlers.onError(new Error('Missing API key — open Settings and paste one in.'));
    return;
  }

  let acc = '';

  try {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        baseUrl: cfg.baseUrl,
        ...(cfg.apiKey ? { apiKey: cfg.apiKey } : {}),
        model: cfg.model,
        systemPrompt: system,
        messages: history.map((m) => ({ role: m.role, content: m.content })),
        maxTokens: effectiveMaxTokens(cfg),
        apiVersion: cfg.apiVersion,
      }),
      signal,
    });

    if (!resp.ok || !resp.body) {
      const text = await resp.text().catch(() => '');
      handlers.onError(new Error(`proxy ${resp.status}: ${text || 'no body'}`));
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });

      while (true) {
        const match = buf.match(/\r?\n\r?\n/);
        if (!match || match.index === undefined) break;
        const frame = buf.slice(0, match.index);
        buf = buf.slice(match.index + match[0].length);

        const parsed = parseSseFrame(frame);
        if (!parsed || parsed.kind !== 'event') continue;

        if (parsed.event === 'delta' || parsed.event === 'message') {
          const text =
            parsed.event === 'delta'
              ? String(parsed.data.delta ?? parsed.data.text ?? '')
              : extractProxyMessageText(parsed.data);
          if (text) {
            acc += text;
            handlers.onDelta(text);
          }
          continue;
        }

        if (parsed.event === 'error') {
          handlers.onError(new Error(proxyErrorMessage(parsed.data)));
          return;
        }

        if (parsed.event === 'end') {
          handlers.onDone(acc);
          return;
        }
      }
    }

    handlers.onDone(acc);
  } catch (err) {
    if ((err as Error).name === 'AbortError') return;
    handlers.onError(err instanceof Error ? err : new Error(String(err)));
  }
}

function proxyErrorMessage(data: Record<string, unknown>): string {
  const nested = data.error;
  if (nested && typeof nested === 'object' && 'message' in nested) {
    const message = (nested as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  return String(data.message ?? 'proxy error');
}

function extractProxyMessageText(data: Record<string, unknown>): string {
  if (typeof data.text === 'string') return data.text;

  const choices = Array.isArray(data.choices) ? data.choices : [];
  const firstChoice = choices[0];
  if (!firstChoice || typeof firstChoice !== 'object') return '';

  const delta =
    'delta' in firstChoice &&
    firstChoice.delta &&
    typeof firstChoice.delta === 'object'
      ? firstChoice.delta
      : null;
  const content = delta && 'content' in delta ? delta.content : undefined;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (!part || typeof part !== 'object') return '';
        return part.type === 'text' && typeof part.text === 'string'
          ? part.text
          : '';
      })
      .join('');
  }

  return '';
}
