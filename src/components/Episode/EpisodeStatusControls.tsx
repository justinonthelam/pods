import { useState } from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon as CheckCircleSolid,
  ClockIcon as ClockSolid
} from '@heroicons/react/24/solid';

export type EpisodeStatus = 'not_started' | 'listened' | 'listen_later';

interface EpisodeStatusControlsProps {
  status: EpisodeStatus;
  onStatusChange: (status: EpisodeStatus) => void;
  isUpdating?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
}

export const EpisodeStatusControls = ({
  status,
  onStatusChange,
  isUpdating = false,
  size = 'md',
  showLabels = true,
  className = ''
}: EpisodeStatusControlsProps) => {
  const [isHoveringListened, setIsHoveringListened] = useState(false);
  const [isHoveringLater, setIsHoveringLater] = useState(false);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const buttonClasses = `
    flex items-center gap-2 px-2 py-1 rounded-lg
    transition-colors duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  return (
    <div className={`flex gap-2 ${className}`} role="group" aria-label="Episode status controls">
      <button
        type="button"
        onClick={() => onStatusChange(status === 'listened' ? 'not_started' : 'listened')}
        onMouseEnter={() => setIsHoveringListened(true)}
        onMouseLeave={() => setIsHoveringListened(false)}
        disabled={isUpdating}
        className={`${buttonClasses} ${
          status === 'listened'
            ? 'text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        }`}
        aria-pressed={status === 'listened'}
      >
        {status === 'listened' ? (
          <CheckCircleSolid className={sizeClasses[size]} />
        ) : isHoveringListened ? (
          <CheckCircleIcon className={sizeClasses[size]} />
        ) : (
          <PlayIcon className={sizeClasses[size]} />
        )}
        {showLabels && (
          <span className="text-sm">
            {status === 'listened' ? 'Listened' : 'Mark as Listened'}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => onStatusChange(status === 'listen_later' ? 'not_started' : 'listen_later')}
        onMouseEnter={() => setIsHoveringLater(true)}
        onMouseLeave={() => setIsHoveringLater(false)}
        disabled={isUpdating}
        className={`${buttonClasses} ${
          status === 'listen_later'
            ? 'text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        }`}
        aria-pressed={status === 'listen_later'}
      >
        {status === 'listen_later' ? (
          <ClockSolid className={sizeClasses[size]} />
        ) : (
          <ClockIcon className={sizeClasses[size]} />
        )}
        {showLabels && (
          <span className="text-sm">
            {status === 'listen_later' ? 'In Listen Later' : 'Listen Later'}
          </span>
        )}
      </button>
    </div>
  );
}; 