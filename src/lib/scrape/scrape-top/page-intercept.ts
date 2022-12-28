
import * as puppeteer from 'puppeteer';

export function pageInterceptHandler(request: puppeteer.HTTPRequest) {
  let doIntercept: boolean;
  doIntercept = shouldInterceptPageRequest(request.resourceType());
  if(doIntercept) {
    return request.abort();
  }
  return request.continue();
}

function shouldInterceptPageRequest(resourceType: puppeteer.ResourceType): boolean {
  let foundInterceptIdx: number, shouldIntercept: boolean;
  foundInterceptIdx = [
    'image',
    'media',
    'font',
    'stylesheet',
  ].findIndex(interceptType => {
    return interceptType === resourceType;
  });
  shouldIntercept = foundInterceptIdx !== -1;
  return shouldIntercept;
}
