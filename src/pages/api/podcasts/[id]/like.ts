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
  const { liked } = req.body;

  if (typeof liked !== 'boolean') {
    return res.status(400).json({ message: 'Invalid like status' });
  }

  try {
    // Update or create user interaction
    await prisma.userInteraction.upsert({
      where: {
        userId_podcastId: {
          userId: session.user.id,
          podcastId,
        },
      },
      update: {
        isLiked: liked,
      },
      create: {
        userId: session.user.id,
        podcastId,
        isLiked: liked,
        isFollowing: false, // Default value
      },
    });

    // Get updated like count
    const likeCount = await prisma.userInteraction.count({
      where: {
        podcastId,
        isLiked: true,
      },
    });

    return res.status(200).json({
      isLiked: liked,
      likeCount,
    });
  } catch (error) {
    console.error('Error updating like status:', error);
    return res.status(500).json({ message: 'Failed to update like status' });
  }
} 