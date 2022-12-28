
import path from 'path';

import { STRIPPED_EBOOKS_DIR_PATH } from '../../constants';
import { ScrapedBookWithFile } from '../../models/scraped-book';
import {
  checkFile,
  _rimraf,
} from '../../util/files';
import {
  stripBook,
  StripBookResult,
} from './strip-book';
import { StripGutenbergError } from './strip-gutenberg';

export type StripBooksResult = {
  errCount: number;
  smallPrintCount: number;
  parsedCount: number;
  totalLineCount: number;
};

export async function stripBooks(books: ScrapedBookWithFile[]): Promise<StripBooksResult> {
  let totalLineCount: number;
  let doneCount: number, donePrintMod: number;
  let parsedCount: number, errCount: number, smallPrintCount: number;
  let stripBooksResult: StripBooksResult;

  doneCount = 0;
  parsedCount = 0;
  errCount = 0;
  smallPrintCount = 0;
  donePrintMod = Math.ceil(books.length / 70);

  totalLineCount = 0;

  for(let i = 0; i < books.length; ++i) {
    let currBook: ScrapedBookWithFile;
    let hasStripErr: boolean, strippedBookExists: boolean;
    let stripBookResult: StripBookResult;
    let destFileName: string, destFilePath: string;

    currBook = books[i];
    hasStripErr = false;

    destFileName = `${currBook.fileName}.txt`;
    destFilePath = [
      STRIPPED_EBOOKS_DIR_PATH,
      destFileName,
    ].join(path.sep);

    strippedBookExists = await checkFile(destFilePath);

    const doneCb = (err: StripGutenbergError, book: ScrapedBookWithFile) => {
      doneCount++;
      if(err) {
        errCount++;
        hasStripErr = true;
        if(err.hasSmallPrint) {
          smallPrintCount++;
        }
      } else if(!strippedBookExists) {
        parsedCount++;
      }
      if((doneCount % donePrintMod) === 0) {
        process.stdout.write('x');
      }
    };

    if(strippedBookExists) {
      stripBookResult = {
        lineCount: 0,
      };
      doneCb(undefined, currBook);
    } else {
      stripBookResult = await stripBook(currBook, {
        doneCb,
        destFilePath,
      });
    }

    if(hasStripErr) {
      /*
        Cleanup (delete) files if there was a strip err.
          We can only check after finishing streaming, because a file may have
          parsable start tags but not have parsable end tags
      */
      await _rimraf(destFilePath);
    } else {
      totalLineCount = totalLineCount + stripBookResult.lineCount;
    }
  }

  stripBooksResult = {
    errCount,
    smallPrintCount,
    totalLineCount,
    parsedCount,
  };

  return stripBooksResult;
}
