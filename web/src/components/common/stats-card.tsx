import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon,
  trend,
  className,
}: StatsCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-secondary-500">{title}</p>
            <p className="mt-2 text-3xl font-bold text-secondary-900">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {trend && (
              <p
                className={cn(
                  'mt-1 text-sm',
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend.isPositive ? '+' : ''}
                {trend.value}% from last month
              </p>
            )}
          </div>
          <div className="rounded-full bg-primary-50 p-3 text-primary-600">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
