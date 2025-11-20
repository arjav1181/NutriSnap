import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const LoadingSpinner = ({ className }: { className?: string }) => {
  return <Loader2 className={cn('animate-spin', className)} />;
};

export default LoadingSpinner;
