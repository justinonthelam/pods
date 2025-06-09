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
  const { content } = req.body;

  if (typeof content !== 'string' || content.length < 10) {
    return res.status(400).json({ message: 'Review must be at least 10 characters long' });
  }

  if (content.length > 1000) {
    return res.status(400).json({ message: 'Review cannot exceed 1000 characters' });
  }

  try {
    // Create the review
    const review = await prisma.review.create({
      data: {
        content,
        userId: session.user.id,
        podcastId,
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    // Get the total number of reviews
    const totalReviews = await prisma.review.count({
      where: { podcastId },
    });

    return res.status(201).json({
      review: {
        id: review.id,
        content: review.content,
        createdAt: review.createdAt,
        user: review.user,
      },
      totalReviews,
    });
  } catch (error) {
    console.error('Error creating review:', error);
    return res.status(500).json({ message: 'Failed to create review' });
  }
} 