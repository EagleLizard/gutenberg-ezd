
import { EBOOKS_DATA_DIR_PATH } from '../../constants';
import { ScrapedBookWithFile } from '../../models/scraped-book';
import {
  checkFile,
  mkdirIfNotExistRecursive,
} from '../../util/files';
import { getIntuitiveTimeString } from '../../util/print-util';
import {
  getScrapedBookFilePath,
  getScrapedBooksMeta,
  writeTxtBookMeta,
} from './books-meta-service';
import {
  downloadBooks,
  DownloadBookCbError,
  DownloadBooksResult,
  DownloadBookCbResult,
} from './books-service';

export async function fetchBooksMain() {
  let booksToDownload: ScrapedBookWithFile[], downloadedBooks: ScrapedBookWithFile[];
  console.log('!~ fetch ~!');
  await initFetchBooks();
  booksToDownload = await getBooksToDownload();
  downloadedBooks = await fetchEBooks(booksToDownload);
  await writeTxtBookMeta(downloadedBooks);
}

async function initFetchBooks() {
  await mkdirIfNotExistRecursive(EBOOKS_DATA_DIR_PATH);
}

async function getBooksToDownload(): Promise<ScrapedBookWithFile[]> {
  let scrapedBooksMeta: ScrapedBookWithFile[], booksToDownload: ScrapedBookWithFile[];
  scrapedBooksMeta = await getScrapedBooksMeta();
  booksToDownload = [];
  for(let i = 0; i < scrapedBooksMeta.length; ++i) {
    let scrapedBook: ScrapedBookWithFile, fileExists: boolean;
    let scrapedBookFilePath: string;
    scrapedBook = scrapedBooksMeta[i];
    scrapedBookFilePath = getScrapedBookFilePath(scrapedBook);
    fileExists = await checkFile(scrapedBookFilePath);
    if(
      !fileExists
    ) {
      booksToDownload.push(scrapedBook);
    }
  }
  return booksToDownload;
}

async function fetchEBooks(booksToDownload: ScrapedBookWithFile[]): Promise<ScrapedBookWithFile[]> {
  let booksDownloaded: ScrapedBookWithFile[], downloadBooksResult: DownloadBooksResult;
  let doneCount: number;

  const donePrintMod = Math.ceil(booksToDownload.length / 150);
  const donePercentPrintMod = Math.ceil(booksToDownload.length / 13);

  doneCount = 0;
  booksDownloaded = [];

  const doneCb = (err: DownloadBookCbError, res: DownloadBookCbResult) => {
    let donePercent: number;
    doneCount++;
    if(err) {
      process.stdout.write(`ST${err?.status}x`);
    } else {
      booksDownloaded.push(res.book);
    }
    if((doneCount % donePercentPrintMod) === 0) {
      donePercent = doneCount / booksToDownload.length;
      process.stdout.write(`${Math.round(donePercent * 100)}%`);
    } else if((doneCount % donePrintMod) === 0) {
      process.stdout.write('.');
    }
  };

  console.log(`scrapedBooksToDownload: ${booksToDownload.length.toLocaleString()}`);
  downloadBooksResult = await downloadBooks(booksToDownload, doneCb);
  console.log('');
  console.log(`Downloaded ${booksDownloaded.length.toLocaleString()} books in ${getIntuitiveTimeString(downloadBooksResult.ms)}`);

  return booksDownloaded;
}
