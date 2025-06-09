import Link from 'next/link';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/solid';

interface Episode {
  id: string;
  title: string;
  episodeNumber?: number;
  seasonNumber?: number;
}

interface EpisodeNavigationProps {
  previousEpisode?: Episode;
  nextEpisode?: Episode;
  className?: string;
}

export const EpisodeNavigation = ({
  previousEpisode,
  nextEpisode,
  className = ''
}: EpisodeNavigationProps) => {
  return (
    <nav className={`flex justify-between items-center ${className}`} aria-label="Episode navigation">
      <div className="flex-1">
        {previousEpisode && (
          <Link
            href={`/episode/${previousEpisode.id}`}
            className="group flex items-center text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" />
            <div>
              <div className="text-sm text-gray-500">Previous</div>
              <div className="font-medium">
                {previousEpisode.seasonNumber && previousEpisode.episodeNumber
                  ? `S${previousEpisode.seasonNumber}:E${previousEpisode.episodeNumber} - `
                  : ''}
                {previousEpisode.title}
              </div>
            </div>
          </Link>
        )}
      </div>
      
      <div className="flex-1 text-right">
        {nextEpisode && (
          <Link
            href={`/episode/${nextEpisode.id}`}
            className="group flex items-center justify-end text-gray-500 hover:text-gray-700"
          >
            <div>
              <div className="text-sm text-gray-500">Next</div>
              <div className="font-medium">
                {nextEpisode.seasonNumber && nextEpisode.episodeNumber
                  ? `S${nextEpisode.seasonNumber}:E${nextEpisode.episodeNumber} - `
                  : ''}
                {nextEpisode.title}
              </div>
            </div>
            <ArrowRightIcon className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
          </Link>
        )}
      </div>
    </nav>
  );
}; 