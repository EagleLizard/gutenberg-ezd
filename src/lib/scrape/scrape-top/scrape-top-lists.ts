
import * as puppeteer from 'puppeteer';

import {
  TOP_LISTS_ID_MAP,
  TOP_PAGES_ENUM,
  TOP_PAGES_URL_MAP,
} from '../scrape-constants';
import { pageInterceptHandler } from './page-intercept';

const TOP_LIST_WAIT_SELECTOR = 'ol > a[href=\'#authors-last30\']';

export async function scrapeTopBookLists(
  browser: puppeteer.Browser,
  topPageType: TOP_PAGES_ENUM
): Promise<Record<string, string[]>> {
  let page: puppeteer.Page;
  let topPageUrl: string;
  let bookListLinksMap: Record<string, string[]>;
  let expectedTopListIds: string[];

  topPageUrl = TOP_PAGES_URL_MAP[topPageType];
  page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', pageInterceptHandler);
  await page.goto(topPageUrl);
  await page.waitForSelector(TOP_LIST_WAIT_SELECTOR);

  bookListLinksMap = await page.evaluate(() => {
    let listMap: Record<string, string[]>;
    let bookLists: HTMLElement[] = [
      ...document.querySelectorAll('ol')
    ].filter(el => el.querySelector('li a[href^=\'/ebooks/\']') !== null);
    let listTitleIds = bookLists
      .map(el => el.previousElementSibling)
      .map(el => el.querySelector('[id^="books-last"]').getAttribute('id'))
    ;
    listMap = {};
    listMap = listTitleIds.reduce((acc, curr, idx) => {
      let currListBookLinks: string[];
      currListBookLinks = [
        ...bookLists[idx].querySelectorAll('li a[href^=\'/ebooks/\']')
      ].map((anchorEl: HTMLAnchorElement) => {
        return anchorEl.href;
      });
      acc[curr] = currListBookLinks;
      return acc;
    }, listMap);

    return listMap;
  });

  expectedTopListIds = [ ...Object.values(TOP_LISTS_ID_MAP) ];
  expectedTopListIds.forEach((expectedTopListId) => {
    let foundNonStringIdx: number, bookListLinks: string[];
    bookListLinks = bookListLinksMap[expectedTopListId];
    if(!Array.isArray(bookListLinks)) {
      throw new Error(`Did not scrape expected list for "${expectedTopListId}"`);
    }
    foundNonStringIdx = bookListLinks.findIndex(listLink => {
      return (typeof listLink) !== 'string';
    });

    if(foundNonStringIdx !== -1) {
      const foundNonStringBookLink = bookListLinks[foundNonStringIdx];
      console.error('foundNonStringBookLink');
      console.error(foundNonStringBookLink);
      throw new Error(`Unexpected type in bookLink list "${expectedTopListId}" at index ${foundNonStringIdx}. Expected 'string', received: ${typeof foundNonStringBookLink}`);
    }
  });

  await page.close();
  return bookListLinksMap;
}
