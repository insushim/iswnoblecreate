import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiModel } from '@/types';

// Gemini API 클라이언트
let genAI: GoogleGenerativeAI | null = null;

// 모델별 가격 정보 (참고용)
export const MODEL_PRICING = {
  'gemini-3-flash-preview': { input: 0.50, output: 3.00, description: '최신 고품질 모델 (유료)' },
  'gemini-2.5-flash': { input: 0.15, output: 0.60, description: '고성능 모델 (유료)' },
  'gemini-2.0-flash': { input: 0, output: 0, description: '무료 모델 (추천)' },
  'gemini-1.5-flash': { input: 0.075, output: 0.30, description: '경량 모델 (유료)' },
} as const;

// 모델 옵션 (UI용)
export const MODEL_OPTIONS: { value: GeminiModel; label: string; description: string; price: string }[] = [
  { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash', description: '최신 고품질 모델', price: '$0.50/$3.00 (1M 토큰)' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', description: '고성능 모델', price: '$0.15/$0.60 (1M 토큰)' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', description: '무료 모델 (추천)', price: '무료' },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', description: '경량 모델', price: '$0.075/$0.30 (1M 토큰)' },
];

// Rate Limit 방지를 위한 마지막 요청 시간 추적
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1500; // 최소 1.5초 간격

// 요청 간 딜레이 함수
async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`[Gemini] Rate limit: waiting ${waitTime}ms before next request`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  lastRequestTime = Date.now();
}

export function initGemini(apiKey: string): GoogleGenerativeAI {
  console.log('[Gemini] initGemini called');
  console.log('[Gemini] API key exists:', !!apiKey);
  console.log('[Gemini] API key length:', apiKey?.length || 0);

  genAI = new GoogleGenerativeAI(apiKey);
  console.log('[Gemini] GoogleGenerativeAI instance created');
  return genAI;
}

export function getGemini(): GoogleGenerativeAI | null {
  return genAI;
}

