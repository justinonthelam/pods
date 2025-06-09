import { PrismaClient, Prisma } from '@prisma/client';
import type { Episode } from '@prisma/client';
import prisma from '@/lib/prisma';
import { podcastAPI } from '@/lib/api/podcast-directory';

export interface CreateEpisodeData {
  title: string;
  description: string;
  audioUrl: string;
  imageUrl?: string;
  duration: number;
  publishDate: Date;
  transcript?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  mimeType?: string;
  fileSize?: number;
  explicit?: boolean;
  externalId?: string;
  guid?: string;
  podcastId: string;
}

export interface UpdateEpisodeData extends Partial<Omit<CreateEpisodeData, 'podcastId'>> {}

export interface EpisodeSearchParams {
  query?: string;
  podcastId?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  publishedAfter?: Date;
  publishedBefore?: Date;
  page?: number;
  limit?: number;
  orderBy?: {
    field: keyof Episode;
    direction: 'asc' | 'desc';
  };
}

export class EpisodeService {
  /**
   * Create a new episode
   */
  async createEpisode(data: CreateEpisodeData): Promise<Episode> {
    // Check if episode already exists with the same GUID or external ID
    if (data.guid || data.externalId) {
      const existingEpisode = await prisma.episode.findFirst({
        where: {
          OR: [
            { guid: data.guid },
            { externalId: data.externalId },
          ].filter(Boolean),
          podcastId: data.podcastId,
        },
      });

      if (existingEpisode) {
        throw new Error('Episode already exists for this podcast');
      }
    }

    return prisma.episode.create({
      data,
    });
  }

  /**
   * Get episode by ID
   */
  async getEpisodeById(id: string): Promise<Episode | null> {
    return prisma.episode.findUnique({
      where: { id },
      include: {
        podcast: true,
        _count: {
          select: {
            ratings: true,
            reviews: true,
            likes: true,
            listens: true,
          },
        },
      },
    });
  }

  /**
   * Search episodes with filters and pagination
   */
  async searchEpisodes(params: EpisodeSearchParams): Promise<{
    episodes: Episode[];
    total: number;
    hasMore: boolean;
  }> {
    const {
      query,
      podcastId,
      seasonNumber,
      episodeNumber,
      publishedAfter,
      publishedBefore,
      page = 1,
      limit = 10,
      orderBy,
    } = params;

    const where: Prisma.EpisodeWhereInput = {
      AND: [
        // Full-text search if query provided
        query
          ? {
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {},
        // Additional filters
        ...(podcastId ? [{ podcastId }] : []),
        ...(seasonNumber ? [{ seasonNumber }] : []),
        ...(episodeNumber ? [{ episodeNumber }] : []),
        ...(publishedAfter ? [{ publishDate: { gte: publishedAfter } }] : []),
        ...(publishedBefore ? [{ publishDate: { lte: publishedBefore } }] : []),
      ].filter(Boolean),
    };

    const [episodes, total] = await Promise.all([
      prisma.episode.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: orderBy
          ? { [orderBy.field]: orderBy.direction }
          : { publishDate: 'desc' },
        include: {
          podcast: {
            select: {
              title: true,
              publisher: true,
              imageUrl: true,
            },
          },
        },
      }),
      prisma.episode.count({ where }),
    ]);

    return {
      episodes,
      total,
      hasMore: page * limit < total,
    };
  }

  /**
   * Update episode
   */
  async updateEpisode(id: string, data: UpdateEpisodeData): Promise<Episode> {
    return prisma.episode.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete episode
   */
  async deleteEpisode(id: string): Promise<void> {
    await prisma.episode.delete({
      where: { id },
    });
  }

  /**
   * Import episodes for a podcast from external directory
   */
  async importPodcastEpisodes(podcastId: string, externalPodcastId: string): Promise<Episode[]> {
    const { episodes } = await podcastAPI.getPodcastEpisodes(externalPodcastId);
    
    const createdEpisodes = await Promise.all(
      episodes.map(async (episodeData: any) => {
        try {
          return await this.createEpisode({
            title: episodeData.title,
            description: episodeData.description,
            audioUrl: episodeData.audioUrl,
            imageUrl: episodeData.imageUrl,
            duration: episodeData.duration,
            publishDate: new Date(episodeData.publishDate),
            podcastId,
            externalId: episodeData.id,
          });
        } catch (error) {
          console.error(`Failed to import episode ${episodeData.id}:`, error);
          return null;
        }
      })
    );

    return createdEpisodes.filter((episode: Episode | null): episode is Episode => episode !== null);
  }

  /**
   * Record a listen for an episode
   */
  async recordListen(episodeId: string, userId: string): Promise<void> {
    await prisma.$transaction([
      // Create listen record
      prisma.userInteraction.create({
        data: {
          type: 'LISTEN',
          userId,
          episodeListenId: episodeId,
        },
      }),
      // Update listen count
      prisma.episode.update({
        where: { id: episodeId },
        data: {
          totalListens: { increment: 1 },
        },
      }),
    ]);
  }

  /**
   * Update episode stats
   */
  async updateEpisodeStats(id: string): Promise<Episode> {
    const stats = await prisma.episode.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            ratings: true,
            reviews: true,
            listens: true,
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
      throw new Error('Episode not found');
    }

    const averageRating =
      stats.ratings.length > 0
        ? stats.ratings.reduce((acc: number, curr: { rating: number }) => acc + curr.rating, 0) /
          stats.ratings.length
        : null;

    return prisma.episode.update({
      where: { id },
      data: {
        totalRatings: stats._count.ratings,
        totalReviews: stats._count.reviews,
        totalListens: stats._count.listens,
        averageRating,
      },
    });
  }
} 