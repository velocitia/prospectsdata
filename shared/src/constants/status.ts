export const PROJECT_STATUSES = [
  'Completed',
  'Under Construction',
  'On Hold',
  'Planned',
  'Cancelled',
] as const;

export const COMPANY_TYPES = ['consultant', 'contractor', 'developer'] as const;

export const PROPERTY_TYPES = [
  'Residential',
  'Commercial',
  'Industrial',
  'Mixed Use',
  'Land',
] as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;
