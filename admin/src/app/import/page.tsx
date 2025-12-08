import { Header } from '@/components/layout/header';
import { CSVImportWizard } from '@/components/import/csv-import-wizard';

export default function ImportPage() {
  return (
    <div>
      <Header
        title="Import Data"
        description="Upload CSV files to import data into the database"
      />

      <div className="p-6">
        <CSVImportWizard />
      </div>
    </div>
  );
}
