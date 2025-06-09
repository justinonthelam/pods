import { PrismaClient } from '@prisma/client';
import { searchIndex } from '../search/podcastIndex';

const prisma = new PrismaClient();

interface IndexUpdateJob {
  interval: NodeJS.Timeout;
  isRunning: boolean;
}

class IndexUpdater {
  private job: IndexUpdateJob | null = null;
  private updateInterval = 15 * 60 * 1000; // 15 minutes

  async start() {
    if (this.job) {
      console.warn('Index updater job is already running');
      return;
    }

    // Initial index build
    await this.updateIndex();

    // Start periodic updates
    const interval = setInterval(async () => {
      if (this.job?.isRunning) {
        console.warn('Previous index update still running, skipping this iteration');
        return;
      }

      await this.updateIndex();
    }, this.updateInterval);

    this.job = {
      interval,
      isRunning: false,
    };

    console.log('Index updater job started');
  }

  stop() {
    if (!this.job) {
      console.warn('Index updater job is not running');
      return;
    }

    clearInterval(this.job.interval);
    this.job = null;
    console.log('Index updater job stopped');
  }

  private async updateIndex() {
    if (!this.job) return;

    this.job.isRunning = true;
    console.log('Starting index update...');

    try {
      const result = await searchIndex.buildIndex();
      console.log('Index update completed:', result);
    } catch (error) {
      console.error('Error updating index:', error);
    } finally {
      if (this.job) {
        this.job.isRunning = false;
      }
    }
  }
}

// Create a singleton instance
export const indexUpdater = new IndexUpdater(); 