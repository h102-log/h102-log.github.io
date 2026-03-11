export const siteConfig = {
  name: 'h102-log',
  title: 'h102-log',
  description: '개발자 bh102의 기술 기록과 학습 내용을 정리하는 블로그입니다.',
  url: 'https://h102-log.github.io',
  author: 'bh102',
  locale: 'ko_KR',
  keywords: ['개발 블로그', 'Next.js', 'JavaScript', 'TypeScript', 'Java'],
};

export function createAbsoluteUrl(path: string) {
  return new URL(path, siteConfig.url).toString();
}