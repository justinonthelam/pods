import { PrismaClient, Prisma } from '@prisma/client';
import MiniSearch from 'minisearch';

const prisma = new PrismaClient();

interface PodcastDocument {
  id: string;
  title: string;
  description: string;
  publisher: string;
  categories: string[];
  language: string;
}

interface EpisodeDocument {
  id: string;
  podcastId: string;
  title: string;
  description: string;
  publishDate: string;
}

class SearchIndex {
  private podcastIndex: MiniSearch<PodcastDocument>;
  private episodeIndex: MiniSearch<EpisodeDocument>;

  constructor() {
    this.podcastIndex = new MiniSearch<PodcastDocument>({
      fields: ['title', 'description', 'publisher', 'categories', 'language'],
      storeFields: ['id', 'title', 'publisher'],
      searchOptions: {
        boost: { title: 2, publisher: 1.5 },
        fuzzy: 0.2,
      },
    });

    this.episodeIndex = new MiniSearch<EpisodeDocument>({
      fields: ['title', 'description'],
      storeFields: ['id', 'podcastId', 'title', 'publishDate'],
      searchOptions: {
        boost: { title: 2 },
        fuzzy: 0.2,
      },
    });
  }

  async buildIndex() {
    try {
      // Index podcasts
      const podcasts = await prisma.podcast.findMany({
        select: {
          id: true,
          title: true,
          description: true,
          publisher: true,
          categories: true,
          language: true,
        },
      });

      this.podcastIndex.removeAll();
      this.podcastIndex.addAll(podcasts as PodcastDocument[]);

      // Index episodes
      const episodes = await prisma.episode.findMany({
        select: {
          id: true,
          podcastId: true,
          title: true,
          description: true,
          publishDate: true,
        },
      });

      this.episodeIndex.removeAll();
      this.episodeIndex.addAll(
        episodes.map((episode: { publishDate: Date }) => ({
          ...episode,
          publishDate: episode.publishDate.toISOString(),
        })) as EpisodeDocument[]
      );

      return {
        podcastCount: podcasts.length,
        episodeCount: episodes.length,
      };
    } catch (error) {
      console.error('Error building search index:', error);
      throw new Error('Failed to build search index');
    }
  }

  async updatePodcast(podcast: PodcastDocument) {
    this.podcastIndex.remove(podcast);
    this.podcastIndex.add(podcast);
  }

  async updateEpisode(episode: EpisodeDocument) {
    this.episodeIndex.remove(episode);
    this.episodeIndex.add(episode);
  }

  search(query: string, options?: {
    type?: 'podcast' | 'episode' | 'all';
    limit?: number;
    offset?: number;
  }) {
    const {
      type = 'all',
      limit = 10,
      offset = 0,
    } = options || {};

    const results = {
      podcasts: [] as Array<{ id: string; title: string; publisher: string; score: number }>,
      episodes: [] as Array<{ id: string; podcastId: string; title: string; publishDate: string; score: number }>,
    };

    if (type === 'all' || type === 'podcast') {
      results.podcasts = this.podcastIndex
        .search(query)
        .slice(offset, offset + limit)
        .map(result => ({
          id: result.id as string,
          title: result.title as string,
          publisher: result.publisher as string,
          score: result.score,
        }));
    }

    if (type === 'all' || type === 'episode') {
      results.episodes = this.episodeIndex
        .search(query)
        .slice(offset, offset + limit)
        .map(result => ({
          id: result.id as string,
          podcastId: result.podcastId as string,
          title: result.title as string,
          publishDate: result.publishDate as string,
          score: result.score,
        }));
    }

    return results;
  }
}

// Create a singleton instance
export const searchIndex = new SearchIndex(); 