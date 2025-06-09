import { RatingService } from '../rating.service';
import prisma from '@/lib/prisma';

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    rating: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    podcast: {
      update: jest.fn(),
    },
    episode: {
      update: jest.fn(),
    },
  },
}));

describe('RatingService', () => {
  let service: RatingService;
  const mockPrisma = prisma as jest.Mocked<typeof prisma>;

  beforeEach(() => {
    service = new RatingService();
    jest.clearAllMocks();
  });

  describe('createRating', () => {
    const mockRatingData = {
      userId: 'user1',
      podcastId: 'podcast1',
      rating: 4,
    };

    it('should create a rating for a podcast', async () => {
      const mockRating = { ...mockRatingData, id: 'rating1' };
      mockPrisma.rating.create.mockResolvedValue(mockRating);
      mockPrisma.rating.aggregate.mockResolvedValue({
        _avg: { rating: 4 },
        _count: 1,
      });

      const result = await service.createRating(mockRatingData);

      expect(result).toEqual(mockRating);
      expect(mockPrisma.rating.create).toHaveBeenCalledWith({
        data: mockRatingData,
      });
      expect(mockPrisma.podcast.update).toHaveBeenCalledWith({
        where: { id: 'podcast1' },
        data: {
          averageRating: 4,
          totalRatings: 1,
        },
      });
    });

    it('should validate rating value', async () => {
      await expect(
        service.createRating({ ...mockRatingData, rating: 6 })
      ).rejects.toThrow('Rating must be between 1 and 5');
    });

    it('should validate podcast/episode exclusivity', async () => {
      await expect(
        service.createRating({
          ...mockRatingData,
          podcastId: 'podcast1',
          episodeId: 'episode1',
        })
      ).rejects.toThrow('Must provide either podcastId or episodeId, but not both');
    });
  });

  describe('getRatingById', () => {
    it('should return rating with related data', async () => {
      const mockRating = {
        id: 'rating1',
        rating: 4,
        userId: 'user1',
        podcastId: 'podcast1',
        user: {
          id: 'user1',
          username: 'testuser',
          name: 'Test User',
          profileImage: 'image.jpg',
        },
        podcast: {
          id: 'podcast1',
          title: 'Test Podcast',
          imageUrl: 'podcast.jpg',
        },
      };

      mockPrisma.rating.findUnique.mockResolvedValue(mockRating);

      const result = await service.getRatingById('rating1');

      expect(result).toEqual(mockRating);
      expect(mockPrisma.rating.findUnique).toHaveBeenCalledWith({
        where: { id: 'rating1' },
        include: expect.any(Object),
      });
    });
  });

  describe('getUserRating', () => {
    it('should return user rating for podcast', async () => {
      const mockRating = {
        id: 'rating1',
        rating: 4,
        userId: 'user1',
        podcastId: 'podcast1',
      };

      mockPrisma.rating.findFirst.mockResolvedValue(mockRating);

      const result = await service.getUserRating('user1', 'podcast1');

      expect(result).toEqual(mockRating);
      expect(mockPrisma.rating.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user1',
          podcastId: 'podcast1',
        },
      });
    });
  });

  describe('updateRating', () => {
    it('should update rating and recalculate stats', async () => {
      const mockRating = {
        id: 'rating1',
        rating: 4,
        userId: 'user1',
        podcastId: 'podcast1',
      };

      mockPrisma.rating.findUnique.mockResolvedValue(mockRating);
      mockPrisma.rating.update.mockResolvedValue({ ...mockRating, rating: 5 });
      mockPrisma.rating.aggregate.mockResolvedValue({
        _avg: { rating: 5 },
        _count: 1,
      });

      const result = await service.updateRating('rating1', { rating: 5 });

      expect(result.rating).toBe(5);
      expect(mockPrisma.podcast.update).toHaveBeenCalledWith({
        where: { id: 'podcast1' },
        data: {
          averageRating: 5,
          totalRatings: 1,
        },
      });
    });
  });

  describe('deleteRating', () => {
    it('should delete rating and update stats', async () => {
      const mockRating = {
        id: 'rating1',
        rating: 4,
        userId: 'user1',
        podcastId: 'podcast1',
      };

      mockPrisma.rating.findUnique.mockResolvedValue(mockRating);
      mockPrisma.rating.aggregate.mockResolvedValue({
        _avg: { rating: null },
        _count: 0,
      });

      await service.deleteRating('rating1');

      expect(mockPrisma.rating.delete).toHaveBeenCalledWith({
        where: { id: 'rating1' },
      });
      expect(mockPrisma.podcast.update).toHaveBeenCalledWith({
        where: { id: 'podcast1' },
        data: {
          averageRating: null,
          totalRatings: 0,
        },
      });
    });
  });

  describe('getPodcastRatings', () => {
    it('should return paginated podcast ratings', async () => {
      const mockRatings = [
        {
          id: 'rating1',
          rating: 4,
          userId: 'user1',
          podcastId: 'podcast1',
          user: {
            id: 'user1',
            username: 'testuser',
            name: 'Test User',
            profileImage: 'image.jpg',
          },
        },
      ];

      mockPrisma.rating.findMany.mockResolvedValue(mockRatings);
      mockPrisma.rating.count.mockResolvedValue(1);

      const result = await service.getPodcastRatings('podcast1');

      expect(result).toEqual({
        ratings: mockRatings,
        total: 1,
        hasMore: false,
      });
      expect(mockPrisma.rating.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { podcastId: 'podcast1' },
          take: 10,
          skip: 0,
        })
      );
    });
  });
}); 