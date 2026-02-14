import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '설정',
  description:
    'NovelForge AI 설정 - API 키 관리, AI 모델 선택, 에디터 환경, 테마 설정을 관리하세요.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
