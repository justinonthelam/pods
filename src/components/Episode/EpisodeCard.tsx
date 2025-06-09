import Image from 'next/image';
import Link from 'next/link';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { PlayIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { Rating } from '../Common/Rating';
import { Episode } from '@/types/podcast';

export interface EpisodeCardProps {
  episodeData: Episode;
  podcastId: string;
  podcastTitle: string;
}

export const EpisodeCard = ({
  episodeData,
  podcastId,
  podcastTitle
}: EpisodeCardProps) => {
  // Implementation will be added in a separate task
  return null;
}; 