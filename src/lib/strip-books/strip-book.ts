
import { createWriteStream, WriteStream } from 'fs';
import { ScrapedBookWithFile } from '../../models/scraped-book';
import { stripGutenbergBook, StripGutenbergOpts } from './strip-gutenberg';

export type StripBookResult = {
  lineCount: number;
};

type StripBookOpts = {
  doneCb: StripGutenbergOpts['doneCb'];
  destFilePath: string;
};

export async function stripBook(
  book: ScrapedBookWithFile,
  opts: StripBookOpts,
): Promise<StripBookResult> {
  let ws: WriteStream, wsFinishPromise: Promise<void>;
  let lineCount: number;
  let result: StripBookResult;

  lineCount = 0;

  ws = await initWs(opts.destFilePath);
  wsFinishPromise = getWsFinishPromise(ws);

  const lineCb = (line: string) => {
    ws.write(`${line}\n`);
    lineCount++;
  };

  await stripGutenbergBook(book, {
    lineCb,
    doneCb: opts.doneCb,
  });
  ws.close();
  await wsFinishPromise;

  result = {
    lineCount,
  };
  return result;
}

async function initWs(_filePath: string): Promise<WriteStream> {
  let _ws: WriteStream;
  _ws = createWriteStream(_filePath);
  await new Promise<void>((resolve, reject) => {
    const wsReadyErrCb = (err: Error) => {
      console.error('error when opening writestream');
      reject(err);
    };
    _ws.once('ready', () => {
      _ws.removeListener('error', wsReadyErrCb);
      resolve();
    });
    _ws.once('error', wsReadyErrCb);
  });
  return _ws;
}
function getWsFinishPromise(_ws: WriteStream): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const wsCloseErrCb = (err: Error) => {
      console.error('error when writing to writestream');
      reject(err);
    };
    _ws.once('finish', () => {
      _ws.removeListener('error', wsCloseErrCb);
      resolve();
    });
    _ws.on('error', wsCloseErrCb);
  });
}
