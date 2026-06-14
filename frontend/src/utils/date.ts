// SQLite / EF Core returns datetimes without the 'Z' suffix.
// Appending 'Z' forces the browser to parse them as UTC,
// then toLocaleString() converts to the user's local timezone automatically.
const asUtc = (s: string) =>
  s.endsWith('Z') || s.includes('+') ? s : s + 'Z';

export const formatDateTime = (s: string) =>
  new Date(asUtc(s)).toLocaleString();

export const formatDate = (s: string) =>
  new Date(asUtc(s)).toLocaleDateString();
