import { PrismaClient } from '@prisma/client';
import type { Rating } from '@/generated/prisma';
import prisma from '@/lib/prisma';

export interface CreateRatingData {
  rating: number;
  userId: string;
  podcastId?: string;
  episodeId?: string;
}

export interface UpdateRatingData {
  rating: number;
}

export class RatingService {
  /**
   * Create a new rating
   */
  async createRating(data: CreateRatingData): Promise<Rating> {
    // Validate rating value (1-5)
    if (data.rating < 1 || data.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Ensure either podcastId or episodeId is provided, but not both
    if ((!data.podcastId && !data.episodeId) || (data.podcastId && data.episodeId)) {
      throw new Error('Must provide either podcastId or episodeId, but not both');
    }

    // Create the rating
    const rating = await prisma.rating.create({
      data: {
        rating: data.rating,
        userId: data.userId,
        podcastId: data.podcastId,
        episodeId: data.episodeId,
      },
    });

    // Update the average rating and total ratings count
    if (data.podcastId) {
      await this.updatePodcastRatingStats(data.podcastId);
    } else if (data.episodeId) {
      await this.updateEpisodeRatingStats(data.episodeId);
    }

    return rating;
  }

  /**
   * Get rating by ID
   */
  async getRatingById(id: string): Promise<Rating | null> {
    return prisma.rating.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            profileImage: true,
          },
        },
        podcast: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
          },
        },
        episode: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            podcastId: true,
          },
        },
      },
    });
  }

  /**
   * Get user's rating for a podcast or episode
   */
  async getUserRating(userId: string, podcastId?: string, episodeId?: string): Promise<Rating | null> {
    if ((!podcastId && !episodeId) || (podcastId && episodeId)) {
      throw new Error('Must provide either podcastId or episodeId, but not both');
    }

    return prisma.rating.findFirst({
      where: {
        userId,
        ...(podcastId ? { podcastId } : {}),
        ...(episodeId ? { episodeId } : {}),
      },
    });
  }

  /**
   * Update a rating
   */
  async updateRating(id: string, data: UpdateRatingData): Promise<Rating> {
    // Validate rating value
    if (data.rating < 1 || data.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Get the existing rating to determine what stats to update
    const existingRating = await prisma.rating.findUnique({
      where: { id },
    });

    if (!existingRating) {
      throw new Error('Rating not found');
    }

    // Update the rating
    const rating = await prisma.rating.update({
      where: { id },
      data: { rating: data.rating },
    });

    // Update the average rating
    if (existingRating.podcastId) {
      await this.updatePodcastRatingStats(existingRating.podcastId);
    } else if (existingRating.episodeId) {
      await this.updateEpisodeRatingStats(existingRating.episodeId);
    }

    return rating;
  }

  /**
   * Delete a rating
   */
  async deleteRating(id: string): Promise<void> {
    // Get the rating to determine what stats to update
    const rating = await prisma.rating.findUnique({
      where: { id },
    });

    if (!rating) {
      throw new Error('Rating not found');
    }

    // Delete the rating
    await prisma.rating.delete({
      where: { id },
    });

    // Update the average rating
    if (rating.podcastId) {
      await this.updatePodcastRatingStats(rating.podcastId);
    } else if (rating.episodeId) {
      await this.updateEpisodeRatingStats(rating.episodeId);
    }
  }

  /**
   * Get ratings for a podcast
   */
  async getPodcastRatings(podcastId: string, page = 1, limit = 10): Promise<{
    ratings: Rating[];
    total: number;
    hasMore: boolean;
  }> {
    const [ratings, total] = await Promise.all([
      prisma.rating.findMany({
        where: { podcastId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              profileImage: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.rating.count({ where: { podcastId } }),
    ]);

    return {
      ratings,
      total,
      hasMore: page * limit < total,
    };
  }

  /**
   * Get ratings for an episode
   */
  async getEpisodeRatings(episodeId: string, page = 1, limit = 10): Promise<{
    ratings: Rating[];
    total: number;
    hasMore: boolean;
  }> {
    const [ratings, total] = await Promise.all([
      prisma.rating.findMany({
        where: { episodeId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              profileImage: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.rating.count({ where: { episodeId } }),
    ]);

    return {
      ratings,
      total,
      hasMore: page * limit < total,
    };
  }

  /**
   * Update podcast rating statistics
   */
  private async updatePodcastRatingStats(podcastId: string): Promise<void> {
    const stats = await prisma.rating.aggregate({
      where: { podcastId },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.podcast.update({
      where: { id: podcastId },
      data: {
        averageRating: stats._avg.rating || null,
        totalRatings: stats._count,
      },
    });
  }

  /**
   * Update episode rating statistics
   */
  private async updateEpisodeRatingStats(episodeId: string): Promise<void> {
    const stats = await prisma.rating.aggregate({
      where: { episodeId },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.episode.update({
      where: { id: episodeId },
      data: {
        averageRating: stats._avg.rating || null,
        totalRatings: stats._count,
      },
    });
  }
} 