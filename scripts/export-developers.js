// Run with: node scripts/export-developers.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '../web/.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function cleanDeveloperName(name) {
  let cleaned = name
    // Remove LLC, SOC, Branch and other variations
    .replace(/\s*-?\s*L\.?L\.?C\.?$/i, '')
    .replace(/\s*-?\s*S\.?O\.?C\.?$/i, '')
    .replace(/\s*-?\s*BRANCH$/i, '')
    .replace(/\s*-?\s*LIMITED$/i, '')
    .replace(/\s*-?\s*LTD\.?$/i, '')
    .replace(/\s*-?\s*FZCO\.?$/i, '')
    .replace(/\s*-?\s*FZC\.?$/i, '')
    .replace(/\s*-?\s*FZE\.?$/i, '')
    .replace(/\s*-?\s*PJSC\.?$/i, '')
    .replace(/\s*-?\s*PVT\.?\s*LTD\.?$/i, '')
    .replace(/\s*-?\s*PRIVATE\s+LIMITED$/i, '')
    .replace(/\s*-?\s*INC\.?$/i, '')
    .replace(/\s*-?\s*CORP\.?$/i, '')
    .replace(/\s*-?\s*CO\.?$/i, '')
    // Remove - BRANCH or (BRANCH) anywhere
    .replace(/\s*-?\s*\(?BRANCH\)?/gi, '')
    .trim();

  // If contains DEVELOPMENT(S) or DEVELOPER(S), remove REAL ESTATE
  if (/DEVELOP(MENT|ER)S?/i.test(cleaned)) {
    cleaned = cleaned.replace(/REAL\s+ESTATE\s*&?\s*/gi, '');
  }
  // Otherwise keep REAL ESTATE as is

  // Clean up extra spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

async function exportDevelopers() {
  console.log('Fetching developers from companies table...');

  const { data, error } = await supabase
    .from('companies')
    .select('name_en')
    .eq('type', 'developer')
    .not('name_en', 'is', null)
    .order('name_en');

  if (error) {
    console.error('Error fetching developers:', error);
    process.exit(1);
  }

  // Clean names for Gemini
  const names = data.map(d => cleanDeveloperName(d.name_en));

  // Remove duplicates after cleaning
  const uniqueNames = [...new Set(names)].filter(n => n.length > 0).sort();

  const output = {
    instruction: "For each Dubai UAE real estate developer company below, find publicly available information. Return as JSON array where each object has: name (exact match), email, phone, website, address, emirate, established_year, employees_range (1-10/11-50/51-200/201-500/500+), description, specializations (array like ['Residential','Commercial']), key_people (array of {name,role}), social_links ({linkedin,twitter}). Only include fields where you find actual data. Skip companies you can't find info for.",
    developers: uniqueNames
  };

  const outputPath = path.join(__dirname, 'developers-for-gemini.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log(`Exported ${uniqueNames.length} developers to ${outputPath}`);
}

exportDevelopers();
