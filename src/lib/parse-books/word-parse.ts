
import path from 'path';
import { ScrapedBookWithFile } from '../../models/scraped-book';
import { readFileStream } from '../../util/read-file-stream';

export type WordParseCbResult = {
  book: ScrapedBookWithFile;
  bookFilePath: string;
  wordCount: number;
  wordCountMap: Record<string, number>;
};

type WordParseOpts = {
  book: ScrapedBookWithFile;
  bookDir: string;
  doneCb: (result: WordParseCbResult) => void;
};

export async function wordParse(opts: WordParseOpts) {
  let fileName: string, filePath: string;
  let totalWordCount: number, wordCountMap: Record<string, number>;

  fileName = `${opts.book.fileName}.txt`;
  filePath = [
    opts.bookDir,
    fileName,
  ].join(path.sep);

  totalWordCount = 0;
  wordCountMap = {};

  const lineCb = (line: string) => {
    let words: string[];
    words = line.split(/[\s]+/gi);
    for(let i = 0; i < words.length; ++i) {
      let word: string;
      word = words[i];
      if(word.length === 0) {
        continue;
      }
      totalWordCount++;
      if(wordCountMap[word] === undefined) {
        wordCountMap[word] = 0;
      }
      wordCountMap[word]++;
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
