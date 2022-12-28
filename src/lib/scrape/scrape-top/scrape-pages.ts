
import { writeFile } from 'fs/promises';
import path from 'path';
import os from 'os';

import * as puppeteer from 'puppeteer';

import { getPlaintextLinkMemo } from './scrape-plaintext-link';
import { sleep } from '../../../util/sleep';
import { getCurrentDateString } from '../../../util/date-time';
import { getIntuitiveTimeString } from '../../../util/print-util';
import { Timer } from '../../../util/timer';

import {
  TOP_LISTS_ENUM,
  TOP_LISTS_FILE_PREFIX_MAP,
  TOP_LISTS_ID_MAP,
  TOP_LIST_ENUM_ARR,
  TOP_PAGES_ENUM,
  TOP_PAGES_FILE_PREFIX_MAP,
} from '../scrape-constants';
import { ScrapedBook } from '../../../models/scraped-book';
import { mkdirIfNotExistRecursive } from '../../../util/files';
import { SCRAPED_EBOOKS_DIR_PATH, SCRAPED_EBOOKS_FILE_NAME, SCRAPED_EBOOKS_NOT_FOUND_FILE_NAME } from '../../../constants';

const NUM_CPUS = os.cpus().length;
export const MAX_CONCURRENT_PAGES = NUM_CPUS - 1;

export async function scrapePages(
  browser: puppeteer.Browser,
  topPageType: TOP_PAGES_ENUM,
  topBookLists: Record<string, string[]>,
) {

  let totalBooksScraped: number;
  let scrapeTimer: Timer, scrapeMs: number;

  const _getPlainText = getPlaintextLinkMemo();
  const currDateStr = getCurrentDateString();

  totalBooksScraped = 0;

  scrapeTimer = Timer.start();

  for(let i = 0; i < TOP_LIST_ENUM_ARR.length; ++i) {
    let currTopListEnum: TOP_LISTS_ENUM, currTopListKey: string, currTopListLinks: string[];
    let scrapeTopListPagesResult: ScrapeTopListPagesResult;
    currTopListEnum = TOP_LIST_ENUM_ARR[i];
    currTopListKey = TOP_LISTS_ID_MAP[currTopListEnum];
    currTopListLinks = topBookLists[currTopListKey];

    console.log(currTopListKey);

    scrapeTopListPagesResult = await scrapeTopListPages({
      browser,
      topListEnum: currTopListEnum,
      topListLinks: currTopListLinks,
      getPlainTextLink: _getPlainText,
    });
    await writeScrapedBooksFile(
      currTopListEnum,
      topPageType,
      currDateStr,
      scrapeTopListPagesResult.scrapedBooks,
      scrapeTopListPagesResult.notFoundScrapedBooks,
    );
    totalBooksScraped += scrapeTopListPagesResult.completedScrapeTasks;
  }

  scrapeMs = scrapeTimer.stop();

  console.log(`scraped ${totalBooksScraped.toLocaleString()} books in ${getIntuitiveTimeString(scrapeMs)}`);
}

type ScrapeTopListPagesOpts = {
  browser: puppeteer.Browser;
  topListEnum: TOP_LISTS_ENUM;
  topListLinks: string[];
  getPlainTextLink: (
    browser: puppeteer.Browser,
    bookLink: string,
    rank: number,
  ) => Promise<ScrapedBook>;
};

type ScrapeTopListPagesResult = {
  completedScrapeTasks: number;
  scrapedBooks: ScrapedBook[];
  notFoundScrapedBooks: ScrapedBook[];
};

async function scrapeTopListPages(opts: ScrapeTopListPagesOpts): Promise<ScrapeTopListPagesResult> {
  let scrapedBooks: ScrapedBook[], notFoundScrapedBooks: ScrapedBook[];
  let runningScrapeTasks: number, completedScrapeTasks: number;
  let scrapeTopListPagesResult: ScrapeTopListPagesResult;

  scrapedBooks = [];
  notFoundScrapedBooks = [];
  runningScrapeTasks = 0;
  completedScrapeTasks = 0;

  for(let i = 0; i < opts.topListLinks.length; ++i) {
    let currBookLink: string, currBookRank: number;
    currBookLink = opts.topListLinks[i];
    currBookRank = i + 1;
    while(runningScrapeTasks >= MAX_CONCURRENT_PAGES) {
      await sleep(10);
    }
    runningScrapeTasks++;

    (async () => {
      let scrapedBook: ScrapedBook;
      let hasWaitForError: boolean;
      hasWaitForError = false;
      try {
        scrapedBook = await opts.getPlainTextLink(opts.browser, currBookLink, currBookRank);
      } catch(e) {
        if(e instanceof puppeteer.TimeoutError) {
          hasWaitForError = true;
          scrapedBook = {
            plaintextUrl: undefined,
            title: undefined,
            rank: currBookRank,
            pageUrl: currBookLink,
          };
        } else {
          throw e;
        }
      }
      if(
        (scrapedBook.plaintextUrl === undefined)
        || hasWaitForError
      ) {
        notFoundScrapedBooks.push(scrapedBook);
      } else {
        scrapedBooks.push(scrapedBook);
      }
      completedScrapeTasks++;
      if((completedScrapeTasks % 10) === 0) {
        process.stdout.write('.');
      }
      if(hasWaitForError) {
        process.stdout.write('x');
      }
      runningScrapeTasks--;
    })();
  }
  while(runningScrapeTasks > 0) {
    await sleep(10);
  }
  console.log('');

  scrapeTopListPagesResult = {
    completedScrapeTasks,
    scrapedBooks,
    notFoundScrapedBooks,
  };

  return scrapeTopListPagesResult;
}

async function writeScrapedBooksFile(
  topListType: TOP_LISTS_ENUM,
  topPageType: TOP_PAGES_ENUM,
  dateStr: string,
  scrapedBooks: ScrapedBook[],
  notFoundScrapedBooks: ScrapedBook[]
) {
  let scrapedBooksFileName: string, scrapedBooksFilePath: string;
  let notFoundScrapedBooksFileName: string, notFoundScrapedBooksFilePath: string;
  let topListFilePrefix: string, topPageFilePrefix: string;
  await mkdirIfNotExistRecursive(SCRAPED_EBOOKS_DIR_PATH);
  topListFilePrefix = TOP_LISTS_FILE_PREFIX_MAP[topListType];
  topPageFilePrefix = TOP_PAGES_FILE_PREFIX_MAP[topPageType];
  scrapedBooksFileName = `${dateStr}_${topPageFilePrefix}_${topListFilePrefix}_${SCRAPED_EBOOKS_FILE_NAME}`;
  notFoundScrapedBooksFileName = `${dateStr}_${topPageFilePrefix}_${topListFilePrefix}_${SCRAPED_EBOOKS_NOT_FOUND_FILE_NAME}`;
  scrapedBooksFilePath = [
    SCRAPED_EBOOKS_DIR_PATH,
    scrapedBooksFileName,
  ].join(path.sep);
  notFoundScrapedBooksFilePath = [
    SCRAPED_EBOOKS_DIR_PATH,
    notFoundScrapedBooksFileName,
  ].join(path.sep);

  await writeFile(scrapedBooksFilePath, JSON.stringify(scrapedBooks, null, 2));
  await writeFile(notFoundScrapedBooksFilePath, JSON.stringify(notFoundScrapedBooks, null, 2));
}
