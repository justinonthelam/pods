import { PodcastService } from '../podcast.service';
import prisma from '@/lib/prisma';
import { PodcastStatus } from '@/generated/prisma';
import { podcastAPI } from '@/lib/api/podcast-directory';

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  podcast: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
}));

// Mock podcast API
jest.mock('@/lib/api/podcast-directory', () => ({
  podcastAPI: {
    getPodcastById: jest.fn(),
  },
}));

describe('PodcastService', () => {
  let podcastService: PodcastService;
  const mockPrisma = prisma as jest.Mocked<typeof prisma>;

  beforeEach(() => {
    podcastService = new PodcastService();
    jest.clearAllMocks();
  });

  describe('createPodcast', () => {
    const mockPodcastData = {
      title: 'Test Podcast',
      description: 'A test podcast',
      publisher: 'Test Publisher',
      language: 'en',
      imageUrl: 'https://example.com/image.jpg',
      feedUrl: 'https://example.com/feed.xml',
    };

    it('should create a new podcast successfully', async () => {
      mockPrisma.podcast.findUnique.mockResolvedValue(null);
      mockPrisma.podcast.create.mockResolvedValue({
        id: '1',
        ...mockPodcastData,
        status: PodcastStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await podcastService.createPodcast(mockPodcastData);

      expect(result.title).toBe(mockPodcastData.title);
      expect(result.status).toBe(PodcastStatus.ACTIVE);
      expect(mockPrisma.podcast.create).toHaveBeenCalled();
    });

    it('should throw error if feed URL already exists', async () => {
      mockPrisma.podcast.findUnique.mockResolvedValue({
        id: '1',
        feedUrl: mockPodcastData.feedUrl,
      } as any);

      await expect(podcastService.createPodcast(mockPodcastData)).rejects.toThrow(
        'Podcast with this feed URL already exists'
      );
    });
  });

  describe('searchPodcasts', () => {
    it('should search podcasts with filters', async () => {
      const mockPodcasts = [
        {
          id: '1',
          title: 'Test Podcast 1',
          _count: { episodes: 10, ratings: 5, reviews: 3 },
        },
        {
          id: '2',
          title: 'Test Podcast 2',
          _count: { episodes: 15, ratings: 8, reviews: 4 },
        },
      ];

      mockPrisma.podcast.findMany.mockResolvedValue(mockPodcasts as any);
      mockPrisma.podcast.count.mockResolvedValue(2);

      const result = await podcastService.searchPodcasts({
        query: 'test',
        page: 1,
        limit: 10,
      });

      expect(result.podcasts).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('importPodcast', () => {
    const mockExternalPodcast = {
      id: 'ext1',
      title: 'External Podcast',
      description: 'An external podcast',
      publisher: 'External Publisher',
      language: 'en',
      image: 'https://example.com/image.jpg',
      website: 'https://example.com/podcast',
      categories: ['Technology'],
    };

    it('should import podcast from external API', async () => {
      (podcastAPI.getPodcastById as jest.Mock).mockResolvedValue(
        mockExternalPodcast
      );
      mockPrisma.podcast.findFirst.mockResolvedValue(null);
      mockPrisma.podcast.create.mockResolvedValue({
        id: '1',
        ...mockExternalPodcast,
        status: PodcastStatus.ACTIVE,
      } as any);

      const result = await podcastService.importPodcast('ext1');

      expect(result.title).toBe(mockExternalPodcast.title);
      expect(result.externalId).toBe('ext1');
    });

    it('should throw error if podcast already exists', async () => {
      (podcastAPI.getPodcastById as jest.Mock).mockResolvedValue(
        mockExternalPodcast
      );
      mockPrisma.podcast.findFirst.mockResolvedValue({
        id: '1',
        externalId: 'ext1',
      } as any);

      await expect(podcastService.importPodcast('ext1')).rejects.toThrow(
        'Podcast already exists in the database'
      );
    });
  });
}); 