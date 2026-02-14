import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '소설 템플릿',
  description:
    '로맨스, 판타지, 미스터리, 무협 등 20가지 이상의 장르별 소설 템플릿으로 빠르게 창작을 시작하세요.',
  openGraph: {
    title: '소설 템플릿 | NovelForge AI',
    description:
      '로맨스, 판타지, 미스터리, 무협 등 다양한 장르별 소설 템플릿을 제공합니다.',
  },
};

export default function TemplatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
