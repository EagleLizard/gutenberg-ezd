
import { STRIPPED_EBOOKS_DIR_PATH } from '../../constants';
import { ScrapedBookWithFile } from '../../models/scraped-book';
import { mkdirIfNotExistRecursive } from '../../util/files';
import { getIntuitiveTimeString } from '../../util/print-util';
import { Timer } from '../../util/timer';
import { getTxtBookMeta } from '../fetch-books/books-meta-service';
import {
  stripBooks,
  StripBooksResult,
} from './strip-books';

export async function stripBooksMain() {
  let booksToStrip: ScrapedBookWithFile[];
  let stripTimer: Timer, stripMs: number;
  let stripBooksResult: StripBooksResult;
  console.log('!~ strip ~!');
  await initStripBooks();
  booksToStrip = await getBooksToStrip();
  console.log(`num books to strip: ${booksToStrip.length.toLocaleString()}`);

  console.log('stripGutenbergBooks_');
  console.log('');
  stripTimer = Timer.start();
  stripBooksResult = await stripBooks(booksToStrip);
  stripMs = stripTimer.stop();
  console.log('');
  console.log(`total lines: ${stripBooksResult.totalLineCount.toLocaleString()}`);
  console.log(`num books failed to strip: ${stripBooksResult.errCount.toLocaleString()}`);
  console.log(`failed with small print: ${stripBooksResult.smallPrintCount.toLocaleString()}`);
  console.log(`Stripped headers from ${stripBooksResult.parsedCount.toLocaleString()} books in ${getIntuitiveTimeString(stripMs)}`);
}

async function initStripBooks() {
  await mkdirIfNotExistRecursive(STRIPPED_EBOOKS_DIR_PATH);
}

async function getBooksToStrip(): Promise<ScrapedBookWithFile[]> {
  let booksMeta: ScrapedBookWithFile[], booksToStrip: ScrapedBookWithFile[];
  booksMeta = await getTxtBookMeta();

  /*
    Optionally apply filter, mostly just used for debugging
      the strip algo
  */
  const testBookFilter = (bookMeta: ScrapedBookWithFile) => {
    return (
      // bookMeta.fileName.startsWith('p')
      bookMeta.fileName.includes('the-art-of-war-by-active-6th-century-bc-sunzi')
      // || bookMeta.fileName.includes('art-of-war')
      || true
    );
  };
  booksToStrip = booksMeta.filter(testBookFilter);
  return booksToStrip;
}
