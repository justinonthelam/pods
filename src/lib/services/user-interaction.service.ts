import { PrismaClient } from '@prisma/client';
import type { UserInteraction, Podcast, Episode } from '@/generated/prisma';
import prisma from '@/lib/prisma';

export type InteractionType = 'LIKE' | 'LISTEN' | 'LISTEN_LATER' | 'FOLLOW';

export interface CreateInteractionData {
  userId: string;
  type: InteractionType;
  podcastId?: string;
  episodeId?: string;
}

export interface InteractionSearchParams {
  userId?: string;
  type?: InteractionType;
  podcastId?: string;
  episodeId?: string;
  page?: number;
  limit?: number;
}

export class UserInteractionService {
  /**
   * Create a new user interaction
   */
  async createInteraction(data: CreateInteractionData): Promise<UserInteraction> {
    // Validate that either podcastId or episodeId is provided, but not both
    if ((!data.podcastId && !data.episodeId) || (data.podcastId && data.episodeId)) {
      throw new Error('Must provide either podcastId or episodeId, but not both');
    }

    // Check if interaction already exists
    const existingInteraction = await this.getInteraction(
      data.userId,
      data.type,
      data.podcastId,
      data.episodeId
    );

    if (existingInteraction) {
      throw new Error(`User already has a ${data.type} interaction for this content`);
    }

    // Create the interaction with the appropriate relationship
    const interactionData: any = {
      type: data.type,
      userId: data.userId,
    };

    if (data.podcastId) {
      switch (data.type) {
        case 'LIKE':
          interactionData.podcastLikeId = data.podcastId;
          break;
        case 'FOLLOW':
          interactionData.podcastFollowId = data.podcastId;
          break;
        default:
          throw new Error(`Invalid interaction type ${data.type} for podcast`);
      }
    } else if (data.episodeId) {
      switch (data.type) {
        case 'LIKE':
          interactionData.episodeLikeId = data.episodeId;
          break;
        case 'LISTEN':
          interactionData.episodeListenId = data.episodeId;
          break;
        case 'LISTEN_LATER':
          interactionData.episodeListenLaterId = data.episodeId;
          break;
        default:
          throw new Error(`Invalid interaction type ${data.type} for episode`);
      }
    }

    const interaction = await prisma.userInteraction.create({
      data: interactionData,
    });

    // Update content stats if needed
    if (data.type === 'LISTEN' && data.episodeId) {
      await this.updateListenCount(data.episodeId);
    }

    return interaction;
  }

  /**
   * Get a specific interaction
   */
  async getInteraction(
    userId: string,
    type: InteractionType,
    podcastId?: string,
    episodeId?: string
  ): Promise<UserInteraction | null> {
    const where: any = {
      userId,
      type,
    };

    if (podcastId) {
      switch (type) {
        case 'LIKE':
          where.podcastLikeId = podcastId;
          break;
        case 'FOLLOW':
          where.podcastFollowId = podcastId;
          break;
      }
    } else if (episodeId) {
      switch (type) {
        case 'LIKE':
          where.episodeLikeId = episodeId;
          break;
        case 'LISTEN':
          where.episodeListenId = episodeId;
          break;
        case 'LISTEN_LATER':
          where.episodeListenLaterId = episodeId;
          break;
      }
    }

    return prisma.userInteraction.findFirst({ where });
  }

