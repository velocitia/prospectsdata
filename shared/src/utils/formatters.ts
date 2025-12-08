export function formatDate(date: string | null | undefined): string {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
}

export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '-';
  return num.toLocaleString('en-US');
}

export function formatArea(area: number | null | undefined): string {
  if (area === null || area === undefined) return '-';
  return `${area.toLocaleString('en-US')} sq ft`;
}

export function formatPercentage(percent: number | null | undefined): string {
  if (percent === null || percent === undefined) return '-';
  return `${percent}%`;
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function truncateText(text: string | null | undefined, maxLength: number): string {
  if (!text) return '-';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

export function capitalizeFirst(text: string | null | undefined): string {
  if (!text) return '-';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function getStatusColor(status: string | null | undefined): string {
  if (!status) return 'gray';
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus.includes('completed') || normalizedStatus.includes('done')) {
    return 'green';
  }
  if (normalizedStatus.includes('progress') || normalizedStatus.includes('ongoing')) {
    return 'blue';
  }
  if (normalizedStatus.includes('pending') || normalizedStatus.includes('planned')) {
    return 'yellow';
  }
  if (normalizedStatus.includes('cancelled') || normalizedStatus.includes('stopped')) {
    return 'red';
  }
  return 'gray';
}
