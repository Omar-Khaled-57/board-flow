export const generateId = (length = 7) =>
  Math.random().toString(36).substring(2, 2 + length);
