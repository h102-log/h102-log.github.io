export function formatDateToYmd(date: string): string {
  // 이미 yyyy-mm-dd 형식이면 그대로 사용합니다.
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toISOString().slice(0, 10);
}
