import { categories } from '../data/catalog';
import { FILTER } from './index';

export const COLLECTION_LINKS = categories.map((category) => [category.name, category.name]);
export const HEADER_LINKS = [
  ['Shop All', FILTER.ALL],
  ...COLLECTION_LINKS,
  [FILTER.NEW, FILTER.NEW],
  [FILTER.TRENDING, FILTER.TRENDING],
  [FILTER.OFFERS, FILTER.OFFERS],
];
export const FOOTER_LINKS = [
  ['Shop collection', FILTER.ALL],
  ...COLLECTION_LINKS,
  ['New arrivals', FILTER.NEW],
  ['Best offers', FILTER.OFFERS],
];
export const SHOP_FILTERS = [
  FILTER.ALL,
  FILTER.TRENDING,
  FILTER.NEW,
  FILTER.OFFERS,
  ...categories.map((category) => category.name),
];
