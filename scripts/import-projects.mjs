import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Arabic to English transliteration mapping
const arabicToEnglishMap = {
  'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'aa',
  'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j',
  'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh',
  'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
  'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z',
  'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
  'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
  'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a',
  'ة': 'a', 'ء': '',
  'َ': 'a', 'ِ': 'i', 'ُ': 'u', 'ْ': '', 'ّ': '',
  'ً': 'an', 'ٍ': 'in', 'ٌ': 'un',
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  'لا': 'la', 'لأ': 'la', 'لإ': 'li', 'لآ': 'laa',
};

function containsArabic(text) {
  return /[\u0600-\u06FF\u0750-\u077F]/.test(text);
}

function transliterateArabicToEnglish(text) {
  if (!text || !containsArabic(text)) return text;

  let result = '';
  let i = 0;

  while (i < text.length) {
    if (i < text.length - 1) {
      const twoChar = text.slice(i, i + 2);
      if (arabicToEnglishMap[twoChar]) {
        result += arabicToEnglishMap[twoChar];
        i += 2;
        continue;
      }
    }

    const char = text[i];
    if (char === 'ّ' && result.length > 0) {
      result += result[result.length - 1];
      i++;
      continue;
    }

    if (arabicToEnglishMap[char] !== undefined) {
      result += arabicToEnglishMap[char];
    } else if (containsArabic(char)) {
      result += '';
    } else {
      result += char;
    }
    i++;
  }

  result = result
    .replace(/\s+/g, ' ')
    .replace(/([a-z])\1{2,}/gi, '$1$1')
    .trim();

  return result.replace(/\b\w/g, (char) => char.toUpperCase());
}

function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null;
  const str = dateStr.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  const ddmmyyyyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return null;
}

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

async function importProjects() {
  // Supabase configuration
  const supabaseUrl = 'https://njrdnvqqxinpubqgptkn.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qcmRudnFxeGlucHVicWdwdGtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTA0Njc4MSwiZXhwIjoyMDgwNjIyNzgxfQ.wSYtod5kV9uZMYgAkU3R_28DbA9LEHUqPkZCS3g7URo';

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Read CSV file
  const csvPath = path.join(__dirname, '../data/Projects.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');

  console.log('Parsing CSV file...');

  const rows = parseCSV(csvContent);

  console.log(`Found ${rows.length} records to import`);

  // Map CSV columns to database columns
  const mappedRecords = rows.map((row) => {
    const projectName = row.project_name || '';
    const transliteratedName = containsArabic(projectName)
      ? transliterateArabicToEnglish(projectName)
      : projectName;

    return {
      project_id: row.project_id ? parseInt(row.project_id) : null,
      project_number: row.project_number ? parseInt(row.project_number) : null,
      project_name: transliteratedName,
      master_developer_id: row.master_developer_id ? parseInt(row.master_developer_id) : null,
      developer_id: row.developer_id ? parseInt(row.developer_id) : null,
      developer_name: row.developer_name || null,
      master_developer_name: row.master_developer_name || null,
      project_status: row.project_status || null,
      percent_completed: row.percent_completed ? parseInt(row.percent_completed) : null,
      project_start_date: parseDate(row.project_start_date),
      project_end_date: parseDate(row.project_end_date),
      completion_date: parseDate(row.completion_date),
      area_name_en: row.area_name_en || null,
      master_project_en: row.master_project_en || null,
      zoning_authority_en: row.zoning_authority_en || null,
      project_description_en: row.project_description_en || null,
      no_of_lands: row.no_of_lands ? parseInt(row.no_of_lands) : null,
      no_of_buildings: row.no_of_buildings ? parseInt(row.no_of_buildings) : null,
      no_of_villas: row.no_of_villas ? parseInt(row.no_of_villas) : null,
      no_of_units: row.no_of_units ? parseInt(row.no_of_units) : null,
      escrow_agent_name: row.escrow_agent_name || null,
    };
  }).filter((record) => record.project_id !== null);

  console.log(`Mapped ${mappedRecords.length} valid records`);

  // Show sample transliterations
  console.log('\nSample transliterations:');
  rows.slice(0, 5).forEach((row, i) => {
    const original = row.project_name;
    const transliterated = mappedRecords[i]?.project_name || '';
    console.log(`  "${original}" -> "${transliterated}"`);
  });

  // Import in batches
  const batchSize = 100;
  let imported = 0;
  let failed = 0;

  console.log('\nImporting to Supabase...');

  for (let i = 0; i < mappedRecords.length; i += batchSize) {
    const batch = mappedRecords.slice(i, i + batchSize);

    const { error } = await supabase
      .from('projects')
      .upsert(batch, { onConflict: 'project_id' });

    if (error) {
      console.error(`\nBatch ${Math.floor(i / batchSize) + 1} error:`, error.message);
      failed += batch.length;
    } else {
      imported += batch.length;
      process.stdout.write(`\rImported ${imported} / ${mappedRecords.length} records`);
    }
  }

  console.log('\n\nImport complete!');
  console.log(`  Total: ${mappedRecords.length}`);
  console.log(`  Imported: ${imported}`);
  console.log(`  Failed: ${failed}`);
}

importProjects().catch(console.error);
