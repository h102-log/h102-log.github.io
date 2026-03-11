import type { MetadataRoute } from 'next';
import { getAllPostsData } from '@/src/lib/posts';
import { createAbsoluteUrl } from '@/src/lib/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPostsData();

  return [
    {
      url: createAbsoluteUrl('/'),
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...posts.map((post) => ({
      url: createAbsoluteUrl(`/posts/${post.id}`),
      lastModified: post.updatedAt ?? post.date,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}