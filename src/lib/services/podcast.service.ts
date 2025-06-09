import { Podcast, PodcastStatus, Prisma } from '@/generated/prisma';
import prisma from '@/lib/prisma';
import { podcastAPI } from '@/lib/api/podcast-directory';

export interface CreatePodcastData {
  title: string;
  description: string;
  publisher: string;
  website?: string;
  language: string;
  explicit?: boolean;
  imageUrl: string;
  feedUrl: string;
  categories?: string[];
  author?: string;
  copyright?: string;
  externalId?: string;
  itunesId?: string;
  spotifyId?: string;
}

export interface UpdatePodcastData extends Partial<CreatePodcastData> {
  status?: PodcastStatus;
}

export interface PodcastSearchParams {
  query?: string;
  publisher?: string;
  language?: string;
  status?: PodcastStatus;
  categories?: string[];
  page?: number;
  limit?: number;
  orderBy?: {
    field: keyof Podcast;
    direction: 'asc' | 'desc';
  };
}

export class PodcastService {
  /**
   * Create a new podcast
   */
  async createPodcast(data: CreatePodcastData): Promise<Podcast> {
    // Check if podcast already exists with the same feed URL
    const existingPodcast = await prisma.podcast.findUnique({
      where: { feedUrl: data.feedUrl },
    });

    if (existingPodcast) {
      throw new Error('Podcast with this feed URL already exists');
    }

    return prisma.podcast.create({
      data: {
        ...data,
        status: PodcastStatus.ACTIVE,
      },
    });
  }

  /**
   * Get podcast by ID
   */
  async getPodcastById(id: string): Promise<Podcast | null> {
    return prisma.podcast.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            episodes: true,
            ratings: true,
            reviews: true,
            likes: true,
            followers: true,
          },
        },
      },
    });
  }

  /**
   * Search podcasts with filters and pagination
   */
  async searchPodcasts(params: PodcastSearchParams): Promise<{
    podcasts: Podcast[];
    total: number;
    hasMore: boolean;
  }> {
    const {
      query,
      publisher,
      language,
      status,
      categories,
      page = 1,
      limit = 10,
      orderBy,
    } = params;

    const where: Prisma.PodcastWhereInput = {
      AND: [
        // Full-text search if query provided
        query
          ? {
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { publisher: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {},
        // Additional filters
        publisher ? { publisher: { contains: publisher, mode: 'insensitive' } } : {},
        language ? { language } : {},
        status ? { status } : {},
        categories ? { categories: { hasSome: categories } } : {},
      ],
    };

    const [podcasts, total] = await Promise.all([
      prisma.podcast.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: orderBy
          ? { [orderBy.field]: orderBy.direction }
          : { lastEpisodeAt: 'desc' },
        include: {
          _count: {
            select: {
              episodes: true,
              ratings: true,
              reviews: true,
            },
          },
        },
      }),
      prisma.podcast.count({ where }),
    ]);

    return {
      podcasts,
      total,
      hasMore: page * limit < total,
    };
  }

  /**
   * Update podcast
   */
  async updatePodcast(id: string, data: UpdatePodcastData): Promise<Podcast> {
    // If feed URL is being updated, check for uniqueness
    if (data.feedUrl) {
      const existingPodcast = await prisma.podcast.findFirst({
        where: {
          feedUrl: data.feedUrl,
          NOT: { id },
        },
      });

      if (existingPodcast) {
        throw new Error('Podcast with this feed URL already exists');
      }
    }

    return prisma.podcast.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete podcast
   */
  async deletePodcast(id: string): Promise<void> {
    await prisma.podcast.delete({
      where: { id },
    });
  }

  /**
   * Import podcast from external directory
   */
  async importPodcast(externalId: string): Promise<Podcast> {
    // Fetch podcast data from external API
    const podcastData = await podcastAPI.getPodcastById(externalId);

    // Check if podcast already exists
    const existingPodcast = await prisma.podcast.findFirst({
      where: {
        OR: [
          { externalId },
          { feedUrl: podcastData.website || '' }, // Using website as feedUrl for this example
        ],
      },
    });

    if (existingPodcast) {
      throw new Error('Podcast already exists in the database');
    }

    // Create new podcast
    return this.createPodcast({
      title: podcastData.title,
      description: podcastData.description,
      publisher: podcastData.publisher,
      website: podcastData.website,
      language: podcastData.language,
      imageUrl: podcastData.image,
      feedUrl: podcastData.website || '', // Using website as feedUrl for this example
      categories: podcastData.categories,
      externalId,
    });
  }

  /**
   * Update podcast stats
   */
  async updatePodcastStats(id: string): Promise<Podcast> {
    const stats = await prisma.podcast.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            episodes: true,
            ratings: true,
            reviews: true,
          },
        },
        ratings: {
          select: {
            rating: true,
          },
        },
      },
    });

    if (!stats) {
      throw new Error('Podcast not found');
    }

    const averageRating =
      stats.ratings.length > 0
        ? stats.ratings.reduce((acc, curr) => acc + curr.rating, 0) /
          stats.ratings.length
        : null;

    return prisma.podcast.update({
      where: { id },
      data: {
        totalEpisodes: stats._count.episodes,
        totalRatings: stats._count.ratings,
        totalReviews: stats._count.reviews,
        averageRating,
      },
    });
  }
} 