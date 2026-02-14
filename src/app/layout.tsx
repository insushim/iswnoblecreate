/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata } from 'next';
import './globals.css';
import { ClientLayout } from './ClientLayout';

export const metadata: Metadata = {
  metadataBase: new URL('https://iswnoblecreate.vercel.app'),
  title: {
    default: 'NovelForge AI - AI 소설 창작 스튜디오',
    template: '%s | NovelForge AI',
  },
  description:
    'AI와 함께 전문 소설을 창작하세요. 캐릭터 설계, 플롯 구조, 세계관 구축부터 출판까지. 한국어 소설 창작 전문 AI 도구.',
  keywords: [
    '소설 쓰기',
    'AI 소설',
    '소설 창작 도구',
    '캐릭터 설계',
    '플롯 구조',
    '세계관 구축',
    '글쓰기 AI',
    '한국어 소설',
    '작가 도구',
    '출판 준비',
    'NovelForge',
  ],
  authors: [{ name: 'NovelForge AI' }],
  creator: 'NovelForge AI',
  publisher: 'NovelForge AI',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://iswnoblecreate.vercel.app',
    siteName: 'NovelForge AI',
    title: 'NovelForge AI - AI 소설 창작 스튜디오',
    description:
      'AI와 함께 전문 소설을 창작하세요. 캐릭터, 플롯, 세계관부터 출판까지.',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NovelForge AI - AI 소설 창작 스튜디오',
    description: 'AI와 함께 전문 소설을 창작하세요.',
    images: ['/opengraph-image'],
  },
  verification: {},
  alternates: {
    canonical: 'https://iswnoblecreate.vercel.app',
  },
  icons: {
    icon: '/icon',
    apple: '/apple-icon',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'NovelForge AI',
  description: 'AI 소설 창작 스튜디오 - 캐릭터 설계, 플롯 구조, 세계관 구축부터 출판까지',
  url: 'https://iswnoblecreate.vercel.app',
  applicationCategory: 'CreativeWork',
  operatingSystem: 'Web',
  inLanguage: 'ko',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'KRW',
  },
  creator: {
    '@type': 'Organization',
    name: 'NovelForge AI',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased min-h-screen">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
