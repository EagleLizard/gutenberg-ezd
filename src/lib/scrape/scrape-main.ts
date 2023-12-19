
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

enum SCRAPE_ARGS {
  TOP_100 = 'TOP_100',
  TOP_1000 = 'TOP_1000',
}

const SCRAPE_ARG_MAP: Record<SCRAPE_ARGS, string> = {
  [SCRAPE_ARGS.TOP_100]: '100',
  [SCRAPE_ARGS.TOP_1000]: '1k',
};

type GetPuppeteerLaunchArgsParams = {
  viewportWidth: number;
  viewportHeight: number;
};

export async function scrapeMain(scrapeArgs: string[]) {
  let browser: puppeteer.Browser, launchArgs: string[];
  let viewportWidth: number, viewportHeight: number;
  let scrapeArg: string;
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

  scrapeArg = scrapeArgs[0] ?? '';

  console.log(scrapeArg);

  switch(scrapeArg) {
    case SCRAPE_ARG_MAP.TOP_1000:
      await scrapeTop1000(browser);
      break;
    case SCRAPE_ARG_MAP.TOP_100:
    default:
      // handles the default case if invalid
      if(scrapeArg.trim() !== '') {
        throw new Error(`Invalid scrape argument: '${scrapeArg}'`);
      }
      await scrapeTop100(browser);
  }

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
