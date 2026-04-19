import { en } from './en';
import { vi } from './vi';
import { Locale, SiteCopy } from './types';

export const content: Record<Locale, SiteCopy> = {
  en,
  vi,
};

export type { Locale, ReviewContent, SiteCopy } from './types';
