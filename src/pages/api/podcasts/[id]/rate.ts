import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const podcastId = req.query.id as string;
  const { rating } = req.body;

  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Invalid rating value' });
  }

  try {
    // Upsert the rating
    await prisma.rating.upsert({
      where: {
        userId_podcastId: {
          userId: session.user.id,
          podcastId,
        },
      },
      update: {
        value: rating,
      },
      create: {
        userId: session.user.id,
        podcastId,
        value: rating,
      },
    });

    // Get updated rating stats
    const ratings = await prisma.rating.findMany({
      where: { podcastId },
      select: { value: true },
    });

    const averageRating = ratings.length > 0
      ? ratings.reduce((acc: number, curr: { value: number }) => acc + curr.value, 0) / ratings.length
      : 0;

    return res.status(200).json({
      averageRating,
      totalRatings: ratings.length,
    });
  } catch (error) {
    console.error('Error rating podcast:', error);
    return res.status(500).json({ message: 'Failed to rate podcast' });
  }
} 