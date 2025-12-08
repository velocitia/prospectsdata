import { FileQuestion } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
      <div className="rounded-full bg-secondary-100 p-4">
        {icon || <FileQuestion className="h-8 w-8 text-secondary-400" />}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-secondary-900">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-secondary-500 max-w-md">{description}</p>
      )}
    </div>
  );
}
