import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <div>
      <Header
        title="Settings"
        description="Configure application settings"
      />

      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Application Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-secondary-600">
              Settings page coming soon. This will include:
            </p>
            <ul className="mt-4 list-inside list-disc space-y-2 text-secondary-600">
              <li>Database connection settings</li>
              <li>Import/Export preferences</li>
              <li>User management</li>
              <li>Notification settings</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
