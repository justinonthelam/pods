import { PrismaClient } from '@prisma/client';
import type { Review } from '@/generated/prisma';
import prisma from '@/lib/prisma';

export interface CreateReviewData {
  content: string;
  userId: string;
  podcastId?: string;
  episodeId?: string;
}

export interface UpdateReviewData {
  content: string;
}

export interface ReviewSearchParams {
  query?: string;
  podcastId?: string;
  episodeId?: string;
  userId?: string;
  page?: number;
  limit?: number;
  orderBy?: {
    field: keyof Review;
    direction: 'asc' | 'desc';
  };
}

export class ReviewService {
  /**
   * Create a new review
   */
  async createReview(data: CreateReviewData): Promise<Review> {
    // Validate content
    if (!data.content.trim()) {
      throw new Error('Review content cannot be empty');
    }

    // Ensure either podcastId or episodeId is provided, but not both
    if ((!data.podcastId && !data.episodeId) || (data.podcastId && data.episodeId)) {
      throw new Error('Must provide either podcastId or episodeId, but not both');
    }

    // Check if user already has a review for this podcast/episode
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: data.userId,
        OR: [
          { podcastId: data.podcastId },
          { episodeId: data.episodeId },
        ].filter(Boolean),
      },
    });

    if (existingReview) {
      throw new Error('User already has a review for this podcast/episode');
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        content: data.content,
        userId: data.userId,
        podcastId: data.podcastId,
        episodeId: data.episodeId,
      },
    });

    // Update review count
    if (data.podcastId) {
      await this.updatePodcastReviewCount(data.podcastId);
    } else if (data.episodeId) {
      await this.updateEpisodeReviewCount(data.episodeId);
    }

    return review;
  }

  /**
   * Get review by ID
   */
  async getReviewById(id: string): Promise<Review | null> {
    return prisma.review.findUnique({
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
   * Get user's review for a podcast or episode
   */
  async getUserReview(userId: string, podcastId?: string, episodeId?: string): Promise<Review | null> {
    if ((!podcastId && !episodeId) || (podcastId && episodeId)) {
      throw new Error('Must provide either podcastId or episodeId, but not both');
    }

    return prisma.review.findFirst({
      where: {
        userId,
        ...(podcastId ? { podcastId } : {}),
        ...(episodeId ? { episodeId } : {}),
      },
    });
  }

  /**
   * Search reviews with filters and pagination
   */
  async searchReviews(params: ReviewSearchParams): Promise<{
    reviews: Review[];
    total: number;
    hasMore: boolean;
  }> {
    const {
      query,
      podcastId,
      episodeId,
      userId,
      page = 1,
      limit = 10,
      orderBy,
    } = params;

    const where = {
      AND: [
        // Full-text search if query provided
        query
          ? {
              content: { contains: query, mode: 'insensitive' },
            }
          : {},
        // Additional filters
        podcastId ? { podcastId } : {},
        episodeId ? { episodeId } : {},
        userId ? { userId } : {},
      ],
    };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
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
        orderBy: orderBy
          ? { [orderBy.field]: orderBy.direction }
          : { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.review.count({ where }),
    ]);

    return {
      reviews,
      total,
      hasMore: page * limit < total,
    };
  }

  /**
   * Update a review
   */
  async updateReview(id: string, data: UpdateReviewData): Promise<Review> {
    // Validate content
    if (!data.content.trim()) {
      throw new Error('Review content cannot be empty');
    }

    return prisma.review.update({
      where: { id },
      data: { content: data.content },
    });
  }

  /**
   * Delete a review
   */
  async deleteReview(id: string): Promise<void> {
    // Get the review to determine what counts to update
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    // Delete the review
    await prisma.review.delete({
      where: { id },
    });

    // Update review count
    if (review.podcastId) {
      await this.updatePodcastReviewCount(review.podcastId);
    } else if (review.episodeId) {
      await this.updateEpisodeReviewCount(review.episodeId);
    }
  }

  /**
   * Update podcast review count
   */
  private async updatePodcastReviewCount(podcastId: string): Promise<void> {
    const count = await prisma.review.count({
      where: { podcastId },
    });

    await prisma.podcast.update({
      where: { id: podcastId },
      data: { totalReviews: count },
    });
  }

  /**
   * Update episode review count
   */
  private async updateEpisodeReviewCount(episodeId: string): Promise<void> {
    const count = await prisma.review.count({
      where: { episodeId },
    });

    await prisma.episode.update({
      where: { id: episodeId },
      data: { totalReviews: count },
    });
  }
} 