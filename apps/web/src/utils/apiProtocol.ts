import { isOpenAICompatible } from '../providers/openai-compatible';
import type { ApiProtocol, AppConfig } from '../types';
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

export function usesAnthropicProxy(cfg: AppConfig): boolean {
  if (
    cfg.apiProtocol === 'azure' ||
    cfg.apiProtocol === 'ollama' ||
    cfg.apiProtocol === 'google' ||
    cfg.apiProtocol === 'senseaudio' ||
    cfg.apiProtocol === 'openai'
  ) {
    return false;
  }
  if (!cfg.apiProtocol && isOpenAICompatible(cfg.model, cfg.baseUrl)) {
    return false;
  }
  return Boolean(cfg.baseUrl && cfg.baseUrl !== 'https://api.anthropic.com');
}

export function isAnthropicSupportedImagePath(path: string): boolean {
  const lower = path.toLowerCase();
  return /\.(jpe?g|png|gif|webp)$/.test(lower);
}
