import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://intervise.in',
      lastModified: new Date('2026-07-25'),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://intervise.in/pricing',
      lastModified: new Date('2026-07-25'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://intervise.in/privacy',
      lastModified: new Date('2026-07-25'),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: 'https://intervise.in/terms',
      lastModified: new Date('2026-07-25'),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]
}
