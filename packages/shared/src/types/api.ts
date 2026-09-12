export interface ApiError {
  error: string;
  code: string;
  details: Record<string, unknown>;
}

export interface HealthResponse {
  status: 'ok';
  service: 'autosite-api';
  timestamp: string;
}
