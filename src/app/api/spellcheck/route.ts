import { NextRequest, NextResponse } from 'next/server';
import { performSpellCheck } from '@/lib/spellCheckEngine';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();

    if (
      !body ||
      typeof body !== 'object' ||
      !('text' in body) ||
      typeof (body as { text: unknown }).text !== 'string'
    ) {
      return NextResponse.json(
        { error: '요청 본문에 "text" 필드(문자열)가 필요합니다.' },
        { status: 400 },
      );
    }

    const { text } = body as { text: string };

    if (text.length === 0) {
      return NextResponse.json({ corrections: [], score: 100 });
    }

    if (text.length > 100_000) {
      return NextResponse.json(
        { error: '텍스트는 100,000자 이하여야 합니다.' },
        { status: 400 },
      );
    }

    const result = performSpellCheck(text);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
