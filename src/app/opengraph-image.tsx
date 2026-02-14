import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'NovelForge AI - AI 소설 창작 스튜디오';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #141420 0%, #1a1a2e 30%, #16213e 60%, #0f3460 100%)',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decorative elements */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(202,169,80,0.15) 0%, transparent 70%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-150px',
            left: '-100px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(120,80,200,0.1) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Quill pen icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100px',
            height: '100px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #CAA950 0%, #E8C547 50%, #B8941F 100%)',
            marginBottom: '28px',
            boxShadow: '0 8px 32px rgba(202,169,80,0.3)',
          }}
        >
          <svg
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#141420"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 20h9" />
            <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
          }}
        >
          <span
            style={{
              fontSize: '56px',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-1px',
            }}
          >
            NovelForge
          </span>
          <span
            style={{
              fontSize: '56px',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #CAA950, #E8C547)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            AI
          </span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '26px',
            color: 'rgba(255,255,255,0.7)',
            marginBottom: '40px',
            letterSpacing: '2px',
          }}
        >
          AI 소설 창작 스튜디오
        </div>

        {/* Feature tags */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
          }}
        >
          {['캐릭터 설계', '플롯 구조', '세계관 구축', 'AI 집필', '출판 준비'].map(
            (tag) => (
              <div
                key={tag}
                style={{
                  padding: '10px 20px',
                  borderRadius: '100px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.65)',
                  fontSize: '16px',
                  display: 'flex',
                }}
              >
                {tag}
              </div>
            )
          )}
        </div>

        {/* Bottom sparkle accent */}
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            right: '32px',
            fontSize: '14px',
            color: 'rgba(202,169,80,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(202,169,80,0.6)">
            <path d="M12 2l2.09 6.26L20.18 9.27l-5.09 3.71L16.18 19.24 12 16l-4.18 3.24L8.91 13 3.82 9.27l6.09-1.01z" />
          </svg>
          Powered by Gemini AI
        </div>
      </div>
    ),
    { ...size }
  );
}
