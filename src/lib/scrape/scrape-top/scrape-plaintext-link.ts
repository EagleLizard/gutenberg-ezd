
import * as puppeteer from 'puppeteer';

import { ScrapedBook } from '../../../models/scraped-book';
import { pageInterceptHandler } from './page-intercept';

export function getPlaintextLinkMemo(): (browser: puppeteer.Browser, bookLink: string, rank: number) => Promise<ScrapedBook> {
  let scrapedBookCache: Record<string, ScrapedBook>;
  scrapedBookCache = {};
  return async (browser: puppeteer.Browser, bookLink: string, rank: number): Promise<ScrapedBook> => {
    let scrapedBook: ScrapedBook;
    if(scrapedBookCache[bookLink] === undefined) {
      scrapedBook = await getPlaintextLink(browser, bookLink, rank);
      scrapedBookCache[bookLink] = scrapedBook;
    } else {
      scrapedBook = scrapedBookCache[bookLink];
    }
    return {
      ...scrapedBook,
      rank,
    };
  };
}

async function getPlaintextLink(browser: puppeteer.Browser, bookLink: string, rank: number): Promise<ScrapedBook> {
  let page: puppeteer.Page, title: string, plainTextLink: string;
  page = await browser.newPage();

  await page.setRequestInterception(true);
  page.on('request', pageInterceptHandler);
  await page.goto(bookLink);
  await page.waitForSelector('div.page_content');
  [ title, plainTextLink ] = await page.evaluate(() => {
    let anchorEl: HTMLAnchorElement | null, titleEl: HTMLElement | null;
    let anchorLink: string | undefined, titleText: string;
    titleEl = document.querySelector('div.page_content [itemprop=\'name\']');
    anchorEl = document.querySelector('tr td[content*=\'text/plain\'] a');
    titleText = titleEl.textContent;
    anchorLink = (anchorEl === null)
      ? undefined
      : anchorEl.href
    ;

    return [
      titleText,
      anchorLink,
    ];
  });

  await page.close();

  // await sleep(100);

  plainTextLink = plainTextLink ?? undefined;

  return {
    title,
    plaintextUrl: plainTextLink,
    pageUrl: bookLink,
    rank,
  };
}
