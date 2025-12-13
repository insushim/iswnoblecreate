import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini API 클라이언트
let genAI: GoogleGenerativeAI | null = null;

export function initGemini(apiKey: string): GoogleGenerativeAI {
  genAI = new GoogleGenerativeAI(apiKey);
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
  const ai = initGemini(apiKey);
  const model = ai.getGenerativeModel({
    model: 'gemini-3-pro-preview',
    generationConfig: {
      temperature: options?.temperature ?? 0.8,
      maxOutputTokens: options?.maxTokens ?? 8192,
      topP: options?.topP ?? 0.95,
      topK: options?.topK ?? 40,
    },
  });

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
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
  const ai = initGemini(apiKey);
  const model = ai.getGenerativeModel({
    model: 'gemini-3-pro-preview',
    generationConfig: {
      temperature: options?.temperature ?? 0.8,
      maxOutputTokens: options?.maxTokens ?? 8192,
      topP: options?.topP ?? 0.95,
      topK: options?.topK ?? 40,
    },
  });

  const result = await model.generateContentStream(prompt);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      yield text;
    }
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
  const fullPrompt = `${prompt}\n\n중요: 응답은 반드시 유효한 JSON 형식이어야 합니다. 마크다운 코드 블록 없이 순수 JSON만 출력하세요.`;

  const text = await generateText(apiKey, fullPrompt, options);

  // JSON 파싱 시도
  try {
    // 마크다운 코드 블록 제거
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

    return JSON.parse(cleanedText) as T;
  } catch (error) {
    console.error('JSON 파싱 실패:', text);
    throw new Error('AI 응답을 JSON으로 파싱하는데 실패했습니다.');
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
