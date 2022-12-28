
import { ScrapedBookWithFile } from '../../models/scraped-book';
import { getIntuitiveTimeString } from '../../util/print-util';
import { Timer } from '../../util/timer';
import {
  CharCountParseCbResult,
  charCountParse,
} from './parse-char-count';

export async function parseCharCountsSync(books: ScrapedBookWithFile[], baseDir: string) {
  let doneCount: number, totalCharCount: number, totalLineCount: number;
  let donePrintMod: number;
  let parseTimer: Timer, parseMs: number;

  totalCharCount = 0;
  totalLineCount = 0;
  doneCount = 0;

  donePrintMod = Math.ceil(books.length / 70);

  const doneCb = (opts: CharCountParseCbResult) => {
    doneCount++;
    totalCharCount += opts.charCount;
    totalLineCount += opts.lineCount;
    if((doneCount % donePrintMod) === 0) {
      process.stdout.write('+');
    }
  };

  console.log(`parsing charCounts of ${books.length.toLocaleString()} books...`);

  parseTimer = Timer.start();

  for(let i = 0; i < books.length; ++i) {
    let currBook: ScrapedBookWithFile;
    currBook = books[i];
    await charCountParse({
      book: currBook,
      bookDir: baseDir,
      doneCb,
    });
  }

  parseMs = parseTimer.stop();

  console.log('');
  console.log(`parsed ${doneCount.toLocaleString()} books in ${getIntuitiveTimeString(parseMs)}`);
  console.log(`totalLines: ${totalLineCount.toLocaleString()}`);
  console.log(`totalChars: ${totalCharCount.toLocaleString()}`);
}
