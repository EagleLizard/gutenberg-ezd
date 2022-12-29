
import { ScrapedBookWithFile } from '../../models/scraped-book';
import { mkdirIfNotExistRecursive } from '../../util/files';
import { getIntuitiveTimeString } from '../../util/print-util';
import { Timer } from '../../util/timer';
import {
  WordParseCbResult,
  wordParse,
} from './word-parse';
import { WORD_COUNT_OUT_DIR_PATH } from './parse-books-constants';
import path from 'path';
import { writeFile } from 'fs/promises';

type ParseWordResult = {
  book: ScrapedBookWithFile;
  wordCountMap: Record<string, number>;
};

export async function parseWordCountsSync(books: ScrapedBookWithFile[], baseDir: string) {
  let doneCount: number, totalWordCount: number;
  let parseWordResults: ParseWordResult[];
  let donePrintMod: number;
  let parseTimer: Timer, parseMs: number;

  await initParseWordCounts();

  totalWordCount = 0;
  doneCount = 0;
  parseWordResults = [];

  donePrintMod = Math.ceil(books.length / 70);

  console.log(`parsing line & char counts of ${books.length.toLocaleString()} books...`);

  parseTimer = Timer.start();

  for(let i = 0; i < books.length; ++i) {
    let currBook: ScrapedBookWithFile;
    let currWordCountMap: Record<string, number>;
    let parseWordResult: ParseWordResult;
    currBook = books[i];

    const doneCb = (opts: WordParseCbResult) => {
      doneCount++;
      if((doneCount % donePrintMod) === 0) {
        process.stdout.write('+');
      }
      totalWordCount += opts.wordCount;
      currWordCountMap = opts.wordCountMap;
    };

    await wordParse({
      book: currBook,
      bookDir: baseDir,
      doneCb,
    });

    // parseWordResult = {
    //   book: currBook,
    //   wordCountMap: currWordCountMap,
    // };
    // parseWordResults.push(parseWordResult);
  }

  parseMs = parseTimer.stop();

  // for(let i = 0; i < parseWordResults.length; ++i) {
  //   let currParseWordResult: ParseWordResult;
  //   currParseWordResult = parseWordResults[i];
  //   await writeWordCountMapFile(currParseWordResult.book, currParseWordResult.wordCountMap);
  // }

  console.log('');
  console.log(`parsed ${doneCount.toLocaleString()} books in ${getIntuitiveTimeString(parseMs)}`);
  console.log(`totalWords: ${totalWordCount.toLocaleString()}`);
}

async function initParseWordCounts() {
  await mkdirIfNotExistRecursive(WORD_COUNT_OUT_DIR_PATH);
}

async function writeWordCountMapFile(book: ScrapedBookWithFile, wordCountMap: Record<string, number>) {
  let wordCountTuples: [ string, number ][], sortedWordCountKeys: string[];
  let outFileName: string, outFilePath: string, outFileData: string;
  wordCountTuples = Object.keys(wordCountMap).map(wordCountMapKey => {
    return [
      wordCountMapKey,
      wordCountMap[wordCountMapKey],
    ];
  });
  wordCountTuples.sort((a, b) => {
    let aCount: number, bCount: number;
    aCount = a[1];
    bCount = b[1];
    if(aCount > bCount) {
      return -1;
    } else if(aCount < bCount) {
      return 1;
    } else {
      return 0;
    }
  });
  sortedWordCountKeys = wordCountTuples.map(wordCountTuple => wordCountTuple[0]);
  outFileName = `${book.fileName}.json`;
  outFilePath = [
    WORD_COUNT_OUT_DIR_PATH,
    outFileName,
  ].join(path.sep);
  outFileData = JSON.stringify(wordCountMap, sortedWordCountKeys, 2);
  await writeFile(outFilePath, outFileData);
}
