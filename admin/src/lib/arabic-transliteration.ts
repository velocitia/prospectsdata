// Arabic to English transliteration mapping
// Based on common romanization standards for Arabic script

const arabicToEnglishMap: Record<string, string> = {
  // Arabic letters
  'ا': 'a',
  'أ': 'a',
  'إ': 'i',
  'آ': 'aa',
  'ب': 'b',
  'ت': 't',
  'ث': 'th',
  'ج': 'j',
  'ح': 'h',
  'خ': 'kh',
  'د': 'd',
  'ذ': 'dh',
  'ر': 'r',
  'ز': 'z',
  'س': 's',
  'ش': 'sh',
  'ص': 's',
  'ض': 'd',
  'ط': 't',
  'ظ': 'z',
  'ع': 'a',
  'غ': 'gh',
  'ف': 'f',
  'ق': 'q',
  'ك': 'k',
  'ل': 'l',
  'م': 'm',
  'ن': 'n',
  'ه': 'h',
  'و': 'w',
  'ي': 'y',
  'ى': 'a',
  'ة': 'a',
  'ء': '',

  // Arabic diacritics (optional, usually ignored in transliteration)
  'َ': 'a',  // fatha
  'ِ': 'i',  // kasra
  'ُ': 'u',  // damma
  'ْ': '',   // sukun
  'ّ': '',   // shadda (doubling) - handled separately
  'ً': 'an', // tanwin fath
  'ٍ': 'in', // tanwin kasr
  'ٌ': 'un', // tanwin damm

  // Arabic-Indic numerals
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',

  // Common ligatures
  'لا': 'la',
  'لأ': 'la',
  'لإ': 'li',
  'لآ': 'laa',
};

// Check if a string contains Arabic characters
export function containsArabic(text: string): boolean {
  // Arabic Unicode range: \u0600-\u06FF (Arabic), \u0750-\u077F (Arabic Supplement)
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F]/;
  return arabicPattern.test(text);
}

// Transliterate Arabic text to English
export function transliterateArabicToEnglish(text: string): string {
  if (!text || !containsArabic(text)) {
    return text;
  }

  let result = '';
  let i = 0;

  while (i < text.length) {
    // Check for two-character ligatures first
    if (i < text.length - 1) {
      const twoChar = text.slice(i, i + 2);
      if (arabicToEnglishMap[twoChar]) {
        result += arabicToEnglishMap[twoChar];
        i += 2;
        continue;
      }
    }

    const char = text[i];

    // Handle shadda (doubling the previous consonant)
    if (char === 'ّ' && result.length > 0) {
      result += result[result.length - 1];
      i++;
      continue;
    }

    // Check if character is in our map
    if (arabicToEnglishMap[char] !== undefined) {
      result += arabicToEnglishMap[char];
    } else if (containsArabic(char)) {
      // Unknown Arabic character, skip or use placeholder
      result += '';
    } else {
      // Non-Arabic character, keep as is
      result += char;
    }

    i++;
  }

  // Clean up the result
  result = result
    .replace(/\s+/g, ' ')           // Normalize whitespace
    .replace(/([a-z])\1{2,}/gi, '$1$1') // Max 2 consecutive same letters
    .trim();

  // Capitalize first letter of each word
  result = result.replace(/\b\w/g, (char) => char.toUpperCase());

  return result;
}

// Process a batch of records, transliterating specified columns
export function transliterateRecords(
  records: Record<string, unknown>[],
  columnsToTransliterate: string[]
): Record<string, unknown>[] {
  return records.map((record) => {
    const transliteratedRecord = { ...record };

    for (const column of columnsToTransliterate) {
      const value = record[column];
      if (typeof value === 'string' && containsArabic(value)) {
        transliteratedRecord[column] = transliterateArabicToEnglish(value);
      }
    }

    return transliteratedRecord;
  });
}
