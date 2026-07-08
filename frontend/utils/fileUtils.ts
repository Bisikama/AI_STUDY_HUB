export const getCleanFileType = (mimeType: string) => {
  if (!mimeType) return 'UNKNOWN';
  const lower = mimeType.toLowerCase();
  if (lower.includes('pdf')) return 'PDF';
  if (lower.includes('wordprocessingml') || lower.includes('msword')) return 'DOCX';
  if (lower.includes('presentationml') || lower.includes('powerpoint')) return 'PPTX';
  if (lower.includes('spreadsheetml') || lower.includes('excel')) return 'XLSX';
  // Nếu là file khác, lấy đoạn ngắn sau dấu '/'
  return mimeType.split('/')[1]?.toUpperCase().substring(0, 8) || 'FILE';
};
