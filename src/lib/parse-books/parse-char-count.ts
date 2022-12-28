
import path from 'path';
import { ScrapedBookWithFile } from '../../models/scraped-book';
import { readFileStream } from '../../util/read-file-stream';

export type CharCountParseCbResult = {
  book: ScrapedBookWithFile;
  bookFilePath: string;
  charCount: number;
  lineCount: number;
};

type CharCountParseOpts = {
  book: ScrapedBookWithFile;
  bookDir: string;
  doneCb: (result: CharCountParseCbResult) => void;
};

export async function charCountParse(opts: CharCountParseOpts) {
  let fileName: string, filePath: string;
  let charCount: number, lineCount: number;

  let charCountMap: Record<string, number>;

  fileName = `${opts.book.fileName}.txt`;
  filePath = [
    opts.bookDir,
    fileName
  ].join(path.sep);

  charCount = 0;
  lineCount = 0;
  charCountMap = {};

  const countLineChars = (line: string) => {

    for(let i = 0; i < line.length; ++i) {
      let currChar: string;
      currChar = line[i];

      charCount++;

      // if((/[\S]/gi).test(currChar)) {
      //   if(charCountMap[currChar] === undefined) {
      //     charCountMap[currChar] = 0;
      //   }
      //   charCountMap[currChar]++;
      // }
    }
  };

  const lineCb = (line: string) => {
    lineCount++;
    countLineChars(line);
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
