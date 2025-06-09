import { ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/solid';

export interface ErrorProps {
  message: string;
  severity?: 'error' | 'warning' | 'info';
}

export const Error = ({ message, severity = 'error' }: ErrorProps) => {
  const bgColor = {
    error: 'bg-red-50',
    warning: 'bg-yellow-50',
    info: 'bg-blue-50'
  }[severity];

  const textColor = {
    error: 'text-red-800',
    warning: 'text-yellow-800',
    info: 'text-blue-800'
  }[severity];

  const borderColor = {
    error: 'border-red-400',
    warning: 'border-yellow-400',
    info: 'border-blue-400'
  }[severity];

  return (
    <div className={`p-4 rounded-lg border ${bgColor} ${borderColor}`}>
      <p className={`text-sm ${textColor}`}>{message}</p>
    </div>
  );
};

interface ErrorBoundaryFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export const ErrorBoundaryFallback = ({
  error,
  resetErrorBoundary
}: ErrorBoundaryFallbackProps) => {
  return (
    <Error
      message={error.message}
      severity="error"
    />
  );
}; 