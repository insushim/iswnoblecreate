import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '시리즈 관리',
  description:
    '여러 소설 작품을 시리즈로 묶어 관리하세요. 시리즈 내 작품들은 세계관과 캐릭터를 공유할 수 있습니다.',
  openGraph: {
    title: '시리즈 관리 | NovelForge AI',
    description:
      '여러 소설 작품을 시리즈로 묶어 세계관과 캐릭터를 공유하며 관리하세요.',
  },
};

export default function SeriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
