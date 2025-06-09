import Link from 'next/link';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/solid';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PodcastBreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const PodcastBreadcrumbs = ({ items, className = '' }: PodcastBreadcrumbsProps) => {
  return (
    <nav className={`flex ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        <li>
          <Link
            href="/"
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Home"
          >
            <HomeIcon className="w-5 h-5" />
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center">
            <ChevronRightIcon className="w-5 h-5 text-gray-400 mx-1" aria-hidden="true" />
            {item.href && index < items.length - 1 ? (
              <Link
                href={item.href}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-900 font-medium" aria-current={index === items.length - 1 ? 'page' : undefined}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}; 