import type { MetadataRoute } from 'next';
import { createAbsoluteUrl, siteConfig } from '@/src/lib/site';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: createAbsoluteUrl('/sitemap.xml'),
    host: siteConfig.url,
  };
}