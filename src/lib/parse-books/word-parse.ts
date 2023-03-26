
import path from 'path';
import { ScrapedBookWithFile } from '../../models/scraped-book';
import { readFileStream } from '../../util/read-file-stream';

export type ParseWordResult = {
  book: ScrapedBookWithFile;
  wordCountMap: Map<string, number>;
};

export type WordParseCbResult = {
  book: ScrapedBookWithFile;
  bookFilePath: string;
  wordCount: number;
  wordCountMap: ParseWordResult['wordCountMap'];
};

type WordParseOpts = {
  book: ScrapedBookWithFile;
  bookDir: string;
  doneCb: (result: WordParseCbResult) => void;
};

export async function wordParse(opts: WordParseOpts) {
  let fileName: string, filePath: string;
  let totalWordCount: number, wordCountMap: ParseWordResult['wordCountMap'];

  fileName = `${opts.book.fileName}.txt`;
  filePath = [
    opts.bookDir,
    fileName,
  ].join(path.sep);

  totalWordCount = 0;
  wordCountMap = new Map();

  const lineCb = (line: string) => {
    let words: string[];
    // words = line.split(/[\s]+/gi);
    words = line.split(/[\s\-–—―‐.,/:\u0097]+/gi);
    for(let i = 0; i < words.length; ++i) {
      let word: string;
      word = words[i];

      // replace curly single apostrophy with generic apostrophe
      word = word.replace(/’/gi, '\'');

      // remove punctuations from beginning and end of string
      word = word.replace(/(?:^[^\p{L}]+)|(?:[^\p{L}]+$)/giu, '');

      // remove underscores
      word = word.replace(/_/gi, '');

      // remove any inner punctuation that's not an apostrophe
      word = word.replace(/[^'^\p{L}^0-9]/gui, '');

      if(word.length === 0) {
        continue;
      }
      totalWordCount++;
      if(!wordCountMap.has(word)) {
        wordCountMap.set(word, 0);
      }
      wordCountMap.set(word, wordCountMap.get(word) + 1);
    }
  };

  await readFileStream(filePath, {
    lineCb,
  });

  opts.doneCb({
    book: opts.book,
    bookFilePath: filePath,
    wordCount: totalWordCount,
    wordCountMap,
  });

}
