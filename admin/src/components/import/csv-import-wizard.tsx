'use client';

import { useState, useCallback, useEffect } from 'react';
import Papa from 'papaparse';
import { Upload, FileText, Check, AlertCircle, X, Loader2, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TABLE_CONFIGS, type TableName } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import {
  transliterateArabicToEnglish,
  containsArabic,
} from '@/lib/arabic-transliteration';
import {
  loadTranslations,
  translateProjectName,
  hasGeminiTranslation,
  findUntranslatedArabic,
} from '@/lib/project-name-translations';

// Parse date from various formats (DD-MM-YYYY, DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD) to YYYY-MM-DD
function parseDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === '') return null;

  const str = dateStr.trim();

  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // DD-MM-YYYY or DD/MM/YYYY format (common in many regions)
  const ddmmyyyyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    const d = day.padStart(2, '0');
    const m = month.padStart(2, '0');
    return `${year}-${m}-${d}`;
  }

  // YYYY/MM/DD format
  const yyyymmddSlashMatch = str.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (yyyymmddSlashMatch) {
    const [, year, month, day] = yyyymmddSlashMatch;
    const d = day.padStart(2, '0');
    const m = month.padStart(2, '0');
    return `${year}-${m}-${d}`;
  }

  // Try parsing as a standard date string
  try {
    const date = new Date(str);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch {
    // Fall through to return null
  }

  return null;
}

type ImportStep = 'upload' | 'preview' | 'mapping' | 'importing' | 'complete';

interface ImportState {
  step: ImportStep;
  file: File | null;
  tableName: TableName | '';
  parsedData: Record<string, unknown>[];
  csvHeaders: string[];
  columnMapping: Record<string, string>;
  transliterateColumns: Record<string, boolean>;
  progress: number;
  totalRecords: number;
  importedRecords: number;
  failedRecords: number;
  errors: string[];
  geminiTranslations: Record<string, string>;
  translationsLoaded: boolean;
  untranslatedNames: string[];
  showUntranslatedWarning: boolean;
}