// 기본 텍스트 생성
export async function generateText(
  apiKey: string,
  prompt: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
    model?: GeminiModel; // 모델 선택 옵션 추가
  }
): Promise<string> {
  console.log('[Gemini] generateText called');
  console.log('[Gemini] API key valid:', !!apiKey, 'length:', apiKey?.length || 0);
  console.log('[Gemini] Prompt length:', prompt?.length || 0);

  if (!apiKey) {
    console.error('[Gemini] No API key!');
    throw new Error('API 키가 설정되지 않았습니다. 설정에서 Gemini API 키를 등록해주세요.');
  }

  if (apiKey.length < 10) {
    console.error('[Gemini] API key too short:', apiKey.length);
    throw new Error('API 키가 유효하지 않습니다. 올바른 API 키를 입력해주세요.');
  }

  try {
    const ai = initGemini(apiKey);
    const modelName = options?.model || 'gemini-2.0-flash';
    console.log('[Gemini] Creating model:', modelName);

    const maxOutputTokens = options?.maxTokens ?? 8192;
    console.log('[Gemini] Setting maxOutputTokens:', maxOutputTokens);

    const model = ai.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: options?.temperature ?? 0.8,
        maxOutputTokens: maxOutputTokens,
        topP: options?.topP ?? 0.95,
        topK: options?.topK ?? 40,
      },
    });

    console.log('[Gemini] Model created, generating content...');

    // Rate Limit 방지를 위한 대기
    await waitForRateLimit();

    // 재시도 로직 (최대 3회)
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        console.log('[Gemini] Content generated, processing response...');

        const response = await result.response;

        // 상세 디버깅: 응답 구조 확인
        console.log('[Gemini] Response candidates:', response.candidates?.length || 0);
        if (response.candidates && response.candidates.length > 0) {
          const candidate = response.candidates[0];
          console.log('[Gemini] Finish reason:', candidate.finishReason);
          console.log('[Gemini] Safety ratings:', JSON.stringify(candidate.safetyRatings));

          // 콘텐츠 필터링으로 차단된 경우
          if (candidate.finishReason === 'SAFETY') {
            console.error('[Gemini] Content blocked by safety filter');
            throw new Error('콘텐츠가 안전 필터에 의해 차단되었습니다. 프롬프트를 수정해주세요.');
          }
          if (candidate.finishReason === 'RECITATION') {
            console.error('[Gemini] Content blocked due to recitation');
            throw new Error('콘텐츠가 저작권 문제로 차단되었습니다.');
          }
        }

        // promptFeedback 확인 (프롬프트 자체가 차단된 경우)
        if (response.promptFeedback) {
          console.log('[Gemini] Prompt feedback:', JSON.stringify(response.promptFeedback));
          if (response.promptFeedback.blockReason) {
            console.error('[Gemini] Prompt blocked:', response.promptFeedback.blockReason);
            throw new Error(`프롬프트가 차단되었습니다: ${response.promptFeedback.blockReason}`);
          }
        }

        const text = response.text();

        console.log('[Gemini] Response text length:', text?.length || 0);

        // 빈 응답 체크
        if (!text || text.trim().length === 0) {
          console.warn(`[Gemini] Empty response on attempt ${attempt}/${maxRetries}`);
          if (attempt < maxRetries) {
            // Rate Limit 가능성이 높으므로 더 긴 대기 (2초, 4초, 6초)
            const waitTime = 2000 * attempt;
            console.log(`[Gemini] Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          throw new Error('AI가 빈 응답을 반환했습니다. 잠시 후 다시 시도해주세요. (Rate Limit 가능성)');
        }

        return text;
      } catch (retryError) {
        console.error(`[Gemini] Attempt ${attempt}/${maxRetries} failed:`, retryError);
        lastError = retryError instanceof Error ? retryError : new Error(String(retryError));

        // 재시도 불가능한 에러는 즉시 throw
        if (lastError.message.includes('API_KEY_INVALID') ||
            lastError.message.includes('PERMISSION_DENIED')) {
          throw lastError;
        }

        if (attempt < maxRetries) {
          // 에러 시 더 긴 대기 (3초, 6초)
          const waitTime = 3000 * attempt;
          console.log(`[Gemini] Error retry: waiting ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    throw lastError || new Error('알 수 없는 오류가 발생했습니다.');
  } catch (error: unknown) {
    console.error('[Gemini] generateText error:');
    console.error('[Gemini] Error type:', typeof error);
    console.error('[Gemini] Error object:', error);

    if (error instanceof Error) {
      console.error('[Gemini] Error message:', error.message);

      if (error.message.includes('API_KEY_INVALID') || error.message.includes('API key not valid')) {
        throw new Error('API 키가 유효하지 않습니다. Google AI Studio에서 새 키를 발급받아주세요.');
      }
      if (error.message.includes('PERMISSION_DENIED')) {
        throw new Error('API 접근 권한이 거부되었습니다. API 키 권한을 확인해주세요.');
      }
      if (error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('429')) {
        throw new Error('API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
      }
      if (error.message.includes('model') && error.message.includes('not found')) {
        throw new Error('요청한 모델을 찾을 수 없습니다. 모델명을 확인해주세요.');
      }
    }

    throw error;
  }
}

// 스트리밍 텍스트 생성
export async function* generateTextStream(
  apiKey: string,
  prompt: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
    model?: GeminiModel; // 모델 선택 옵션 추가
  }
): AsyncGenerator<string, void, unknown> {
  console.log('[Gemini] generateTextStream called');

  if (!apiKey) {
    console.error('[Gemini] Streaming: No API key!');
    throw new Error('API 키가 설정되지 않았습니다.');
  }

  try {
    const ai = initGemini(apiKey);
    const modelName = options?.model || 'gemini-2.0-flash';
    const model = ai.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: options?.temperature ?? 0.8,
        maxOutputTokens: options?.maxTokens ?? 8192,
        topP: options?.topP ?? 0.95,
        topK: options?.topK ?? 40,
      },
    });

    console.log('[Gemini] Streaming started with model:', modelName);
    const result = await model.generateContentStream(prompt);
    let totalLength = 0;

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        totalLength += text.length;
        yield text;
      }
    }

    console.log('[Gemini] Streaming complete, total length:', totalLength);
  } catch (error: unknown) {
    console.error('[Gemini] generateTextStream error:', error);
    if (error instanceof Error) {
      console.error('[Gemini] Error message:', error.message);
    }
    throw error;
  }
}

