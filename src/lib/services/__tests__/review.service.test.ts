import { ReviewService } from '../review.service';
import prisma from '@/lib/prisma';

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    review: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    podcast: {
      update: jest.fn(),
    },
    episode: {
      update: jest.fn(),
    },
  },
}));

describe('ReviewService', () => {
  let service: ReviewService;
  const mockPrisma = prisma as jest.Mocked<typeof prisma>;

  beforeEach(() => {
    service = new ReviewService();
    jest.clearAllMocks();
  });

  describe('createReview', () => {
    const mockReviewData = {
      content: 'Great podcast!',
      userId: 'user1',
      podcastId: 'podcast1',
    };

    it('should create a review for a podcast', async () => {
      const mockReview = { ...mockReviewData, id: 'review1' };
      mockPrisma.review.findFirst.mockResolvedValue(null);
      mockPrisma.review.create.mockResolvedValue(mockReview);
      mockPrisma.review.count.mockResolvedValue(1);

      const result = await service.createReview(mockReviewData);

      expect(result).toEqual(mockReview);
      expect(mockPrisma.review.create).toHaveBeenCalledWith({
        data: mockReviewData,
      });
      expect(mockPrisma.podcast.update).toHaveBeenCalledWith({
        where: { id: 'podcast1' },
        data: { totalReviews: 1 },
      });
    });

    it('should validate content is not empty', async () => {
      await expect(
        service.createReview({ ...mockReviewData, content: '   ' })
      ).rejects.toThrow('Review content cannot be empty');
    });

    it('should validate podcast/episode exclusivity', async () => {
      await expect(
        service.createReview({
          ...mockReviewData,
          podcastId: 'podcast1',
          episodeId: 'episode1',
        })
      ).rejects.toThrow('Must provide either podcastId or episodeId, but not both');
    });

    it('should prevent duplicate reviews', async () => {
      mockPrisma.review.findFirst.mockResolvedValue({ id: 'existing1' });

      await expect(service.createReview(mockReviewData)).rejects.toThrow(
        'User already has a review for this podcast/episode'
      );
    });
  });

  describe('getReviewById', () => {
    it('should return review with related data', async () => {
      const mockReview = {
        id: 'review1',
        content: 'Great podcast!',
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

      mockPrisma.review.findUnique.mockResolvedValue(mockReview);

      const result = await service.getReviewById('review1');

      expect(result).toEqual(mockReview);
      expect(mockPrisma.review.findUnique).toHaveBeenCalledWith({
        where: { id: 'review1' },
        include: expect.any(Object),
      });
    });
  });

  describe('getUserReview', () => {
    it('should return user review for podcast', async () => {
      const mockReview = {
        id: 'review1',
        content: 'Great podcast!',
        userId: 'user1',
        podcastId: 'podcast1',
      };

      mockPrisma.review.findFirst.mockResolvedValue(mockReview);

      const result = await service.getUserReview('user1', 'podcast1');

      expect(result).toEqual(mockReview);
      expect(mockPrisma.review.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user1',
          podcastId: 'podcast1',
        },
      });
    });
  });

  describe('searchReviews', () => {
    it('should search reviews with filters', async () => {
      const mockReviews = [
        {
          id: 'review1',
          content: 'Great podcast!',
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

      mockPrisma.review.findMany.mockResolvedValue(mockReviews);
      mockPrisma.review.count.mockResolvedValue(1);

      const result = await service.searchReviews({
        query: 'great',
        podcastId: 'podcast1',
      });

      expect(result).toEqual({
        reviews: mockReviews,
        total: 1,
        hasMore: false,
      });
      expect(mockPrisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.any(Object),
          take: 10,
          skip: 0,
        })
      );
    });
  });

  describe('updateReview', () => {
    it('should update review content', async () => {
      const mockReview = {
        id: 'review1',
        content: 'Updated content',
        userId: 'user1',
        podcastId: 'podcast1',
      };

      mockPrisma.review.update.mockResolvedValue(mockReview);

      const result = await service.updateReview('review1', {
        content: 'Updated content',
      });

      expect(result).toEqual(mockReview);
      expect(mockPrisma.review.update).toHaveBeenCalledWith({
        where: { id: 'review1' },
        data: { content: 'Updated content' },
      });
    });

    it('should validate content is not empty', async () => {
      await expect(
        service.updateReview('review1', { content: '   ' })
      ).rejects.toThrow('Review content cannot be empty');
    });
  });

  describe('deleteReview', () => {
    it('should delete review and update counts', async () => {
      const mockReview = {
        id: 'review1',
        content: 'Great podcast!',
        userId: 'user1',
        podcastId: 'podcast1',
      };

      mockPrisma.review.findUnique.mockResolvedValue(mockReview);
      mockPrisma.review.count.mockResolvedValue(0);

      await service.deleteReview('review1');

      expect(mockPrisma.review.delete).toHaveBeenCalledWith({
        where: { id: 'review1' },
      });
      expect(mockPrisma.podcast.update).toHaveBeenCalledWith({
        where: { id: 'podcast1' },
        data: { totalReviews: 0 },
      });
    });
  });
}); 