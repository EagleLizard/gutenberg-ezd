
import path from 'path';

import * as puppeteer from 'puppeteer';

import {
  DATA_DIR_PATH,
} from '../../constants';
import {
  scrapeTop100,
  scrapeTop1000,
} from './scrape-top/scrape-top';
import { mkdirIfNotExistRecursive } from '../../util/files';
import { MAX_CONCURRENT_PAGES } from './scrape-top/scrape-pages';

type GetPuppeteerLaunchArgsParams = {
  viewportWidth: number;
  viewportHeight: number;
};

export async function scrapeMain() {
  let browser: puppeteer.Browser, launchArgs: string[];
  let viewportWidth: number, viewportHeight: number;
  console.log(`MAX_CONCURRENT_PAGES: ${MAX_CONCURRENT_PAGES}`);
  console.log('!~ scrape ~!');

  await initScrape();

  viewportWidth = 640;
  viewportHeight = 384;
  launchArgs = getPuppeteerLaunchArgs({
    viewportWidth,
    viewportHeight,
  });
  browser = await puppeteer.launch({
    headless: true,
    args: launchArgs,
    defaultViewport: {
      width: viewportWidth,
      height: viewportHeight,
    },
    userDataDir: `${DATA_DIR_PATH}${path.sep}chromium_user`
  });

  await scrapeTop100(browser);
  await scrapeTop1000(browser);

  await browser.close();
}

async function initScrape() {
  await mkdirIfNotExistRecursive(DATA_DIR_PATH);
}

function getPuppeteerLaunchArgs(params: GetPuppeteerLaunchArgsParams): string[] {
  let args: string[];
  args = [
    '--no-sandbox',
    '--single-process',
    `--window-size=${params.viewportWidth},${params.viewportHeight}`,
    '--disable-notifications',
    // '--disable-gpu',
    // '--disable-accelerated-2d-canvas',
  ];
  return args;
}
