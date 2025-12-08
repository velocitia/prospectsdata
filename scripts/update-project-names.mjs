import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load translations
const translationsPath = path.join(__dirname, 'translations.json');
const translations = JSON.parse(fs.readFileSync(translationsPath, 'utf-8'));

console.log(`Loaded ${Object.keys(translations).length} translations`);

// Simple CSV parser
function parseCSV(content) {
  const lines = content.split('\n');
  const headers = parseCSVLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return rows;
}

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function containsArabic(text) {
  return /[\u0600-\u06FF\u0750-\u077F]/.test(text);
}

async function updateProjectNames() {
  // Supabase configuration
  const supabaseUrl = 'https://njrdnvqqxinpubqgptkn.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qcmRudnFxeGlucHVicWdwdGtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTA0Njc4MSwiZXhwIjoyMDgwNjIyNzgxfQ.wSYtod5kV9uZMYgAkU3R_28DbA9LEHUqPkZCS3g7URo';

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Read CSV file
  const csvPath = path.join(__dirname, '../data/Projects.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');

  console.log('Parsing CSV file...');

  const rows = parseCSV(csvContent);
  console.log(`Found ${rows.length} records in CSV`);

  // Build updates array with translated names
  const updates = [];
  let translated = 0;
  let notTranslated = 0;
  let nonArabic = 0;
  const missingTranslations = new Set();

  for (const row of rows) {
    const projectId = row.project_id ? parseInt(row.project_id) : null;
    const originalName = row.project_name || '';

    if (!projectId) continue;

    let translatedName = originalName;

    if (containsArabic(originalName)) {
      if (translations[originalName]) {
        translatedName = translations[originalName];
        translated++;
      } else {
        // Try to find partial match or keep original
        missingTranslations.add(originalName);
        notTranslated++;
      }
    } else {
      nonArabic++;
    }

    updates.push({
      project_id: projectId,
      project_name: translatedName,
    });
  }

  console.log(`\nTranslation stats:`);
  console.log(`  Arabic names translated: ${translated}`);
  console.log(`  Arabic names not found: ${notTranslated}`);
  console.log(`  Non-Arabic names: ${nonArabic}`);
  console.log(`  Total updates: ${updates.length}`);

  if (missingTranslations.size > 0) {
    console.log(`\nMissing translations (${missingTranslations.size}):`);
    const missingArray = Array.from(missingTranslations).slice(0, 10);
    missingArray.forEach((name) => console.log(`  - ${name}`));
    if (missingTranslations.size > 10) {
      console.log(`  ... and ${missingTranslations.size - 10} more`);
    }
  }

  // Show sample translations
  console.log('\nSample translations:');
  const sampleArabic = rows.filter((row) => containsArabic(row.project_name)).slice(0, 5);
  sampleArabic.forEach((row) => {
    const original = row.project_name;
    const translated = translations[original] || original;
    console.log(`  "${original}" -> "${translated}"`);
  });

  // Update in batches
  const batchSize = 100;
  let updated = 0;
  let failed = 0;

  console.log('\nUpdating database...');

  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);

    const { error } = await supabase
      .from('projects')
      .upsert(batch, { onConflict: 'project_id' });

    if (error) {
      console.error(`\nBatch ${Math.floor(i / batchSize) + 1} error:`, error.message);
      failed += batch.length;
    } else {
      updated += batch.length;
      process.stdout.write(`\rUpdated ${updated} / ${updates.length} records`);
    }
  }

  console.log('\n\nUpdate complete!');
  console.log(`  Total: ${updates.length}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Failed: ${failed}`);
}

updateProjectNames().catch(console.error);
