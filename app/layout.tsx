import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EUREKA 유레카 | Figma Design Ops',
  description: '화면 중심의 기획 & 품질 관리 통합 솔루션',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
