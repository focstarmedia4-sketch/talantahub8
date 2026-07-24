/**
 * Formats a timeline/post timestamp dynamically.
 * - Under 60 minutes: "X mins ago" / "1 min ago"
 * - Under 24 hours: "X hours ago" / "1 hour ago"
 * - Under 7 days: "X days ago" / "1 day ago"
 * - After 7 days: "YYYY-MM-DD"
 */
export const formatTimelineTime = (timestamp: string): string => {
  if (!timestamp) return '';

  if (timestamp === 'Just now') {
    return '1 min ago';
  }

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    return timestamp;
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  // If clock differences place it in the future, show 1 min ago
  if (diffMs < 0) {
    return '1 min ago';
  }

  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) {
    return '1 min ago';
  }
  if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? 'min' : 'mins'} ago`;
  }

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays <= 7) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  }

  // Exact date format: YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
