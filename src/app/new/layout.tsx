import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '새 소설 프로젝트 만들기',
  description:
    'AI와 함께 새로운 소설 프로젝트를 시작하세요. 장르, 스타일, 캐릭터를 설정하고 AI가 소설의 뼈대를 만들어 드립니다.',
  openGraph: {
    title: '새 소설 프로젝트 만들기 | NovelForge AI',
    description:
      'AI와 함께 새로운 소설 프로젝트를 시작하세요. 아이디어를 입력하면 AI가 제목, 장르, 시놉시스를 자동 생성합니다.',
  },
};

export default function NewProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
