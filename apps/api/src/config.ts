export interface AppConfig {
  host: string;
  port: number;
  jwtSecret: string;
  webOrigin: string;
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
  host: process.env['HOST'] ?? '0.0.0.0',
  port: parsePort(process.env['PORT']),
  jwtSecret:
    process.env['JWT_SECRET'] ??
    'autosite-local-development-secret-change-before-production',
  webOrigin: process.env['WEB_ORIGIN'] ?? 'http://localhost:3000',
});
