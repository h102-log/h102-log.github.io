export const siteConfig = {
  name: 'h102-log',
  title: 'h102-log',
  description: '개발자 bh102의 기술 기록과 학습 내용을 정리하는 블로그입니다.',
  url: 'https://h102-log.github.io',
  author: 'bh102',
  locale: 'ko_KR',
  keywords: ['개발 블로그', 'Next.js', 'JavaScript', 'TypeScript', 'Java'],
  // GoatCounter 방문자 통계 사이트 코드. 가입 후 발급받은 실제 코드로 교체하세요.
  // 대시보드 설정 "Allow adding visitor counts on your website"를 켜야 조회수 표시가 동작합니다.
  goatcounter: 'https://h102-log.goatcounter.com',
};

export function createAbsoluteUrl(path: string) {
  return new URL(path, siteConfig.url).toString();
}