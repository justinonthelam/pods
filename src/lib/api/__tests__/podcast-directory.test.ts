import { podcastAPI } from '../podcast-directory';

// Mock the global fetch function
global.fetch = jest.fn();

describe('PodcastDirectoryAPI', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('should search for podcasts', async () => {
    const mockResponse = {
      results: [
        {
          id: '1',
          title: 'Test Podcast',
          description: 'A test podcast',
          publisher: 'Test Publisher',
          image: 'https://example.com/image.jpg',
          language: 'English',
          genre_ids: ['1', '2'],
          total_episodes: 10,
          latest_pub_date_ms: 1625097600000,
          type: 'podcast',
        },
      ],
      total: 1,
      offset: 0,
      next_offset: 0,
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await podcastAPI.search({ q: 'test' });

    expect(result.podcasts).toHaveLength(1);
    expect(result.podcasts[0]).toEqual({
      id: '1',
      title: 'Test Podcast',
      description: 'A test podcast',
      publisher: 'Test Publisher',
      image: 'https://example.com/image.jpg',
      language: 'English',
      categories: ['1', '2'],
      totalEpisodes: 10,
      latestEpisodeDate: '2021-07-01T00:00:00.000Z',
      website: undefined,
    });
  });

  it('should get podcast by ID', async () => {
    const mockResponse = {
      id: '1',
      title: 'Test Podcast',
      description: 'A test podcast',
      publisher: 'Test Publisher',
      image: 'https://example.com/image.jpg',
      language: 'English',
      genre_ids: ['1', '2'],
      total_episodes: 10,
      latest_pub_date_ms: 1625097600000,
      type: 'podcast',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await podcastAPI.getPodcastById('1');

    expect(result).toEqual({
      id: '1',
      title: 'Test Podcast',
      description: 'A test podcast',
      publisher: 'Test Publisher',
      image: 'https://example.com/image.jpg',
      language: 'English',
      categories: ['1', '2'],
      totalEpisodes: 10,
      latestEpisodeDate: '2021-07-01T00:00:00.000Z',
      website: undefined,
    });
  });

  it('should handle API errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    });

    await expect(podcastAPI.getPodcastById('invalid-id')).rejects.toThrow(
      'API request failed: Not Found'
    );
  });
}); 