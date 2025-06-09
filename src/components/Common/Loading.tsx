interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Spinner = ({ size = 'md', className = '' }: SpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`animate-spin ${sizeClasses[size]} ${className}`}>
      <svg
        className="w-full h-full text-blue-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
}

const Skeleton = ({
  variant = 'text',
  width,
  height,
  className = ''
}: SkeletonProps) => {
  const baseClasses = 'animate-pulse bg-gray-200';
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  };

  const style = {
    width: width || (variant === 'text' ? '100%' : 'auto'),
    height: height || (variant === 'text' ? '1em' : 'auto')
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
};

interface LoadingProps {
  variant?: 'spinner' | 'skeleton';
  text?: string;
  fullScreen?: boolean;
  spinnerSize?: 'sm' | 'md' | 'lg';
  skeletonVariant?: 'text' | 'circular' | 'rectangular';
  skeletonWidth?: string | number;
  skeletonHeight?: string | number;
  className?: string;
}

export const Loading = ({
  variant = 'spinner',
  text,
  fullScreen = false,
  spinnerSize = 'md',
  skeletonVariant = 'rectangular',
  skeletonWidth,
  skeletonHeight,
  className = ''
}: LoadingProps) => {
  const content = variant === 'spinner' ? (
    <div className="flex flex-col items-center justify-center gap-3">
      <Spinner size={spinnerSize} />
      {text && <p className="text-gray-500">{text}</p>}
    </div>
  ) : (
    <Skeleton
      variant={skeletonVariant}
      width={skeletonWidth}
      height={skeletonHeight}
      className={className}
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
        {content}
      </div>
    );
  }

  return content;
}; 