import type { Tone } from './content.js';

export type AiProviderName = 'openai' | 'anthropic';

export interface AiFallbackDetails {
  provider: AiProviderName;
  fallback: 'deterministic-mock';
  note: string;
}

export interface AiResponseMetadata {
  details?: AiFallbackDetails;
}

export interface RewriteRequest {
  text: string;
  instruction: string;
  tone: Tone;
}

export interface RewriteResponse extends AiResponseMetadata {
  rewritten: string;
  tokens_used: number;
}

export type SuggestSectionType = 'hero' | 'features' | 'services' | 'contact';

export interface SuggestRequest {
  context: string;
  section_type: SuggestSectionType;
}

export interface ContentSuggestion {
  heading: string;
  subheading: string;
  cta_text: string;
}

export interface SuggestResponse extends AiResponseMetadata {
  suggestions: ContentSuggestion[];
}
