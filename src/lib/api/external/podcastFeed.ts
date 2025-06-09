import Parser from 'rss-parser';
import { z } from 'zod';

const parser = new Parser({
  customFields: {
    item: [
      'itunes:duration',
      'itunes:image',
      'itunes:explicit',
      'itunes:episodeType',
      'itunes:season',
      'itunes:episode',
    ],
  },
});

const PodcastFeedSchema = z.object({
  title: z.string(),
  description: z.string(),
  imageUrl: z.string().url(),
  language: z.string(),
  categories: z.array(z.string()),
  episodes: z.array(z.object({
    guid: z.string(),
    title: z.string(),
    description: z.string(),
    publishDate: z.date(),
    duration: z.number(),
    imageUrl: z.string().url().optional(),
    audioUrl: z.string().url(),
  })),
});

export type PodcastFeed = z.infer<typeof PodcastFeedSchema>;

export async function fetchPodcastFeed(feedUrl: string): Promise<PodcastFeed> {
  try {
    const feed = await parser.parseURL(feedUrl);

    // Transform feed data to match our schema
    const transformedData = {
      title: feed.title || '',
      description: feed.description || '',
      imageUrl: feed.image?.url || '',
      language: feed.language || 'en',
      categories: feed.categories || [],
      episodes: feed.items.map(item => ({
        guid: item.guid || item.id || '',
        title: item.title || '',
        description: item.content || item.description || '',
        publishDate: new Date(item.pubDate || Date.now()),
        duration: parseDuration(item['itunes:duration']),
        imageUrl: item['itunes:image']?.href || feed.image?.url,
        audioUrl: item.enclosure?.url || '',
      })),
    };

    // Validate and return the transformed data
    return PodcastFeedSchema.parse(transformedData);
  } catch (error) {
    console.error('Error fetching podcast feed:', error);
    throw new Error('Failed to fetch podcast feed');
  }
}

function parseDuration(duration: string | undefined): number {
  if (!duration) return 0;

  // Handle HH:MM:SS format
  if (duration.includes(':')) {
    const parts = duration.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  }

  // Handle seconds format
  return parseInt(duration, 10) || 0;
} 