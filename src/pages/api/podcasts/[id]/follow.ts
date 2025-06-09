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
  const { following } = req.body;

  if (typeof following !== 'boolean') {
    return res.status(400).json({ message: 'Invalid follow status' });
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
        isFollowing: following,
      },
      create: {
        userId: session.user.id,
        podcastId,
        isFollowing: following,
        isLiked: false, // Default value
      },
    });

    // Get updated follower count
    const followerCount = await prisma.userInteraction.count({
      where: {
        podcastId,
        isFollowing: true,
      },
    });

    return res.status(200).json({
      isFollowing: following,
      followerCount,
    });
  } catch (error) {
    console.error('Error updating follow status:', error);
    return res.status(500).json({ message: 'Failed to update follow status' });
  }
} 