import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini API 클라이언트
let genAI: GoogleGenerativeAI | null = null;

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
    const modelName = 'gemini-3-pro-preview';
    console.log('[Gemini] Creating model:', modelName);

    const model = ai.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: options?.temperature ?? 0.8,
        maxOutputTokens: options?.maxTokens ?? 8192,
        topP: options?.topP ?? 0.95,
        topK: options?.topK ?? 40,
      },
    });

    console.log('[Gemini] Model created, generating content...');

    const result = await model.generateContent(prompt);
    console.log('[Gemini] Content generated, processing response...');

    const response = await result.response;
    const text = response.text();

    console.log('[Gemini] Response text length:', text?.length || 0);

    return text;
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
  }
): AsyncGenerator<string, void, unknown> {
  console.log('[Gemini] generateTextStream called');

  if (!apiKey) {
    console.error('[Gemini] Streaming: No API key!');
    throw new Error('API 키가 설정되지 않았습니다.');
  }

  try {
    const ai = initGemini(apiKey);
    const modelName = 'gemini-3-pro-preview';
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

// JSON 응답 생성 (파싱 포함)
export async function generateJSON<T>(
  apiKey: string,
  prompt: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
): Promise<T> {
  console.log('[Gemini] generateJSON called');

  const fullPrompt = `${prompt}\n\n중요: 응답은 반드시 유효한 JSON 형식이어야 합니다. 마크다운 코드 블록 없이 순수 JSON만 출력하세요.`;

  const text = await generateText(apiKey, fullPrompt, options);

  try {
    console.log('[Gemini] JSON parsing, original length:', text?.length || 0);

    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.slice(7);
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.slice(3);
    }
    if (cleanedText.endsWith('```')) {
      cleanedText = cleanedText.slice(0, -3);
    }
    cleanedText = cleanedText.trim();

    const parsed = JSON.parse(cleanedText) as T;
    console.log('[Gemini] JSON parsed successfully');
    return parsed;
  } catch (error) {
    console.error('[Gemini] JSON parsing failed');
    console.error('[Gemini] Original response (first 500 chars):', text?.slice(0, 500));
    console.error('[Gemini] Parse error:', error);
    // 더 상세한 에러 메시지 제공
    const preview = text?.slice(0, 200) || '(empty response)';
    throw new Error(`AI 응답을 JSON으로 파싱하는데 실패했습니다.\n\n응답 미리보기: ${preview}...`);
  }
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
