
import * as puppeteer from 'puppeteer';

import { scrapeTopBookLists } from './scrape-top-lists';
import { scrapePages } from './scrape-pages';

import {
  TOP_PAGES_ENUM,
} from '../scrape-constants';

export async function scrapeTop100(browser: puppeteer.Browser) {
  console.log('Scraping top100');
  await scrapeTopPage(browser, TOP_PAGES_ENUM.TOP_100);
}

export async function scrapeTop1000(browser: puppeteer.Browser) {
  console.log('Scraping top1k');
  return scrapeTopPage(browser, TOP_PAGES_ENUM.TOP_1000);
}

async function scrapeTopPage(browser: puppeteer.Browser, topPageType: TOP_PAGES_ENUM) {
  let scrapeTopListResult: Record<string, string[]>;

  scrapeTopListResult = await scrapeTopBookLists(browser, topPageType);
  await scrapePages(browser, topPageType, scrapeTopListResult);
}
