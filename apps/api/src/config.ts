import { DEFAULT_DATABASE_URL } from './db/client.js';
import type { AiProviderOptions } from './modules/ai/provider.js';

export interface AppConfig {
  databaseUrl: string;
  host: string;
  port: number;
  jwtSecret: string;
  webOrigin: string;
  aiProvider: AiProviderOptions;
}

const parsePort = (value: string | undefined): number => {
  if (value === undefined) {
    return 3001;
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  return port;
};

export const loadConfig = (): AppConfig => ({
  databaseUrl: process.env['DATABASE_URL'] ?? DEFAULT_DATABASE_URL,
  host: process.env['HOST'] ?? '0.0.0.0',
  port: parsePort(process.env['PORT']),
  jwtSecret:
    process.env['JWT_SECRET'] ??
    'autosite-local-development-secret-change-before-production',
  webOrigin: process.env['WEB_ORIGIN'] ?? 'http://localhost:3000',
  aiProvider: {
    ...(process.env['OPENAI_API_KEY'] === undefined
      ? {}
      : { openAiApiKey: process.env['OPENAI_API_KEY'] }),
    ...(process.env['ANTHROPIC_API_KEY'] === undefined
      ? {}
      : { anthropicApiKey: process.env['ANTHROPIC_API_KEY'] }),
    ...(process.env['AI_MODEL'] === undefined
      ? {}
      : { model: process.env['AI_MODEL'] }),
    ...(process.env['AI_BASE_URL'] === undefined
      ? {}
      : { baseUrl: process.env['AI_BASE_URL'] }),
  },
});
