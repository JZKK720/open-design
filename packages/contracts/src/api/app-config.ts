export interface AgentModelPrefs {
  model?: string;
  reasoning?: string;
}

export type AppMode = 'daemon' | 'api';

export type ApiProtocol = 'anthropic' | 'openai' | 'azure' | 'google';

export type AgentCliEnvPrefs = Record<string, Record<string, string>>;

export interface AppConfigPrefs {
  onboardingCompleted?: boolean;
  agentId?: string | null;
  agentModels?: Record<string, AgentModelPrefs>;
  agentCliEnv?: AgentCliEnvPrefs;
  skillId?: string | null;
  designSystemId?: string | null;
  disabledSkills?: string[];
  disabledDesignSystems?: string[];
}

export interface AppConfigBootstrap {
  mode?: AppMode;
  baseUrl?: string;
  model?: string;
  apiProtocol?: ApiProtocol;
  apiProviderBaseUrl?: string | null;
}

export interface AppConfigResponse {
  config: AppConfigPrefs;
  bootstrap?: AppConfigBootstrap;
}

export type UpdateAppConfigRequest = Partial<AppConfigPrefs>;
