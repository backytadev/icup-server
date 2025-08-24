import * as bcrypt from 'bcrypt';

export const generateCodeMinistry = (name: string) => {
  const newName = name?.trim();
  if (!newName) throw new Error('Name is required to generate ministry code');

  const initials = newName
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase())
    .join('');

  const groupedInitials = initials.match(/.{1,2}/g)?.join('-') ?? initials;

  const hash = bcrypt.hashSync(name, 10);
  const shortHash = hash.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6);

  return `${groupedInitials}-${shortHash}`;
};