// JSON 응답 생성 (파싱 포함) - 재시도 로직 포함
export async function generateJSON<T>(
  apiKey: string,
  prompt: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    model?: GeminiModel; // 모델 선택 옵션 추가
  }
): Promise<T> {
  console.log('[Gemini] generateJSON called');
  console.log('[Gemini] Using model:', options?.model || 'gemini-2.0-flash');

  // JSON 생성 시 더 많은 토큰 필요 (기본 16384)
  const jsonOptions = {
    temperature: options?.temperature ?? 0.7, // JSON은 약간 낮은 temperature
    maxTokens: options?.maxTokens ?? 16384, // JSON 생성에 충분한 토큰
    model: options?.model, // 모델 전달
  };

  const fullPrompt = `${prompt}

중요 지침:
1. 응답은 반드시 완전하고 유효한 JSON 형식이어야 합니다.
2. 마크다운 코드 블록(백틱)을 절대 사용하지 마세요.
3. JSON 외의 어떤 텍스트도 포함하지 마세요.
4. 모든 문자열은 반드시 닫혀야 합니다.
5. 응답이 중간에 끊기지 않도록 완전한 JSON을 출력하세요.`;

  // JSON 파싱 재시도 로직 (최대 3회)
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Gemini] JSON generation attempt ${attempt}/${maxRetries}`);

      const text = await generateText(apiKey, fullPrompt, jsonOptions);

      console.log('[Gemini] JSON parsing, original length:', text?.length || 0);

      // 빈 응답 체크
      if (!text || text.trim().length === 0) {
        console.warn(`[Gemini] Empty JSON response on attempt ${attempt}`);
        if (attempt < maxRetries) {
          const waitTime = 3000 * attempt;
          console.log(`[Gemini] Waiting ${waitTime}ms before JSON retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        throw new Error('AI가 빈 응답을 반환했습니다.');
      }

      let cleanedText = text.trim();

      // 마크다운 코드 블록 제거
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.slice(7);
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.slice(3);
      }
      if (cleanedText.endsWith('```')) {
        cleanedText = cleanedText.slice(0, -3);
      }
      cleanedText = cleanedText.trim();

      // JSON이 잘린 경우 감지 (Unterminated string 등)
      const openBraces = (cleanedText.match(/{/g) || []).length;
      const closeBraces = (cleanedText.match(/}/g) || []).length;
      const openBrackets = (cleanedText.match(/\[/g) || []).length;
      const closeBrackets = (cleanedText.match(/]/g) || []).length;

      if (openBraces !== closeBraces || openBrackets !== closeBrackets) {
        console.warn(`[Gemini] JSON appears truncated: braces ${openBraces}/${closeBraces}, brackets ${openBrackets}/${closeBrackets}`);
        if (attempt < maxRetries) {
          const waitTime = 3000 * attempt;
          console.log(`[Gemini] Truncated JSON, waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }

      const parsed = JSON.parse(cleanedText) as T;
      console.log('[Gemini] JSON parsed successfully');
      return parsed;
    } catch (error) {
      console.error(`[Gemini] JSON attempt ${attempt}/${maxRetries} failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));

      // JSON 파싱 에러는 재시도
      if (attempt < maxRetries) {
        const waitTime = 3000 * attempt;
        console.log(`[Gemini] JSON parse error, waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
    }
  }

  // 모든 재시도 실패
  console.error('[Gemini] All JSON generation attempts failed');
  throw lastError || new Error('JSON 생성에 실패했습니다. 잠시 후 다시 시도해주세요.');
}

// 에러 타입
export enum AIErrorType {
  RATE_LIMIT = 'RATE_LIMIT',
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
}

export interface AIError {
  type: AIErrorType;
  message: string;
  retry: boolean;
}

// 에러 핸들러
export function handleAIError(error: unknown): AIError {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('429') || message.includes('quota') || message.includes('rate')) {
      return {
        type: AIErrorType.RATE_LIMIT,
        message: 'API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
        retry: true,
      };
    }

    if (message.includes('network') || message.includes('fetch')) {
      return {
        type: AIErrorType.NETWORK_ERROR,
        message: '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.',
        retry: true,
      };
    }

    if (message.includes('parse') || message.includes('json')) {
      return {
        type: AIErrorType.PARSE_ERROR,
        message: 'AI 응답을 처리하는데 실패했습니다. 다시 시도해주세요.',
        retry: true,
      };
    }

    if (message.includes('api') || message.includes('key')) {
      return {
        type: AIErrorType.API_ERROR,
        message: 'API 키가 유효하지 않습니다. 설정에서 API 키를 확인해주세요.',
        retry: false,
      };
    }
  }

  return {
    type: AIErrorType.API_ERROR,
    message: '알 수 없는 오류가 발생했습니다.',
    retry: true,
  };
}
