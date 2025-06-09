import { EpisodeService } from '../episode.service';
import prisma from '@/lib/prisma';
import { podcastAPI } from '@/lib/api/podcast-directory';

// Mock external dependencies
jest.mock('@/lib/prisma', () => ({
  episode: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  userInteraction: {
    create: jest.fn(),
  },
  $transaction: jest.fn((operations) => Promise.all(operations)),
}));

jest.mock('@/lib/api/podcast-directory', () => ({
  podcastAPI: {
    getPodcastEpisodes: jest.fn(),
  },
}));

describe('EpisodeService', () => {
  let episodeService: EpisodeService;
  const mockPodcastId = 'mock-podcast-id';
  const mockEpisodeId = 'mock-episode-id';
  const mockUserId = 'mock-user-id';

  beforeEach(() => {
    episodeService = new EpisodeService();
    jest.clearAllMocks();
  });

  describe('createEpisode', () => {
    const mockEpisodeData = {
      title: 'Test Episode',
      description: 'Test Description',
      audioUrl: 'https://example.com/audio.mp3',
      duration: 1800,
      publishDate: new Date(),
      podcastId: mockPodcastId,
    };

    it('should create a new episode', async () => {
      (prisma.episode.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.episode.create as jest.Mock).mockResolvedValue({ id: mockEpisodeId, ...mockEpisodeData });

      const result = await episodeService.createEpisode(mockEpisodeData);

      expect(prisma.episode.create).toHaveBeenCalledWith({
        data: mockEpisodeData,
      });
      expect(result).toEqual({ id: mockEpisodeId, ...mockEpisodeData });
    });

    it('should throw error if episode already exists', async () => {
      (prisma.episode.findFirst as jest.Mock).mockResolvedValue({ id: 'existing-id' });

      await expect(
        episodeService.createEpisode({
          ...mockEpisodeData,
          guid: 'test-guid',
        })
      ).rejects.toThrow('Episode already exists for this podcast');
    });
  });

  describe('searchEpisodes', () => {
    const mockSearchParams = {
      query: 'test',
      podcastId: mockPodcastId,
      page: 1,
      limit: 10,
    };

    const mockEpisodes = [
      { id: '1', title: 'Episode 1' },
      { id: '2', title: 'Episode 2' },
    ];

    it('should search episodes with filters', async () => {
      (prisma.episode.findMany as jest.Mock).mockResolvedValue(mockEpisodes);
      (prisma.episode.count as jest.Mock).mockResolvedValue(2);

      const result = await episodeService.searchEpisodes(mockSearchParams);

      expect(result).toEqual({
        episodes: mockEpisodes,
        total: 2,
        hasMore: false,
      });
      expect(prisma.episode.findMany).toHaveBeenCalled();
      expect(prisma.episode.count).toHaveBeenCalled();
    });
  });

  describe('recordListen', () => {
    it('should record a listen and update stats', async () => {
      await episodeService.recordListen(mockEpisodeId, mockUserId);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.userInteraction.create).toHaveBeenCalledWith({
        data: {
          type: 'LISTEN',
          userId: mockUserId,
          episodeListenId: mockEpisodeId,
        },
      });
      expect(prisma.episode.update).toHaveBeenCalledWith({
        where: { id: mockEpisodeId },
        data: {
          totalListens: { increment: 1 },
        },
      });
    });
  });

  describe('updateEpisodeStats', () => {
    const mockStats = {
      _count: {
        ratings: 2,
        reviews: 1,
        listens: 5,
      },
      ratings: [
        { rating: 4 },
        { rating: 5 },
      ],
    };

    it('should update episode stats correctly', async () => {
      (prisma.episode.findUnique as jest.Mock).mockResolvedValue(mockStats);
      (prisma.episode.update as jest.Mock).mockImplementation((args) => args.data);

      const result = await episodeService.updateEpisodeStats(mockEpisodeId);

      expect(result).toEqual({
        totalRatings: 2,
        totalReviews: 1,
        totalListens: 5,
        averageRating: 4.5,
      });
    });

    it('should throw error if episode not found', async () => {
      (prisma.episode.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(episodeService.updateEpisodeStats(mockEpisodeId)).rejects.toThrow('Episode not found');
    });
  });

  describe('importPodcastEpisodes', () => {
    const mockExternalEpisodes = {
      episodes: [
        {
          id: 'ext-1',
          title: 'External Episode 1',
          description: 'Description 1',
          audioUrl: 'https://example.com/1.mp3',
          duration: 1800,
          publishDate: '2024-03-20T00:00:00.000Z',
        },
      ],
    };

    it('should import episodes from external source', async () => {
      (podcastAPI.getPodcastEpisodes as jest.Mock).mockResolvedValue(mockExternalEpisodes);
      (prisma.episode.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.episode.create as jest.Mock).mockImplementation((args) => ({
        id: 'new-id',
        ...args.data,
      }));

      const result = await episodeService.importPodcastEpisodes(mockPodcastId, 'external-id');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        title: 'External Episode 1',
        podcastId: mockPodcastId,
        externalId: 'ext-1',
      });
    });

    it('should handle failed imports gracefully', async () => {
      (podcastAPI.getPodcastEpisodes as jest.Mock).mockResolvedValue(mockExternalEpisodes);
      (prisma.episode.create as jest.Mock).mockRejectedValue(new Error('Creation failed'));

      const result = await episodeService.importPodcastEpisodes(mockPodcastId, 'external-id');

      expect(result).toHaveLength(0);
    });
  });
}); 