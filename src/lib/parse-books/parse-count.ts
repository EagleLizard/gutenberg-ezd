
import path from 'path';
import { ScrapedBookWithFile } from '../../models/scraped-book';
import { readFileStream } from '../../util/read-file-stream';

export type CountParseCbResult = {
  book: ScrapedBookWithFile;
  bookFilePath: string;
  charCount: number;
  lineCount: number;
};

type CountParseOpts = {
  book: ScrapedBookWithFile;
  bookDir: string;
  doneCb: (result: CountParseCbResult) => void;
};

export async function countParse(opts: CountParseOpts) {
  let fileName: string, filePath: string;
  let charCount: number, lineCount: number;

  fileName = `${opts.book.fileName}.txt`;
  filePath = [
    opts.bookDir,
    fileName
  ].join(path.sep);

  charCount = 0;
  lineCount = 0;

  const lineCb = (line: string) => {
    lineCount++;
    charCount += line.length;
  };

  await readFileStream(filePath, {
    lineCb,
  });

  opts.doneCb({
    book: opts.book,
    bookFilePath: filePath,
    charCount,
    lineCount,
  });
}
