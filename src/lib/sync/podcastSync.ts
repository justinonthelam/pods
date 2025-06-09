import { PrismaClient } from '@prisma/client';
import { fetchPodcastFeed } from '../api/external/podcastFeed';

const prisma = new PrismaClient();

interface SyncOptions {
  forceUpdate?: boolean;
  updateFrequency?: number; // in minutes
}

export async function syncPodcast(podcastId: string, options: SyncOptions = {}) {
  const {
    forceUpdate = false,
    updateFrequency = 60, // Default to 1 hour
  } = options;

  try {
    // Get podcast from database
    const podcast = await prisma.podcast.findUnique({
      where: { id: podcastId },
      select: {
        id: true,
        feedUrl: true,
        lastSyncedAt: true,
      },
    });

    if (!podcast?.feedUrl) {
      throw new Error('Podcast feed URL not found');
    }

    // Check if sync is needed
    const now = new Date();
    const lastSynced = podcast.lastSyncedAt;
    const shouldSync = forceUpdate || 
      !lastSynced || 
      (now.getTime() - lastSynced.getTime()) > updateFrequency * 60 * 1000;

    if (!shouldSync) {
      return { status: 'skipped', message: 'Sync not needed' };
    }

    // Fetch latest feed data
    const feedData = await fetchPodcastFeed(podcast.feedUrl);

    // Begin transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update podcast metadata
      await tx.podcast.update({
        where: { id: podcastId },
        data: {
          title: feedData.title,
          description: feedData.description,
          imageUrl: feedData.imageUrl,
          language: feedData.language,
          categories: feedData.categories,
          lastSyncedAt: now,
        },
      });

      // Process episodes
      for (const episode of feedData.episodes) {
        await tx.episode.upsert({
          where: {
            podcastId_guid: {
              podcastId,
              guid: episode.guid,
            },
          },
          update: {
            title: episode.title,
            description: episode.description,
            publishDate: episode.publishDate,
            duration: episode.duration,
            imageUrl: episode.imageUrl,
            audioUrl: episode.audioUrl,
          },
          create: {
            podcastId,
            guid: episode.guid,
            title: episode.title,
            description: episode.description,
            publishDate: episode.publishDate,
            duration: episode.duration,
            imageUrl: episode.imageUrl,
            audioUrl: episode.audioUrl,
          },
        });
      }

      return {
        status: 'success',
        message: 'Sync completed successfully',
        updatedAt: now,
        episodeCount: feedData.episodes.length,
      };
    });

    return result;
  } catch (error) {
    console.error('Error syncing podcast:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to sync podcast');
  }
}

export async function syncAllPodcasts(options: SyncOptions = {}) {
  try {
    const podcasts = await prisma.podcast.findMany({
      select: { id: true },
    });

    const results = await Promise.allSettled(
      podcasts.map(podcast => syncPodcast(podcast.id, options))
    );

    const summary = {
      total: podcasts.length,
      successful: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      errors: results
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map(r => r.reason),
    };

    return summary;
  } catch (error) {
    console.error('Error syncing all podcasts:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to sync podcasts');
  }
} 