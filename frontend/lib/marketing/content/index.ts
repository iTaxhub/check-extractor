import type { MarketingPage, Section } from '../types';
import { FEATURE_PAGES } from './features';
import { AUDIENCE_PAGES } from './audiences';
import { LOCALE_PAGES } from './locales';
import { COMPARE_PAGES } from './compare';
import { GUIDE_PAGES } from './guides';

export const PAGES: MarketingPage[] = [
  ...FEATURE_PAGES,
  ...AUDIENCE_PAGES,
  ...LOCALE_PAGES,
  ...COMPARE_PAGES,
  ...GUIDE_PAGES,
];

export const pagesIn = (section: Section) => PAGES.filter((p) => p.section === section);

export const findPage = (section: Section, slug: string) =>
  PAGES.find((p) => p.section === section && p.slug === slug);