export function CSVImportWizard() {
  const [state, setState] = useState<ImportState>({
    step: 'upload',
    file: null,
    tableName: '',
    parsedData: [],
    csvHeaders: [],
    columnMapping: {},
    transliterateColumns: {},
    progress: 0,
    totalRecords: 0,
    importedRecords: 0,
    failedRecords: 0,
    errors: [],
    geminiTranslations: {},
    translationsLoaded: false,
    untranslatedNames: [],
    showUntranslatedWarning: false,
  });

  // Load Gemini translations on mount
  useEffect(() => {
    loadTranslations().then((translations) => {
      setState((prev) => ({
        ...prev,
        geminiTranslations: translations,
        translationsLoaded: true,
      }));
    });
  }, []);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        preview: 100,
        complete: (results) => {
          const headers = results.meta.fields || [];
          setState((prev) => ({
            ...prev,
            file,
            csvHeaders: headers,
            parsedData: results.data as Record<string, unknown>[],
            step: 'preview',
          }));
        },
        error: (error) => {
          setState((prev) => ({
            ...prev,
            errors: [...prev.errors, `Parse error: ${error.message}`],
          }));
        },
      });
    },
    []
  );

  const handleTableSelect = (tableName: TableName) => {
    const config = TABLE_CONFIGS[tableName];
    const autoMapping: Record<string, string> = {};

    config.columns.forEach((col) => {
      const matchingHeader = state.csvHeaders.find(
        (h) =>
          h.toLowerCase() === col.name.toLowerCase() ||
          h.toLowerCase().replace(/[_\s]/g, '') ===
            col.name.toLowerCase().replace(/[_\s]/g, '')
      );
      if (matchingHeader) {
        autoMapping[col.name] = matchingHeader;
      }
    });

    setState((prev) => ({
      ...prev,
      tableName,
      columnMapping: autoMapping,
      step: 'mapping',
    }));
  };

  const handleMappingChange = (dbColumn: string, csvColumn: string) => {
    setState((prev) => ({
      ...prev,
      columnMapping: {
        ...prev.columnMapping,
        [dbColumn]: csvColumn,
      },
    }));
  };

  const handleTransliterationToggle = (dbColumn: string, enabled: boolean) => {
    setState((prev) => ({
      ...prev,
      transliterateColumns: {
        ...prev.transliterateColumns,
        [dbColumn]: enabled,
      },
    }));
  };

  // Check for untranslated Arabic names before importing
  const checkForUntranslatedNames = async () => {
    if (!state.file || !state.tableName) return;

    const config = TABLE_CONFIGS[state.tableName];

    // Find columns that have translation enabled
    const translationEnabledColumns = Object.entries(state.transliterateColumns)
      .filter(([_, enabled]) => enabled)
      .map(([col]) => col);

    if (translationEnabledColumns.length === 0) {
      // No translation columns, proceed directly
      startImport();
      return;
    }

    // Parse the full file to collect all Arabic values
    return new Promise<void>((resolve) => {
      const arabicValues: string[] = [];

      Papa.parse(state.file!, {
        header: true,
        skipEmptyLines: true,
        chunk: (results) => {
          for (const row of results.data as Record<string, unknown>[]) {
            for (const dbCol of translationEnabledColumns) {
              const csvCol = state.columnMapping[dbCol];
              if (csvCol) {
                const value = row[csvCol];
                if (typeof value === 'string' && containsArabic(value)) {
                  arabicValues.push(value);
                }
              }
            }
          }
        },
        complete: () => {
          const untranslated = findUntranslatedArabic(arabicValues, state.geminiTranslations);

          if (untranslated.length > 0) {
            // Show warning dialog
            setState((prev) => ({
              ...prev,
              untranslatedNames: untranslated,
              showUntranslatedWarning: true,
            }));
          } else {
            // All names have translations, proceed
            startImport();
          }
          resolve();
        },
      });
    });
  };

  const dismissUntranslatedWarning = () => {
    setState((prev) => ({
      ...prev,
      showUntranslatedWarning: false,
      untranslatedNames: [],
    }));
  };

  const startImport = async () => {
    if (!state.file || !state.tableName) return;

    setState((prev) => ({ ...prev, step: 'importing', progress: 0, showUntranslatedWarning: false }));

    const config = TABLE_CONFIGS[state.tableName];
    let totalRecords = 0;
    let importedRecords = 0;
    let failedRecords = 0;
    const errors: string[] = [];

    Papa.parse(state.file, {
      header: true,
      skipEmptyLines: true,
      chunk: async (results, parser) => {
        parser.pause();

        const batch: Record<string, unknown>[] = [];

        const cutoffDate = new Date('2021-01-01');
        let skippedRecords = 0;

        for (const row of results.data as Record<string, unknown>[]) {
          const mappedRow: Record<string, unknown> = {};

          for (const [dbCol, csvCol] of Object.entries(state.columnMapping)) {
            if (csvCol && row[csvCol] !== undefined) {
              const colConfig = config.columns.find((c) => c.name === dbCol);
              let value = row[csvCol];

              if (colConfig) {
                if (colConfig.type === 'number') {
                  value = value ? parseFloat(String(value)) : null;
                  if (isNaN(value as number)) value = null;
                } else if (colConfig.type === 'boolean') {
                  value =
                    String(value).toLowerCase() === 'true' ||
                    String(value) === '1';
                } else if (colConfig.type === 'date') {
                  value = value ? parseDate(String(value)) : null;
                } else {
                  value = value ? String(value) : null;
                  // Apply Arabic to English translation if enabled for this column
                  // Only translates if Gemini translation exists, otherwise keeps Arabic
                  if (
                    value &&
                    state.transliterateColumns[dbCol] &&
                    containsArabic(value as string)
                  ) {
                    const translated = translateProjectName(value as string, state.geminiTranslations);
                    // Only use translation if found, otherwise keep original Arabic
                    if (translated !== null) {
                      value = translated;
                    }
                  }
                }
              }

              mappedRow[dbCol] = value;
            }
          }

          // Filter out records older than 2021-01-01 for project_information table
          if (state.tableName === 'project_information' && mappedRow.project_creation_date) {
            const recordDate = new Date(mappedRow.project_creation_date as string);
            if (recordDate < cutoffDate) {
              skippedRecords++;
              continue; // Skip this record
            }
          }

          // Skip rows missing required fields
          const requiredColumns = config.columns.filter((c) => c.required);
          const missingRequired = requiredColumns.some((col) => {
            const value = mappedRow[col.name];
            return value === null || value === undefined || value === '';
          });

          if (missingRequired) {
            skippedRecords++;
            continue; // Skip rows with missing required fields
          }

          batch.push(mappedRow);
          totalRecords++;
        }

        if (batch.length > 0) {
          // Tables with unique constraints that support upsert
          const tablesWithUniqueKey = ['project_information', 'projects', 'developers', 'areas'];

          let error;
          if (tablesWithUniqueKey.includes(state.tableName) && config.uniqueKey !== 'id') {
            // Use upsert for tables with unique constraints
            const result = await supabase
              .from(state.tableName)
              .upsert(batch, { onConflict: config.uniqueKey });
            error = result.error;
          } else {
            // Use insert for tables without unique constraints
            const result = await supabase
              .from(state.tableName)
              .insert(batch);
            error = result.error;
          }

          if (error) {
            failedRecords += batch.length;
            errors.push(`Batch error: ${error.message}`);
          } else {
            importedRecords += batch.length;
          }

          // Auto-populate areas table when importing land_registry
          if (state.tableName === 'land_registry') {
            const areasToUpsert = batch
              .filter((row) => row.munc_zip_code && row.area_name_en)
              .map((row) => ({
                munc_zip_code: row.munc_zip_code as number,
                area_name_en: row.area_name_en as string,
              }));

            if (areasToUpsert.length > 0) {
              // Get unique areas by munc_zip_code
              const uniqueAreas = Array.from(
                new Map(areasToUpsert.map((a) => [a.munc_zip_code, a])).values()
              );

              await supabase
                .from('areas')
                .upsert(uniqueAreas, { onConflict: 'munc_zip_code' });
            }
          }

          // Auto-populate companies table when importing developers
          if (state.tableName === 'developers') {
            const companiesToUpsert = batch
              .filter((row) => row.developer_id && row.developer_name_en)
              .map((row) => ({
                license_no: row.developer_id as number,
                name_en: row.developer_name_en as string,
                type: 'developer',
                project_count: 0,
              }));

            if (companiesToUpsert.length > 0) {
              const uniqueCompanies = Array.from(
                new Map(companiesToUpsert.map((c) => [c.license_no, c])).values()
              );

              await supabase
                .from('companies')
                .upsert(uniqueCompanies, { onConflict: 'license_no,type' });
            }
          }

          // Auto-populate companies table when importing consultant_projects
          if (state.tableName === 'consultant_projects') {
            const companyMap = new Map<number, { license_no: number; name_en: string; count: number }>();

            batch.forEach((row) => {
              const licenseNo = row.consultant_license_no as number;
              const name = row.consultant_english as string;
              if (licenseNo && licenseNo > 0 && name) {
                const existing = companyMap.get(licenseNo);
                if (existing) {
                  existing.count++;
                } else {
                  companyMap.set(licenseNo, { license_no: licenseNo, name_en: name, count: 1 });
                }
              }
            });

            if (companyMap.size > 0) {
              // Fetch existing project counts to add to them
              const licenseNos = Array.from(companyMap.keys());
              const { data: existingCompanies } = await supabase
                .from('companies')
                .select('license_no, project_count')
                .eq('type', 'consultant')
                .in('license_no', licenseNos);

              const existingCounts = new Map(
                existingCompanies?.map((c) => [c.license_no, c.project_count || 0]) || []
              );

              const companiesToUpsert = Array.from(companyMap.values()).map((c) => ({
                license_no: c.license_no,
                name_en: c.name_en,
                type: 'consultant',
                project_count: (existingCounts.get(c.license_no) || 0) + c.count,
              }));

              await supabase
                .from('companies')
                .upsert(companiesToUpsert, { onConflict: 'license_no,type' });
            }
          }

          // Auto-populate companies table when importing contractor_projects
          if (state.tableName === 'contractor_projects') {
            const companyMap = new Map<number, { license_no: number; name_en: string; count: number }>();

            batch.forEach((row) => {
              const licenseNo = row.contractor_license_no as number;
              const name = row.contractor_english as string;
              if (licenseNo && licenseNo > 0 && name) {
                const existing = companyMap.get(licenseNo);
                if (existing) {
                  existing.count++;
                } else {
                  companyMap.set(licenseNo, { license_no: licenseNo, name_en: name, count: 1 });
                }
              }
            });

            if (companyMap.size > 0) {
              // Fetch existing project counts to add to them
              const licenseNos = Array.from(companyMap.keys());
              const { data: existingCompanies } = await supabase
                .from('companies')
                .select('license_no, project_count')
                .eq('type', 'contractor')
                .in('license_no', licenseNos);

              const existingCounts = new Map(
                existingCompanies?.map((c) => [c.license_no, c.project_count || 0]) || []
              );

              const companiesToUpsert = Array.from(companyMap.values()).map((c) => ({
                license_no: c.license_no,
                name_en: c.name_en,
                type: 'contractor',
                project_count: (existingCounts.get(c.license_no) || 0) + c.count,
              }));

              await supabase
                .from('companies')
                .upsert(companiesToUpsert, { onConflict: 'license_no,type' });
            }
          }
        }

        setState((prev) => ({
          ...prev,
          totalRecords,
          importedRecords,
          failedRecords,
          progress: Math.round((totalRecords / (state.parsedData.length * 10)) * 100),
          errors,
        }));

        parser.resume();
      },
      complete: () => {
        setState((prev) => ({
          ...prev,
          step: 'complete',
          progress: 100,
          totalRecords,
          importedRecords,
          failedRecords,
          errors,
        }));
      },
      error: (error) => {
        setState((prev) => ({
          ...prev,
          errors: [...prev.errors, `Import error: ${error.message}`],
          step: 'complete',
        }));
      },
    });
  };

  const resetWizard = () => {
    setState((prev) => ({
      step: 'upload',
      file: null,
      tableName: '',
      parsedData: [],
      csvHeaders: [],
      columnMapping: {},
      transliterateColumns: {},
      progress: 0,
      totalRecords: 0,
      importedRecords: 0,
      failedRecords: 0,
      errors: [],
      // Preserve loaded translations
      geminiTranslations: prev.geminiTranslations,
      translationsLoaded: prev.translationsLoaded,
      untranslatedNames: [],
      showUntranslatedWarning: false,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {(['upload', 'preview', 'mapping', 'importing', 'complete'] as const).map(
            (step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                    state.step === step
                      ? 'bg-primary-600 text-white'
                      : index <
                        ['upload', 'preview', 'mapping', 'importing', 'complete'].indexOf(
                          state.step
                        )
                      ? 'bg-green-500 text-white'
                      : 'bg-secondary-200 text-secondary-600'
                  )}
                >
                  {index <
                  ['upload', 'preview', 'mapping', 'importing', 'complete'].indexOf(
                    state.step
                  ) ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < 4 && (
                  <div
                    className={cn(
                      'ml-2 h-0.5 w-12',
                      index <
                        ['upload', 'preview', 'mapping', 'importing', 'complete'].indexOf(
                          state.step
                        )
                        ? 'bg-green-500'
                        : 'bg-secondary-200'
                    )}
                  />
                )}
              </div>
            )
          )}
        </div>
        {state.step !== 'upload' && state.step !== 'importing' && (
          <Button variant="outline" onClick={resetWizard}>
            Start Over
          </Button>
        )}
      </div>

      {state.step === 'upload' && (
        <UploadStep onFileSelect={handleFileSelect} />
      )}

      {state.step === 'preview' && (
        <PreviewStep
          file={state.file}
          data={state.parsedData}
          headers={state.csvHeaders}
          onTableSelect={handleTableSelect}
        />
      )}

      {state.step === 'mapping' && state.tableName && (
        <MappingStep
          tableName={state.tableName}
          csvHeaders={state.csvHeaders}
          columnMapping={state.columnMapping}
          transliterateColumns={state.transliterateColumns}
          previewData={state.parsedData}
          geminiTranslations={state.geminiTranslations}
          translationsLoaded={state.translationsLoaded}
          onMappingChange={handleMappingChange}
          onTransliterationToggle={handleTransliterationToggle}
          onStartImport={checkForUntranslatedNames}
        />
      )}

      {/* Untranslated Names Warning Dialog */}
      {state.showUntranslatedWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <CardHeader className="border-b bg-yellow-50">
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="h-5 w-5" />
                Missing Translations Found
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 overflow-y-auto flex-1">
              <p className="text-secondary-700 mb-4">
                The following {state.untranslatedNames.length} Arabic name(s) do not have Gemini translations.
                These records will be imported with the original Arabic text (not translated).
              </p>
              <div className="bg-secondary-50 rounded-lg p-3 max-h-60 overflow-y-auto">
                <ul className="space-y-1">
                  {state.untranslatedNames.map((name, i) => (
                    <li key={i} className="text-sm font-arabic text-secondary-800 py-1 border-b border-secondary-200 last:border-0">
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-sm text-secondary-500 mt-4">
                You can add translations to <code className="bg-secondary-100 px-1 rounded">translations.json</code> and re-import,
                or proceed with the import (Arabic names will remain untranslated).
              </p>
            </CardContent>
            <div className="border-t p-4 flex justify-end gap-3 bg-secondary-50">
              <Button variant="outline" onClick={dismissUntranslatedWarning}>
                Cancel Import
              </Button>
              <Button onClick={startImport}>
                Proceed Anyway (Keep Arabic)
              </Button>
            </div>
          </Card>
        </div>
      )}

      {state.step === 'importing' && (
        <ImportingStep progress={state.progress} />
      )}

      {state.step === 'complete' && (
        <CompleteStep
          totalRecords={state.totalRecords}
          importedRecords={state.importedRecords}
          failedRecords={state.failedRecords}
          errors={state.errors}
          onReset={resetWizard}
        />
      )}
    </div>
  );
}

function UploadStep({
  onFileSelect,
}: {
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload CSV File</CardTitle>
      </CardHeader>
      <CardContent>
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-secondary-300 bg-secondary-50 p-12 transition-colors hover:border-primary-500 hover:bg-primary-50">
          <Upload className="mb-4 h-12 w-12 text-secondary-400" />
          <span className="text-lg font-medium text-secondary-700">
            Drop your CSV file here
          </span>
          <span className="mt-1 text-sm text-secondary-500">
            or click to browse
          </span>
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={onFileSelect}
          />
        </label>
      </CardContent>
    </Card>
  );
}

function PreviewStep({
  file,
  data,
  headers,
  onTableSelect,
}: {
  file: File | null;
  data: Record<string, unknown>[];
  headers: string[];
  onTableSelect: (table: TableName) => void;
}) {
  const [selectedTable, setSelectedTable] = useState<TableName | ''>('');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            File Preview: {file?.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-sm text-secondary-600">
              Found {headers.length} columns and approximately{' '}
              {data.length < 100 ? data.length : '100+'} rows
            </p>
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium">
              Select Target Table
            </label>
            <Select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value as TableName)}
              options={[
                { value: '', label: 'Choose a table...' },
                ...Object.values(TABLE_CONFIGS).map((config) => ({
                  value: config.name,
                  label: config.displayName,
                })),
              ]}
            />
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.slice(0, 6).map((header) => (
                    <TableHead key={header}>{header}</TableHead>
                  ))}
                  {headers.length > 6 && (
                    <TableHead>+{headers.length - 6} more</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.slice(0, 5).map((row, i) => (
                  <TableRow key={i}>
                    {headers.slice(0, 6).map((header) => (
                      <TableCell key={header} className="max-w-[200px] truncate">
                        {String(row[header] ?? '-')}
                      </TableCell>
                    ))}
                    {headers.length > 6 && <TableCell>...</TableCell>}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={() => selectedTable && onTableSelect(selectedTable)}
              disabled={!selectedTable}
            >
              Continue to Mapping
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MappingStep({
  tableName,
  csvHeaders,
  columnMapping,
  transliterateColumns,
  previewData,
  geminiTranslations,
  translationsLoaded,
  onMappingChange,
  onTransliterationToggle,
  onStartImport,
}: {
  tableName: TableName;
  csvHeaders: string[];
  columnMapping: Record<string, string>;
  transliterateColumns: Record<string, boolean>;
  previewData: Record<string, unknown>[];
  geminiTranslations: Record<string, string>;
  translationsLoaded: boolean;
  onMappingChange: (dbColumn: string, csvColumn: string) => void;
  onTransliterationToggle: (dbColumn: string, enabled: boolean) => void;
  onStartImport: () => void;
}) {
  const config = TABLE_CONFIGS[tableName];

  const requiredMapped = config.columns
    .filter((c) => c.required)
    .every((c) => columnMapping[c.name]);

  // Check if the mapped CSV column contains Arabic text
  const hasArabicData = (dbColumn: string): boolean => {
    const csvColumn = columnMapping[dbColumn];
    if (!csvColumn) return false;
    return previewData.some((row) => {
      const value = row[csvColumn];
      return typeof value === 'string' && containsArabic(value);
    });
  };

  // Get a sample Arabic value for preview
  const getSampleArabicValue = (dbColumn: string): string | null => {
    const csvColumn = columnMapping[dbColumn];
    if (!csvColumn) return null;
    for (const row of previewData) {
      const value = row[csvColumn];
      if (typeof value === 'string' && containsArabic(value)) {
        return value;
      }
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Map Columns</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-6 text-sm text-secondary-600">
          Map your CSV columns to the database fields. Required fields are
          marked with *.
        </p>

        <div className="space-y-4">
          {config.columns.map((column) => {
            const showTransliteration =
              column.supportsArabicTransliteration &&
              columnMapping[column.name] &&
              hasArabicData(column.name);
            const sampleArabic = showTransliteration
              ? getSampleArabicValue(column.name)
              : null;

            return (
              <div
                key={column.name}
                className="rounded-lg border p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="min-w-[200px]">
                    <span className="font-medium">
                      {column.name}
                      {column.required && (
                        <span className="ml-1 text-red-500">*</span>
                      )}
                    </span>
                    <Badge variant="secondary" className="ml-2">
                      {column.type}
                    </Badge>
                    {column.supportsArabicTransliteration && (
                      <Badge variant="default" className="ml-2 bg-blue-100 text-blue-700">
                        <Languages className="mr-1 h-3 w-3" />
                        AR→EN
                      </Badge>
                    )}
                  </div>
                  <span className="text-secondary-400">→</span>
                  <Select
                    value={columnMapping[column.name] || ''}
                    onChange={(e) => onMappingChange(column.name, e.target.value)}
                    className="flex-1"
                    options={[
                      { value: '', label: 'Not mapped' },
                      ...csvHeaders.map((h) => ({ value: h, label: h })),
                    ]}
                  />
                  {columnMapping[column.name] && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onMappingChange(column.name, '')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {showTransliteration && (
                  <div className="mt-3 ml-[216px] rounded-md bg-blue-50 p-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={transliterateColumns[column.name] || false}
                        onChange={(e) =>
                          onTransliterationToggle(column.name, e.target.checked)
                        }
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="font-medium text-blue-900">
                          Convert Arabic to English
                        </span>
                        <p className="text-sm text-blue-700 mt-1">
                          Arabic text detected in CSV. Enable to translate to English.
                          {translationsLoaded && (
                            <span className="ml-1 text-green-700">
                              ({Object.keys(geminiTranslations).length.toLocaleString()} Gemini translations loaded)
                            </span>
                          )}
                        </p>
                        {sampleArabic && (
                          <div className="mt-2 text-xs">
                            <span className="text-blue-600">Sample: </span>
                            <span className="font-arabic text-blue-900">{sampleArabic}</span>
                            <span className="text-blue-600"> → </span>
                            {hasGeminiTranslation(sampleArabic, geminiTranslations) ? (
                              <>
                                <span className="text-blue-900">
                                  {translateProjectName(sampleArabic, geminiTranslations)}
                                </span>
                                <span className="ml-2 text-green-600 font-medium">(Gemini)</span>
                              </>
                            ) : (
                              <>
                                <span className="font-arabic text-yellow-700">{sampleArabic}</span>
                                <span className="ml-2 text-yellow-600 font-medium">(No translation - will keep Arabic)</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <Button onClick={onStartImport} disabled={!requiredMapped}>
            Start Import
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ImportingStep({ progress }: { progress: number }) {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="flex flex-col items-center">
          <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary-600" />
          <h3 className="mb-2 text-lg font-semibold">Importing Data...</h3>
          <p className="mb-6 text-secondary-600">
            Please don't close this window
          </p>
          <div className="w-full max-w-md">
            <Progress value={progress} />
            <p className="mt-2 text-center text-sm text-secondary-500">
              {progress}% complete
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CompleteStep({
  totalRecords,
  importedRecords,
  failedRecords,
  errors,
  onReset,
}: {
  totalRecords: number;
  importedRecords: number;
  failedRecords: number;
  errors: string[];
  onReset: () => void;
}) {
  const isSuccess = failedRecords === 0;

  return (
    <Card>
      <CardContent className="py-12">
        <div className="flex flex-col items-center">
          {isSuccess ? (
            <div className="mb-4 rounded-full bg-green-100 p-4">
              <Check className="h-12 w-12 text-green-600" />
            </div>
          ) : (
            <div className="mb-4 rounded-full bg-yellow-100 p-4">
              <AlertCircle className="h-12 w-12 text-yellow-600" />
            </div>
          )}

          <h3 className="mb-2 text-lg font-semibold">
            {isSuccess ? 'Import Complete!' : 'Import Completed with Errors'}
          </h3>

          <div className="mb-6 grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-secondary-900">
                {totalRecords.toLocaleString()}
              </p>
              <p className="text-sm text-secondary-500">Total Records</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-600">
                {importedRecords.toLocaleString()}
              </p>
              <p className="text-sm text-secondary-500">Imported</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-red-600">
                {failedRecords.toLocaleString()}
              </p>
              <p className="text-sm text-secondary-500">Failed</p>
            </div>
          </div>

          {errors.length > 0 && (
            <div className="mb-6 w-full max-w-lg rounded-lg bg-red-50 p-4">
              <h4 className="mb-2 font-medium text-red-800">Errors:</h4>
              <ul className="list-inside list-disc text-sm text-red-700">
                {errors.slice(0, 5).map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
                {errors.length > 5 && (
                  <li>...and {errors.length - 5} more errors</li>
                )}
              </ul>
            </div>
          )}

          <Button onClick={onReset}>Import Another File</Button>
        </div>
      </CardContent>
    </Card>
  );
}
