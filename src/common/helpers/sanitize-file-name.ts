export const sanitizeFileName = (str: string): string => {
  const fixUtf8BrokenString = (input: string): string =>
    Buffer.from(input, 'latin1').toString('utf8');

  const fixed = fixUtf8BrokenString(str.trim());

  const nameWithoutExt = fixed.replace(/\.[^/.]+$/, '');

  return nameWithoutExt
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
};
