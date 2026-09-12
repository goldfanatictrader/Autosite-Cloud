import type {
  GenerateContentRequest,
  RewriteRequest,
  SuggestRequest,
} from '@autosite/shared';
import { describe, expect, it } from 'vitest';

import {
  type AiFetcher,
  createAiProvider,
} from '../src/modules/ai/provider.js';

describe('AI provider selection and upstream adapters', () => {
  it('uses the OpenAI-compatible chat endpoint and configured model', async () => {
    let requestedUrl = '';
    let requestedInit: RequestInit | undefined;
    const fetcher: AiFetcher = async (input, init) => {
      requestedUrl = input.toString();
      requestedInit = init;
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  pages: {
                    home: {
                      sections: [
                        {
                          type: 'hero',
                          heading: 'Fresh Every Morning',
                          subheading: 'Bread made with patience and local grain',
                          cta_text: 'Visit the Bakery',
                        },
                      ],
                    },
                  },
                }),
              },
            },
          ],
          usage: { total_tokens: 87 },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    };
    const provider = createAiProvider({
      openAiApiKey: 'openai-test-key',
      anthropicApiKey: 'anthropic-test-key',
      model: 'compatible-json-model',
      baseUrl: 'https://llm.example.test/v1',
      fetcher,
    });
    const request: GenerateContentRequest = {
      site_id: '30000000-0000-4000-8000-000000000001',
      brief: 'Neighborhood bakery with fresh bread every morning',
      tone: 'friendly',
      language: 'en',
      pages: ['home'],
    };

    const result = await provider.generateContent(request);

    expect(requestedUrl).toBe(
      'https://llm.example.test/v1/chat/completions',
    );
    expect(new Headers(requestedInit?.headers).get('authorization')).toBe(
      'Bearer openai-test-key',
    );
    const requestBody = JSON.parse(String(requestedInit?.body)) as Record<
      string,
      unknown
    >;
    expect(requestBody['model']).toBe('compatible-json-model');
    expect(requestBody['stream']).toBe(false);
    expect(result).toEqual({
      pages: {
        home: {
          sections: [
            {
              type: 'hero',
              heading: 'Fresh Every Morning',
              subheading: 'Bread made with patience and local grain',
              cta_text: 'Visit the Bakery',
            },
          ],
        },
      },
      tokens_used: 87,
    });
  });

  it('uses Anthropic messages when only ANTHROPIC_API_KEY is configured', async () => {
    let requestedUrl = '';
    let requestedInit: RequestInit | undefined;
    const fetcher: AiFetcher = async (input, init) => {
      requestedUrl = input.toString();
      requestedInit = init;
      return new Response(
        JSON.stringify({
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                rewritten: 'Fresh bread, thoughtfully made each morning.',
              }),
            },
          ],
          usage: { input_tokens: 31, output_tokens: 12 },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    };
    const provider = createAiProvider({
      anthropicApiKey: 'anthropic-test-key',
      model: 'claude-test-model',
      fetcher,
    });
    const request: RewriteRequest = {
      text: 'We make bread every morning.',
      instruction: 'make it more professional',
      tone: 'professional',
    };

    const result = await provider.rewrite(request);

    expect(requestedUrl).toBe('https://api.anthropic.com/v1/messages');
    const headers = new Headers(requestedInit?.headers);
    expect(headers.get('x-api-key')).toBe('anthropic-test-key');
    expect(headers.get('anthropic-version')).toBe('2023-06-01');
    const requestBody = JSON.parse(String(requestedInit?.body)) as Record<
      string,
      unknown
    >;
    expect(requestBody['model']).toBe('claude-test-model');
    expect(requestBody['stream']).toBe(false);
    expect(result).toEqual({
      rewritten: 'Fresh bread, thoughtfully made each morning.',
      tokens_used: 43,
    });
  });

  it('uses deterministic output when neither provider key is configured', async () => {
    const provider = createAiProvider();
    const request: RewriteRequest = {
      text: 'We make bread every morning.',
      instruction: 'make it shorter',
      tone: 'friendly',
    };

    const first = await provider.rewrite(request);
    const second = await provider.rewrite(request);

    expect(first).toEqual(second);
    expect(first.details).toBeUndefined();
    expect(first.rewritten).toContain('With a warm welcome');
  });

  it('falls back when generated content could not be saved unchanged', async () => {
    const fetcher: AiFetcher = async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  pages: {
                    home: {
                      sections: [
                        {
                          type: 'hero',
                          heading: 'Fresh Every Morning',
                          subheading: 'Bread made nearby',
                          background_image: 'not-a-url',
                        },
                      ],
                    },
                  },
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    const provider = createAiProvider({
      openAiApiKey: 'openai-test-key',
      fetcher,
    });
    const request: GenerateContentRequest = {
      site_id: '30000000-0000-4000-8000-000000000001',
      brief: 'Neighborhood bakery with fresh bread every morning',
      tone: 'friendly',
      language: 'en',
      pages: ['home'],
    };

    const result = await provider.generateContent(request);

    expect(result.details).toMatchObject({
      provider: 'openai',
      fallback: 'deterministic-mock',
    });
    expect(result.pages.home?.sections[0]).toMatchObject({
      type: 'hero',
      heading: 'Welcome to Neighborhood Bakery',
    });
  });

  it('falls back when upstream suggestions are not one-line values', async () => {
    const fetcher: AiFetcher = async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  suggestions: [
                    {
                      heading: 'Fresh bread\nEvery morning',
                      subheading: 'Baked nearby',
                      cta_text: 'Visit us',
                    },
                    {
                      heading: 'Your neighborhood bakery',
                      subheading: 'Made with local grain',
                      cta_text: 'See the menu',
                    },
                    {
                      heading: 'Warm from the oven',
                      subheading: 'Slow fermentation, thoughtful ingredients',
                      cta_text: 'Order today',
                    },
                  ],
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    const provider = createAiProvider({
      openAiApiKey: 'openai-test-key',
      fetcher,
    });
    const request: SuggestRequest = {
      context: 'neighborhood bakery',
      section_type: 'hero',
    };

    const result = await provider.suggest(request);

    expect(result.details).toMatchObject({
      provider: 'openai',
      fallback: 'deterministic-mock',
    });
    expect(
      result.suggestions.every((suggestion) =>
        [suggestion.heading, suggestion.subheading, suggestion.cta_text].every(
          (value) => !/[\r\n\u2028\u2029]/u.test(value),
        ),
      ),
    ).toBe(true);
  });
});
