
# Gutenberg EZD

A web scraper and text parser for Project Gutenberg.

## Prerequisites

1. NodeJS 16.x+, use [nvm](https://github.com/nvm-sh/nvm) to manage NodeJS/npm versions.
2. Typescript @ `^4.9.x`

Ensure `tsc` is available globally via:
```sh
npm i -g typescript
```

## Overview

This project is meant to be a tool for general aggregation and compilation of plaintext book files from Project Gutenberg, for the explicit purpose of generating a stable dataset of generalized plaintext to write simple programs against.

You could use the output(s) of this program as an input to learn file parsing basics in another programming language.

For example, the `parse` command produces output that can be verified in another program when ran against the files in `data/txt-ebooks-stripped`.

## Getting Started

cd into project:
```sh
cd ./path/to/gutenberg-ezd
```

Install dependencies:
```sh
npm i
```

Compile with tsc:
```
tsc
```

Optionally, open a separate terminal and run tsc in watch mode (_**recommended**_):

```sh
tsc -w
```

## Historical Data

The `historical-data/` directory contains a result dataset from scraping the books via a daily automation from 12-09-2022 to 12-28-2022.

To seed the program with this dataset, unzip the `historical-data/scraped-ebooks_12-09-2022_to_12-28-2022.zip`.

The archive should unzip to a directory at `historical-data/scraped-ebooks`.

Copy the contents to `data/scraped-ebooks`:
```sh
cp -a ./historical-data/scraped-ebooks/. ./data/scraped-ebooks/
```

This will enable the `fetch`, `strip`, and `parse` scripts to be run over all of the ebooks captured during the December 2022 collection period.

## Running the program

Generally, the commands for the program should be run sequentially:

1. `scrape`
2. `fetch`
3. `strip`
4. `parse`

Having them separate is intentional, because some commands can aggregate locally over time, and would be time consuming to run subsequent commands.

For example, `scrape` can be run on a daily basis to aggregate metadata for each list. `fetch` can also be run, but isn't necessary for capturing ebooks or rankings on any given day - it fetches the `.txt` files from the metadata produced by the `scrape` command.

`strip` only needs to be run when `fetch` is ran and fetched new files into `data/txt-ebooks`, or if you change the header/footer stripping logic.

### Scrape

```sh
node dist/main.js scrape
```

Runs puppeteer in Chrome headless mode to scrape **today's** top100 / top1000 ebooks. Fetches from the following source pages:

top 100: https://www.gutenberg.org/browse/scores/top

top 1000: https://www.gutenberg.org/browse/scores/top1000.php

Writes the metadata by date and list type into `data/scraped-ebooks/` as JSON.

### Fetch

```sh
node dist/main.js fetch
```

Attempts to download all ebooks with plaintext files into `data/txt-ebooks/`. Skips 404s, otherwise attempts reties with backoff.

### Strip

```sh
node dist/main.js strip
```

Strips the Project Gutenberg programmatic header & footer text blocks from the fetched files and rewrites them to `data/txt-ebooks-stripped/`.

Skips any files with non-parsable headers or footers, or in a format that's not parsable - e.g. `.txt` files that represent a Project Gutenberg index file instead of the file directly.

### Parse

```sh
node dist/main.js parse
```

Runs a simple parsing program on the files produced by `strip` and prints rudimentary statistics.
