import { UserInteractionService } from '../user-interaction.service';
import prisma from '@/lib/prisma';

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    userInteraction: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    episode: {
      update: jest.fn(),
    },
  },
}));

describe('UserInteractionService', () => {
  let service: UserInteractionService;
  const mockPrisma = prisma as jest.Mocked<typeof prisma>;

  beforeEach(() => {
    service = new UserInteractionService();
    jest.clearAllMocks();
  });

  describe('createInteraction', () => {
    const mockPodcastInteraction = {
      userId: 'user1',
      type: 'LIKE' as const,
      podcastId: 'podcast1',
    };

    const mockEpisodeInteraction = {
      userId: 'user1',
      type: 'LISTEN' as const,
      episodeId: 'episode1',
    };

    it('should create a podcast like interaction', async () => {
      const mockInteraction = {
        id: 'interaction1',
        ...mockPodcastInteraction,
        podcastLikeId: 'podcast1',
      };

      mockPrisma.userInteraction.findFirst.mockResolvedValue(null);
      mockPrisma.userInteraction.create.mockResolvedValue(mockInteraction);

      const result = await service.createInteraction(mockPodcastInteraction);

      expect(result).toEqual(mockInteraction);
      expect(mockPrisma.userInteraction.create).toHaveBeenCalledWith({
        data: {
          type: 'LIKE',
          userId: 'user1',
          podcastLikeId: 'podcast1',
        },
      });
    });

    it('should create an episode listen interaction and update listen count', async () => {
      const mockInteraction = {
        id: 'interaction1',
        ...mockEpisodeInteraction,
        episodeListenId: 'episode1',
      };

      mockPrisma.userInteraction.findFirst.mockResolvedValue(null);
      mockPrisma.userInteraction.create.mockResolvedValue(mockInteraction);
      mockPrisma.userInteraction.count.mockResolvedValue(1);

      const result = await service.createInteraction(mockEpisodeInteraction);

      expect(result).toEqual(mockInteraction);
      expect(mockPrisma.userInteraction.create).toHaveBeenCalledWith({
        data: {
          type: 'LISTEN',
          userId: 'user1',
          episodeListenId: 'episode1',
        },
      });
      expect(mockPrisma.episode.update).toHaveBeenCalledWith({
        where: { id: 'episode1' },
        data: { totalListens: 1 },
      });
    });

    it('should prevent duplicate interactions', async () => {
      mockPrisma.userInteraction.findFirst.mockResolvedValue({
        id: 'existing1',
      });

      await expect(
        service.createInteraction(mockPodcastInteraction)
      ).rejects.toThrow('User already has a LIKE interaction for this content');
    });

    it('should validate podcast/episode exclusivity', async () => {
      await expect(
        service.createInteraction({
          ...mockPodcastInteraction,
          episodeId: 'episode1',
        })
      ).rejects.toThrow('Must provide either podcastId or episodeId, but not both');
    });
  });

  describe('getInteraction', () => {
    it('should get a podcast interaction', async () => {
      const mockInteraction = {
        id: 'interaction1',
        type: 'LIKE',
        userId: 'user1',
        podcastLikeId: 'podcast1',
      };

      mockPrisma.userInteraction.findFirst.mockResolvedValue(mockInteraction);

      const result = await service.getInteraction(
        'user1',
        'LIKE',
        'podcast1'
      );

      expect(result).toEqual(mockInteraction);
      expect(mockPrisma.userInteraction.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user1',
          type: 'LIKE',
          podcastLikeId: 'podcast1',
        },
      });
    });
  });

  describe('searchInteractions', () => {
    it('should search interactions with filters', async () => {
      const mockInteractions = [
        {
          id: 'interaction1',
          type: 'LIKE',
          userId: 'user1',
          podcastLikeId: 'podcast1',
          user: {
            id: 'user1',
            username: 'testuser',
            name: 'Test User',
            profileImage: 'image.jpg',
          },
          podcastLike: {
            id: 'podcast1',
            title: 'Test Podcast',
            imageUrl: 'podcast.jpg',
          },
        },
      ];

      mockPrisma.userInteraction.findMany.mockResolvedValue(mockInteractions);
      mockPrisma.userInteraction.count.mockResolvedValue(1);

      const result = await service.searchInteractions({
        userId: 'user1',
        type: 'LIKE',
        podcastId: 'podcast1',
      });

      expect(result).toEqual({
        interactions: mockInteractions,
        total: 1,
        hasMore: false,
      });
      expect(mockPrisma.userInteraction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.any(Object),
          include: expect.any(Object),
          take: 10,
          skip: 0,
        })
      );
    });
  });

  describe('deleteInteraction', () => {
    it('should delete an interaction and update stats', async () => {
      const mockInteraction = {
        id: 'interaction1',
        type: 'LISTEN',
        userId: 'user1',
        episodeListenId: 'episode1',
      };

      mockPrisma.userInteraction.findFirst.mockResolvedValue(mockInteraction);
      mockPrisma.userInteraction.count.mockResolvedValue(0);

      await service.deleteInteraction(
        'user1',
        'LISTEN',
        undefined,
        'episode1'
      );

      expect(mockPrisma.userInteraction.delete).toHaveBeenCalledWith({
        where: { id: 'interaction1' },
      });
      expect(mockPrisma.episode.update).toHaveBeenCalledWith({
        where: { id: 'episode1' },
        data: { totalListens: 0 },
      });
    });
  });

  describe('getLikedPodcasts', () => {
    it('should return paginated liked podcasts', async () => {
      const mockInteractions = [
        {
          id: 'interaction1',
          podcastLike: {
            id: 'podcast1',
            title: 'Test Podcast',
            imageUrl: 'podcast.jpg',
          },
        },
      ];

      mockPrisma.userInteraction.findMany.mockResolvedValue(mockInteractions);
      mockPrisma.userInteraction.count.mockResolvedValue(1);

      const result = await service.getLikedPodcasts('user1');

      expect(result).toEqual({
        podcasts: [mockInteractions[0].podcastLike],
        total: 1,
        hasMore: false,
      });
      expect(mockPrisma.userInteraction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user1',
            type: 'LIKE',
            podcastLikeId: { not: null },
          },
        })
      );
    });
  });

  describe('getListenedEpisodes', () => {
    it('should return paginated listened episodes', async () => {
      const mockInteractions = [
        {
          id: 'interaction1',
          episodeListen: {
            id: 'episode1',
            title: 'Test Episode',
            imageUrl: 'episode.jpg',
            podcastId: 'podcast1',
          },
        },
      ];

      mockPrisma.userInteraction.findMany.mockResolvedValue(mockInteractions);
      mockPrisma.userInteraction.count.mockResolvedValue(1);

      const result = await service.getListenedEpisodes('user1');

      expect(result).toEqual({
        episodes: [mockInteractions[0].episodeListen],
        total: 1,
        hasMore: false,
      });
      expect(mockPrisma.userInteraction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user1',
            type: 'LISTEN',
            episodeListenId: { not: null },
          },
        })
      );
    });
  });
}); 