  /**
   * Search interactions with filters and pagination
   */
  async searchInteractions(params: InteractionSearchParams): Promise<{
    interactions: UserInteraction[];
    total: number;
    hasMore: boolean;
  }> {
    const {
      userId,
      type,
      podcastId,
      episodeId,
      page = 1,
      limit = 10,
    } = params;

    const where: any = {
      ...(userId ? { userId } : {}),
      ...(type ? { type } : {}),
    };

    if (podcastId) {
      where.OR = [
        { podcastLikeId: podcastId },
        { podcastFollowId: podcastId },
      ];
    } else if (episodeId) {
      where.OR = [
        { episodeLikeId: episodeId },
        { episodeListenId: episodeId },
        { episodeListenLaterId: episodeId },
      ];
    }

    const [interactions, total] = await Promise.all([
      prisma.userInteraction.findMany({
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
          podcastLike: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
            },
          },
          podcastFollow: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
            },
          },
          episodeLike: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
              podcastId: true,
            },
          },
          episodeListen: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
              podcastId: true,
            },
          },
          episodeListenLater: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
              podcastId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.userInteraction.count({ where }),
    ]);

    return {
      interactions,
      total,
      hasMore: page * limit < total,
    };
  }

  /**
   * Delete an interaction
   */
  async deleteInteraction(
    userId: string,
    type: InteractionType,
    podcastId?: string,
    episodeId?: string
  ): Promise<void> {
    const interaction = await this.getInteraction(userId, type, podcastId, episodeId);

    if (!interaction) {
      throw new Error('Interaction not found');
    }

    await prisma.userInteraction.delete({
      where: { id: interaction.id },
    });

    // Update content stats if needed
    if (type === 'LISTEN' && episodeId) {
      await this.updateListenCount(episodeId);
    }
  }

  /**
   * Get user's liked podcasts
   */
  async getLikedPodcasts(userId: string, page = 1, limit = 10): Promise<{
    podcasts: Podcast[];
    total: number;
    hasMore: boolean;
  }> {
    const [interactions, total] = await Promise.all([
      prisma.userInteraction.findMany({
        where: {
          userId,
          type: 'LIKE',
          podcastLikeId: { not: null },
        },
        include: {
          podcastLike: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.userInteraction.count({
        where: {
          userId,
          type: 'LIKE',
          podcastLikeId: { not: null },
        },
      }),
    ]);

    return {
      podcasts: interactions.map((i: { podcastLike: Podcast }) => i.podcastLike),
      total,
      hasMore: page * limit < total,
    };
  }

  /**
   * Get user's followed podcasts
   */
  async getFollowedPodcasts(userId: string, page = 1, limit = 10): Promise<{
    podcasts: Podcast[];
    total: number;
    hasMore: boolean;
  }> {
    const [interactions, total] = await Promise.all([
      prisma.userInteraction.findMany({
        where: {
          userId,
          type: 'FOLLOW',
          podcastFollowId: { not: null },
        },
        include: {
          podcastFollow: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.userInteraction.count({
        where: {
          userId,
          type: 'FOLLOW',
          podcastFollowId: { not: null },
        },
      }),
    ]);

    return {
      podcasts: interactions.map((i: { podcastFollow: Podcast }) => i.podcastFollow),
      total,
      hasMore: page * limit < total,
    };
  }

  /**
   * Get user's liked episodes
   */
  async getLikedEpisodes(userId: string, page = 1, limit = 10): Promise<{
    episodes: Episode[];
    total: number;
    hasMore: boolean;
  }> {
    const [interactions, total] = await Promise.all([
      prisma.userInteraction.findMany({
        where: {
          userId,
          type: 'LIKE',
          episodeLikeId: { not: null },
        },
        include: {
          episodeLike: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.userInteraction.count({
        where: {
          userId,
          type: 'LIKE',
          episodeLikeId: { not: null },
        },
      }),
    ]);

    return {
      episodes: interactions.map((i: { episodeLike: Episode }) => i.episodeLike),
      total,
      hasMore: page * limit < total,
    };
  }

  /**
   * Get user's listened episodes
   */
  async getListenedEpisodes(userId: string, page = 1, limit = 10): Promise<{
    episodes: Episode[];
    total: number;
    hasMore: boolean;
  }> {
    const [interactions, total] = await Promise.all([
      prisma.userInteraction.findMany({
        where: {
          userId,
          type: 'LISTEN',
          episodeListenId: { not: null },
        },
        include: {
          episodeListen: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.userInteraction.count({
        where: {
          userId,
          type: 'LISTEN',
          episodeListenId: { not: null },
        },
      }),
    ]);

    return {
      episodes: interactions.map((i: { episodeListen: Episode }) => i.episodeListen),
      total,
      hasMore: page * limit < total,
    };
  }

  /**
   * Get user's listen later episodes
   */
  async getListenLaterEpisodes(userId: string, page = 1, limit = 10): Promise<{
    episodes: Episode[];
    total: number;
    hasMore: boolean;
  }> {
    const [interactions, total] = await Promise.all([
      prisma.userInteraction.findMany({
        where: {
          userId,
          type: 'LISTEN_LATER',
          episodeListenLaterId: { not: null },
        },
        include: {
          episodeListenLater: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.userInteraction.count({
        where: {
          userId,
          type: 'LISTEN_LATER',
          episodeListenLaterId: { not: null },
        },
      }),
    ]);

    return {
      episodes: interactions.map((i: { episodeListenLater: Episode }) => i.episodeListenLater),
      total,
      hasMore: page * limit < total,
    };
  }

  /**
   * Update episode listen count
   */
  private async updateListenCount(episodeId: string): Promise<void> {
    const count = await prisma.userInteraction.count({
      where: {
        type: 'LISTEN',
        episodeListenId: episodeId,
      },
    });

    await prisma.episode.update({
      where: { id: episodeId },
      data: { totalListens: count },
    });
  }
} 