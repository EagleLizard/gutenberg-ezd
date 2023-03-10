
import { Dirent } from 'fs';
import { readdir } from 'fs/promises';
import path from 'path';

import { OUT_DIR_PATH, STRIPPED_EBOOKS_DIR_PATH } from '../../constants';
import { ScrapedBookWithFile } from '../../models/scraped-book';
import { mkdirIfNotExistRecursive } from '../../util/files';
import { getTxtBookMeta } from '../fetch-books/books-meta-service';
import { parseCountsSync } from './parse-counts';
import { parseWordCountsSync } from './parse-words';

/*
  process.stdout.write('➤');
  process.stdout.write('△');
  process.stdout.write('❯');
  process.stdout.write('➣');
  process.stdout.write('➢');
  process.stdout.write('▁');
  process.stdout.write('▂');
*/

enum PARSE_ARGS {
  COUNT = 'COUNT',
  WORD_COUNT = 'WORD_COUNT',
}

const PARSE_ARG_MAP: Record<PARSE_ARGS, string> = {
  [PARSE_ARGS.COUNT]: 'count',
  [PARSE_ARGS.WORD_COUNT]: 'wc',
};

export async function parseBooksMain(parseArgs: string[]) {
  let baseDir: string, booksToParse: ScrapedBookWithFile[];
  let parseCmdArg: string;
  console.log('!~ parse ~!');

  await initParseBooks();

  parseCmdArg = parseArgs[0];

  // console.log({ parseCmdArg });

  // baseDir = EBOOKS_DATA_DIR_PATH;
  baseDir = STRIPPED_EBOOKS_DIR_PATH;

  booksToParse = await getBooksToParse(baseDir);

  switch(parseCmdArg) {
    case PARSE_ARG_MAP.WORD_COUNT:
      await parseWordCountsSync(booksToParse, baseDir);
      break;
    case PARSE_ARG_MAP.COUNT:
    case undefined:
      await parseCountsSync(booksToParse, baseDir);
      break;
    default:
      handleDefaultArg(parseCmdArg);
  }
}

async function initParseBooks() {
  await mkdirIfNotExistRecursive(OUT_DIR_PATH);
}

function handleDefaultArg(cmdArg: string) {
  cmdArg = cmdArg ?? '';
  if(cmdArg.trim().length === 0) {
    console.log('Empty command provided.');
  } else {
    console.log(`Command not supported: ${cmdArg}`);
  }
}

async function getBooksToParse(baseDir: string): Promise<ScrapedBookWithFile[]> {
  let txtBooksMeta: ScrapedBookWithFile[], scrapedBooks: ScrapedBookWithFile[];
  let booksToParse: ScrapedBookWithFile[];
  const _getBookPath = getBookPathMemo(baseDir);
  txtBooksMeta = await getTxtBookMeta();

  scrapedBooks = filterScrapedBooks(txtBooksMeta);

  booksToParse = [];
  for(let i = 0; i < scrapedBooks.length; ++i) {
    let currBook: ScrapedBookWithFile, foundBookPath: string;
    let nextBook: ScrapedBookWithFile;
    currBook = scrapedBooks[i];
    foundBookPath = await _getBookPath(currBook);
    if(foundBookPath === undefined) {
      continue;
    }
    nextBook = {
      ...currBook,
    };
    booksToParse.push(nextBook);
  }

  return booksToParse;
}

/*
  Optionally apply filter, mostly used for debugging
    the parse algos when modifying so you don't have to parse
    as large of a dataset
*/
function filterScrapedBooks(txtBooksMeta: ScrapedBookWithFile[]): ScrapedBookWithFile[] {
  let scrapedBooks: ScrapedBookWithFile[];
  scrapedBooks = txtBooksMeta.filter(bookMeta => {
    return [
      // bookMeta.fileName.includes('the-art-of-war-by-active-6th-century-bc-sunzi'),
      // bookMeta.fileName.includes('the-history-of-the-decline-and-fall-of-the-roman-empire-by-edward-gibbon'),
      // bookMeta.fileName.includes('novo-dicionário-da-língua-portuguesa-by-cândido-de-figueiredo'),
      // bookMeta.fileName.startsWith('p'),
      // bookMeta.fileName.startsWith('a'),
      // bookMeta.fileName.startsWith('t'),
      // bookMeta.fileName.startsWith('s'),
      true,
    ].some(condition => condition === true);
  });
  // scrapedBooks = scrapedBooks.filter(scrapedBook => {
  //   // return scrapedBook.rank <= 500;
  //   return scrapedBook.rank <= 300;
  // });
  return scrapedBooks;
}

function getBookPathMemo(baseDir: string) {
  let dirents: Dirent[];
  return async function getBookPath(book: ScrapedBookWithFile): Promise<string> {
    let foundDirent: Dirent;
    let bookPath: string;
    if(dirents === undefined) {
      dirents = await readdir(baseDir, {
        withFileTypes: true,
      });
    }
    foundDirent = dirents.find(dirent => dirent.name.includes(book.fileName));
    if(!foundDirent) {
      return;
    }
    bookPath = [
      baseDir,
      foundDirent.name
    ].join(path.sep);
    return bookPath;
  };
}
