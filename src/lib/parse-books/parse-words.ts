
import { ScrapedBookWithFile } from '../../models/scraped-book';
import { mkdirIfNotExistRecursive } from '../../util/files';
import { getIntuitiveTimeString } from '../../util/print-util';
import { Timer } from '../../util/timer';
import {
  WordParseCbResult,
  wordParse,
  ParseWordResult,
} from './word-parse';
import { WORD_COUNT_OUT_DIR_PATH, WORD_COUNT_PER_BOOK_OUT_DIR_PATH } from './parse-books-constants';
import path from 'path';
import { writeFile } from 'fs/promises';

export async function parseWordCountsSync(books: ScrapedBookWithFile[], baseDir: string) {
  let doneCount: number, totalWordCount: number;
  let parseWordResults: ParseWordResult[];
  let donePrintMod: number;
  let totalParseTimer: Timer, totalParseMs: number;
  let bookParseTimes: number[], bookParseTimesSumMs: number;

  let totalWordCountMap: ParseWordResult['wordCountMap'];

  await initParseWordCounts();

  totalWordCount = 0;
  doneCount = 0;
  parseWordResults = [];
  bookParseTimes = [];

  donePrintMod = Math.ceil(books.length / 70);

  console.log(`parsing word counts of ${books.length.toLocaleString()} books...`);

  totalParseTimer = Timer.start();

  for(let i = 0; i < books.length; ++i) {
    let currBook: ScrapedBookWithFile;
    let currWordCountMap: ParseWordResult['wordCountMap'];
    let parseWordResult: ParseWordResult;
    let wordParseTimer: Timer, wordParseMs: number;
    currBook = books[i];

    const doneCb = (opts: WordParseCbResult) => {
      doneCount++;
      if((doneCount % donePrintMod) === 0) {
        process.stdout.write('+');
      }
      totalWordCount += opts.wordCount;
      currWordCountMap = opts.wordCountMap;
    };

    wordParseTimer = Timer.start();
    await wordParse({
      book: currBook,
      bookDir: baseDir,
      doneCb,
    });
    wordParseMs = wordParseTimer.stop();
    bookParseTimes.push(wordParseMs);

    parseWordResult = {
      book: currBook,
      wordCountMap: currWordCountMap,
    };
    // await writeWordCountMapFile(currBook, parseWordResult.wordCountMap);
    parseWordResults.push(parseWordResult);
  }

  totalParseMs = totalParseTimer.stop();

  totalWordCountMap = getAggregateWordCountMap(parseWordResults);

  await writeWordCountAggregateMapFile(totalWordCountMap);

  // for(let i = 0; i < parseWordResults.length; ++i) {
  //   let currParseWordResult: ParseWordResult;
  //   currParseWordResult = parseWordResults[i];
  //   await writeWordCountMapFile(currParseWordResult.book, currParseWordResult.wordCountMap);
  // }

  bookParseTimesSumMs = bookParseTimes.reduce((acc, curr) => {
    return acc + curr;
  }, 0);

  console.log('');
  console.log(
    [ ...totalWordCountMap.keys() ].reduce((acc, curr) => {
      return acc + totalWordCountMap.get(curr);
    }, 0)
  );
  console.log(`parsed ${doneCount.toLocaleString()} books in ${getIntuitiveTimeString(totalParseMs)}`);
  console.log(`wordParseMs [sum] ${getIntuitiveTimeString(bookParseTimesSumMs)}`);
  console.log(`totalWords: ${totalWordCount.toLocaleString()}`);
}

async function initParseWordCounts() {
  await mkdirIfNotExistRecursive(WORD_COUNT_OUT_DIR_PATH);
  await mkdirIfNotExistRecursive(WORD_COUNT_PER_BOOK_OUT_DIR_PATH);
}

function getAggregateWordCountMap(parseWordResults: ParseWordResult[]): ParseWordResult['wordCountMap'] {
  let aggregateWordCountMap: ParseWordResult['wordCountMap'];
  aggregateWordCountMap = new Map();

  for(let i = 0; i < parseWordResults.length; ++i) {
    let parseWordResult: ParseWordResult;
    let wordCountMap: ParseWordResult['wordCountMap'];
    let wordCountMapKeys: string[];
    parseWordResult = parseWordResults[i];
    wordCountMap = parseWordResult.wordCountMap;
    wordCountMapKeys = [ ...wordCountMap.keys() ];
    for(let k = 0; k < wordCountMapKeys.length; ++k) {
      let wordCountMapKey: string;
      wordCountMapKey = wordCountMapKeys[k];
      if(!aggregateWordCountMap.has(wordCountMapKey)) {
        aggregateWordCountMap.set(wordCountMapKey, 0);
      }
      aggregateWordCountMap.set(wordCountMapKey, aggregateWordCountMap.get(wordCountMapKey) + wordCountMap.get(wordCountMapKey));
    }
  }

  return aggregateWordCountMap;
}

async function writeWordCountAggregateMapFile(wordCountMap: ParseWordResult['wordCountMap']) {
  let wordCountTuples: [ string, number ][], sortedWordCountKeys: string[];
  let outFileName: string, outFilePath: string, outFileData: string;
  wordCountTuples = [ ...wordCountMap.keys() ].map(wordCountMapKey => {
    return [
      wordCountMapKey,
      wordCountMap.get(wordCountMapKey),
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
  outFileName = '_wc_total.json';
  outFilePath = [
    WORD_COUNT_OUT_DIR_PATH,
    outFileName,
  ].join(path.sep);
  const wordCountJsonObj = Object.fromEntries(wordCountMap);
  outFileData = JSON.stringify(wordCountJsonObj, sortedWordCountKeys, 2);
  // outFileData = JSON.stringify(wordCountMap, sortedWordCountKeys, 2);
  await writeFile(outFilePath, outFileData);
}

async function writeWordCountMapFile(book: ScrapedBookWithFile, wordCountMap: ParseWordResult['wordCountMap']) {
  let wordCountTuples: [ string, number ][], sortedWordCountKeys: string[];
  let outFileName: string, outFilePath: string, outFileData: string;
  wordCountTuples = [ ...wordCountMap.keys() ].map(wordCountMapKey => {
    return [
      wordCountMapKey,
      wordCountMap.get(wordCountMapKey),
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
    // WORD_COUNT_OUT_DIR_PATH,
    WORD_COUNT_PER_BOOK_OUT_DIR_PATH,
    outFileName,
  ].join(path.sep);
  const wordCountJsonObj = Object.fromEntries(wordCountMap);
  outFileData = JSON.stringify(wordCountJsonObj, sortedWordCountKeys, 2);
  // outFileData = JSON.stringify(wordCountTuples, null, 2);
  await writeFile(outFilePath, outFileData);
}
