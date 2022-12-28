
import sourceMapSupport from 'source-map-support';
sourceMapSupport.install();

import { txtMain } from './lib/txt/txt-main';

(async () => {
  try {
    await main();
  } catch(e) {
    console.error(e);
    throw e;
  }
})();

async function main() {
  setProcName();
  await txtMain(process.argv);
}

function setProcName() {
  process.title = 'gutenberg_ezd';
}
