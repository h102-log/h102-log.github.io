/** @type {import('next').NextConfig} */
const nextConfig = {
  // [비즈니스 로직 의도]: GitHub Pages는 Node.js 서버를 구동할 수 없는 '정적 호스팅' 서비스입니다.
  // 따라서 Next.js 앱을 서버가 필요 없는 순수 HTML, CSS, JS 파일들로 렌더링(빌드)하도록 설정해야 합니다.
  // 이 옵션을 켜면 빌드 시 'out' 폴더가 생성되며, 이 폴더의 내용이 배포됩니다.
  // [주의사항/Edge Case]: 이 옵션을 켜면 Next.js의 Image Optimization(기본 서버 로더)이나 
  // API Routes 같은 동적 서버 기능을 사용할 수 없으므로, 추후 개발 시 유의해야 합니다.
  output: 'export',

  images: {
    // [비즈니스 로직 의도]: 위에서 언급한 대로 정적 내보내기(export) 환경에서는 
    // 기본 이미지 최적화 API가 작동하지 않아 빌드 에러가 발생합니다. 이를 방지하기 위한 방어적 설정입니다.
    unoptimized: true,
  },
};

export default nextConfig;