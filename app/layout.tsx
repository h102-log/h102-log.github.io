import type { Metadata } from 'next';
// 우리가 앞서 작성한 글로벌 스타일을 불러옵니다.
import './globals.css';
import Link from 'next/link';
import { IBM_Plex_Sans_KR, JetBrains_Mono } from 'next/font/google';
import 'highlight.js/styles/atom-one-dark.css';

const headingFont = IBM_Plex_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-heading',
  display: 'swap',
});

const terminalFont = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-terminal',
  display: 'swap',
});

// [비즈니스 로직 의도]: 이 객체는 검색 엔진(구글, 네이버)에게 내 블로그가 어떤 곳인지 알려주는 역할을 합니다. (SEO 최적화)  
export const metadata: Metadata = {
  title: 'h102-log',
  description: '개발자 bh102의 기술 블로그입니다.', 
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // [주의사항/Edge Case 방어]: 접근성을 위해 웹 문서의 언어를 한국어(ko)로 명시합니다. 
    <html lang="ko">
      <body className={`${headingFont.variable} ${terminalFont.variable}`}>
        {/* [비즈니스 로직 의도]: 모든 페이지 최상단에 고정될 공통 헤더(네비게이션)입니다. */}
        <nav className="global-nav">
          <div className="nav-container">
            <Link href="/" className="nav-logo">
              h102-log
            </Link>
          </div>
        </nav>

        {/* [비즈니스 로직 의도]: 이 'children' 자리에 우리가 만든 page.tsx(메인화면, 상세화면 등)의 내용이 쏙 들어갑니다! */}
        <div className="page-wrapper">
          {children}
        </div>

        {/* [비즈니스 로직 의도]: 모든 페이지 최하단에 들어갈 카피라이트(푸터)입니다. */}
        <footer className="global-footer">
          <p>© 2026 bh102. All rights reserved. Powered by Next.js</p>
        </footer>
      </body>
    </html>
  );
}