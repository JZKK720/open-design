import type { ApiProtocol } from '../types';
import { isLocalApiBaseUrl } from './apiBaseUrl';

const API_PROTOCOL_LABELS: Record<ApiProtocol, string> = {
  anthropic: 'Anthropic API',
  openai: 'OpenAI API',
  azure: 'Azure OpenAI',
  google: 'Google Gemini',
  ollama: 'Ollama Cloud API',
  senseaudio: 'SenseAudio API',
};

const LOCAL_OLLAMA_API_LABEL = 'Ollama Local API';

const API_PROTOCOL_AGENT_IDS: Record<ApiProtocol, string> = {
  anthropic: 'anthropic-api',
  openai: 'openai-api',
  azure: 'azure-openai-api',
  google: 'google-gemini-api',
  ollama: 'ollama-cloud-api',
  senseaudio: 'senseaudio-api',
};

export function apiProtocolLabel(
  protocol: ApiProtocol | undefined,
  baseUrl?: string,
): string {
  if (protocol === 'ollama' && typeof baseUrl === 'string' && isLocalApiBaseUrl(baseUrl)) {
    return LOCAL_OLLAMA_API_LABEL;
  }
  return API_PROTOCOL_LABELS[protocol ?? 'anthropic'];
}

export function apiProtocolModelLabel(
  protocol: ApiProtocol | undefined,
  model: string,
  baseUrl?: string,
): string {
  const label = apiProtocolLabel(protocol, baseUrl);
  const trimmed = model.trim();
  return trimmed ? `${label} · ${trimmed}` : label;
}

export function apiProtocolAgentId(protocol: ApiProtocol | undefined): string {
  return API_PROTOCOL_AGENT_IDS[protocol ?? 'anthropic'];
}
