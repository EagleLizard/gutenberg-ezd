
import { scrapeMain } from '../scrape/scrape-main';
import { fetchBooksMain } from '../fetch-books/fetch-books-main';
import { stripBooksMain } from '../strip-books/strip-books-main';
import { parseBooksMain } from '../parse-books/parse-books-main';

enum TXT_ARGS {
  SCRAPE = 'SCRAPE',
  STRIP = 'STRIP',
  FETCH = 'FETCH',
  PARSE = 'PARSE',
}

const TXT_ARG_MAP: Record<TXT_ARGS, string> = {
  [TXT_ARGS.SCRAPE]: 'scrape',
  [TXT_ARGS.STRIP]: 'strip',
  [TXT_ARGS.FETCH]: 'fetch',
  [TXT_ARGS.PARSE]: 'parse',
};

export async function txtMain(argv: string[]) {
  let cliArgs: string[], cmdArg: string;
  let restArgs: string[];

  cliArgs = argv.slice(2);
  cmdArg = cliArgs[0];
  restArgs = cliArgs.slice(1);
  switch(cmdArg) {
    case TXT_ARG_MAP.SCRAPE:
      await scrapeMain(restArgs);
      break;
    case TXT_ARG_MAP.FETCH:
      await fetchBooksMain();
      break;
    case TXT_ARG_MAP.STRIP:
      await stripBooksMain();
      break;
    case TXT_ARG_MAP.PARSE:
      await parseBooksMain(restArgs);
      break;
    default:
      handleDefaultArg(cmdArg);
  }
}

function handleDefaultArg(cmdArg: string) {
  cmdArg = cmdArg ?? '';
  if(cmdArg.trim().length === 0) {
    console.log('Empty command provided.');
  } else {
    console.log(`Command not supported: ${cmdArg}`);
  }
}
