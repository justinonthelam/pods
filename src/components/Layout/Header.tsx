import Link from 'next/link';

export const Header = () => {
  return (
    <header className="w-full bg-white shadow-md">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">
            Pods
          </Link>
          <div className="flex space-x-4">
            <Link href="/search" className="hover:text-gray-600">
              Search
            </Link>
            <Link href="/profile" className="hover:text-gray-600">
              Profile
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}; 