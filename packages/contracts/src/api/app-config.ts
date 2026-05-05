export interface AgentModelPrefs {
  model?: string;
  reasoning?: string;
}

export type AppMode = 'daemon' | 'api';

export type ApiProtocol = 'anthropic' | 'openai';

export interface AppConfigPrefs {
  onboardingCompleted?: boolean;
  agentId?: string | null;
  agentModels?: Record<string, AgentModelPrefs>;
  skillId?: string | null;
  designSystemId?: string | null;
  mode?: AppMode;
  baseUrl?: string;
  allowLocalApiBaseUrl?: boolean;
  model?: string;
  apiProtocol?: ApiProtocol;
  apiProviderBaseUrl?: string | null;
}

export interface AppConfigResponse {
  config: AppConfigPrefs;
}

export type UpdateAppConfigRequest = Partial<AppConfigPrefs>;
