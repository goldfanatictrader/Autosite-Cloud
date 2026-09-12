import type { GenerateContentRequest } from '@autosite/shared';
import { describe, expect, it } from 'vitest';

import { generateContent } from '../src/modules/ai/generator.js';

describe('deterministic content generator contracts', () => {
  const base: Omit<GenerateContentRequest, 'tone' | 'language'> = {
    site_id: '30000000-0000-4000-8000-000000000001',
    brief: 'Independent design studio for thoughtful neighborhood brands',
    pages: ['home', 'about', 'services', 'contact'],
  };

  it.each([
    'professional',
    'friendly',
    'luxury',
    'casual',
    'bold',
    'formal',
    'playful',
    'minimal',
  ] as const)('supports the %s tone', (tone) => {
    const result = generateContent({ ...base, tone, language: 'en' });
    expect(result.pages.home?.sections).toHaveLength(2);
  });

  it.each(['en', 'es', 'fr', 'de', 'pt', 'it', 'ja', 'ko', 'zh', 'nl'] as const)(
    'supports content generation in %s',
    (language) => {
      const result = generateContent({
        ...base,
        language,
        tone: 'professional',
      });
      expect(result.pages).toHaveProperty('home');
      expect(result.tokens_used).toBeGreaterThan(0);
    },
  );
});
