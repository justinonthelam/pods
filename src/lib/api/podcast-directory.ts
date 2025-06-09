import { env } from '@/lib/env';

export interface PodcastSearchParams {
  q: string;
  type?: 'podcast' | 'episode';
  offset?: number;
  limit?: number;
  language?: string;
  region?: string;
}

export interface PodcastMetadata {
  id: string;
  title: string;
  description: string;
  publisher: string;
  image: string;
  website?: string;
  language: string;
  categories: string[];
  totalEpisodes: number;
  latestEpisodeDate: string;
}

export interface EpisodeMetadata {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  imageUrl: string;
  duration: number;
  publishDate: string;
  podcastId: string;
  podcastTitle: string;
}

export interface SearchResults {
  podcasts: PodcastMetadata[];
  episodes: EpisodeMetadata[];
  total: number;
  offset: number;
  hasMore: boolean;
}

interface RawPodcast {
  id: string;
  title: string;
  description: string;
  publisher: string;
  image: string;
  website?: string;
  language: string;
  genre_ids: string[];
  total_episodes: number;
  latest_pub_date_ms: number;
  type: 'podcast';
}

interface RawEpisode {
  id: string;
  title: string;
  description: string;
  audio: string;
  image: string;
  audio_length_sec: number;
  pub_date_ms: number;
  podcast: {
    id: string;
    title: string;
  };
  type: 'episode';
}

interface SearchResponse {
  results: (RawPodcast | RawEpisode)[];
  total: number;
  offset: number;
  next_offset: number;
}

interface PodcastResponse extends RawPodcast {
  episodes: RawEpisode[];
  next_episode_pub_date: string | null;
}

interface EpisodeResponse extends RawEpisode {}

class PodcastDirectoryAPI {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = env.PODCAST_API_URL;
    this.apiKey = env.PODCAST_API_KEY;
  }

  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'X-ListenAPI-Key': this.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  private transformPodcast(raw: RawPodcast): PodcastMetadata {
    return {
      id: raw.id,
      title: raw.title,
      description: raw.description,
      publisher: raw.publisher,
      image: raw.image,
      website: raw.website,
      language: raw.language,
      categories: raw.genre_ids?.map(id => id.toString()) || [],
      totalEpisodes: raw.total_episodes,
      latestEpisodeDate: raw.latest_pub_date_ms
        ? new Date(raw.latest_pub_date_ms).toISOString()
        : '',
    };
  }

  private transformEpisode(raw: RawEpisode): EpisodeMetadata {
    return {
      id: raw.id,
      title: raw.title,
      description: raw.description,
      audioUrl: raw.audio,
      imageUrl: raw.image,
      duration: raw.audio_length_sec,
      publishDate: new Date(raw.pub_date_ms).toISOString(),
      podcastId: raw.podcast.id,
      podcastTitle: raw.podcast.title,
    };
  }

  async search(params: PodcastSearchParams): Promise<SearchResults> {
    const searchParams = new URLSearchParams({
      q: params.q,
      type: params.type || 'podcast',
      offset: params.offset?.toString() || '0',
      len_min: '10', // Minimum length 10 minutes
      language: params.language || 'English',
      region: params.region || 'us',
    });

    const data = await this.fetch<SearchResponse>(`/search?${searchParams.toString()}`);
    
    return {
      podcasts: data.results
        .filter((item): item is RawPodcast => item.type === 'podcast')
        .map(item => this.transformPodcast(item)),
      episodes: data.results
        .filter((item): item is RawEpisode => item.type === 'episode')
        .map(item => this.transformEpisode(item)),
      total: data.total,
      offset: data.offset,
      hasMore: data.next_offset < data.total,
    };
  }

  async getPodcastById(id: string): Promise<PodcastMetadata> {
    const data = await this.fetch<RawPodcast>(`/podcasts/${id}`);
    return this.transformPodcast(data);
  }

  async getPodcastEpisodes(
    podcastId: string,
    nextEpisodePubDate?: string
  ): Promise<{ episodes: EpisodeMetadata[]; hasMore: boolean; nextPubDate: string }> {
    const params = new URLSearchParams();
    if (nextEpisodePubDate) {
      params.set('next_episode_pub_date', nextEpisodePubDate);
    }

    const data = await this.fetch<PodcastResponse>(`/podcasts/${podcastId}/episodes?${params.toString()}`);
    
    return {
      episodes: data.episodes.map(episode => this.transformEpisode(episode)),
      hasMore: data.next_episode_pub_date !== null,
      nextPubDate: data.next_episode_pub_date || '',
    };
  }

  async getEpisodeById(id: string): Promise<EpisodeMetadata> {
    const data = await this.fetch<EpisodeResponse>(`/episodes/${id}`);
    return this.transformEpisode(data);
  }
}

// Export a singleton instance
export const podcastAPI = new PodcastDirectoryAPI(); 