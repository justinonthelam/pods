import { SearchBar } from '@/components/Search/SearchBar';
import { PodcastCard } from '@/components/Podcast/PodcastCard';

interface FeaturedPodcast {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  publisher: string;
}

export default async function Home() {
  // TODO: Fetch featured podcasts from the API
  const featuredPodcasts: FeaturedPodcast[] = [];

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-center mb-6">
          Discover Your Next Favorite Podcast
        </h1>
        <SearchBar />
      </div>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Featured Podcasts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredPodcasts.map((podcast) => (
            <PodcastCard key={podcast.id} {...podcast} />
          ))}
        </div>
      </section>
    </main>
  );
}
