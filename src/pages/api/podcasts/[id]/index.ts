import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  const podcastId = req.query.id as string;

  try {
    const podcast = await prisma.podcast.findUnique({
      where: { id: podcastId },
      include: {
        _count: {
          select: {
            ratings: true,
            reviews: true,
          },
        },
        ratings: {
          select: {
            value: true,
          },
        },
        episodes: {
          orderBy: {
            publishDate: 'desc',
          },
          include: {
            userInteractions: session ? {
              where: {
                userId: session.user.id,
              },
            } : false,
          },
        },
        userInteractions: session ? {
          where: {
            userId: session.user.id,
          },
        } : false,
      },
    });

    if (!podcast) {
      return res.status(404).json({ message: 'Podcast not found' });
    }

    // Calculate average rating
    const averageRating = podcast.ratings.length > 0
      ? podcast.ratings.reduce((acc: number, rating: { value: number }) => acc + rating.value, 0) / podcast.ratings.length
      : 0;

    // Transform episodes data
    const episodes = podcast.episodes.map((episode: any) => ({
      id: episode.id,
      title: episode.title,
      description: episode.description,
      duration: episode.duration,
      publishDate: episode.publishDate.toISOString(),
      imageUrl: episode.imageUrl,
      status: episode.userInteractions?.[0]?.status || 'not_started',
    }));

    // Transform podcast data
    const transformedPodcast = {
      id: podcast.id,
      title: podcast.title,
      description: podcast.description,
      imageUrl: podcast.imageUrl,
      publisher: podcast.publisher,
      website: podcast.website,
      language: podcast.language,
      categories: podcast.categories,
      averageRating,
      totalRatings: podcast._count.ratings,
      totalReviews: podcast._count.reviews,
      isFollowing: !!podcast.userInteractions?.some((ui: { isFollowing: boolean }) => ui.isFollowing),
      isLiked: !!podcast.userInteractions?.some((ui: { isLiked: boolean }) => ui.isLiked),
    };

    return res.status(200).json({
      podcast: transformedPodcast,
      episodes,
    });
  } catch (error) {
    console.error('Error fetching podcast:', error);
    return res.status(500).json({ message: 'Failed to fetch podcast details' });
  }
} 