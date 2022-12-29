
import path from 'path';

import { OUT_DIR_PATH } from '../../constants';

const WORD_COUNT_OUT_DIR_NAME = 'word-count';
export const WORD_COUNT_OUT_DIR_PATH = [
  OUT_DIR_PATH,
  WORD_COUNT_OUT_DIR_NAME,
].join(path.sep);
