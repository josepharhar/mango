import * as url from 'url';
import * as util from 'util';
import * as fs from 'fs';
import * as path from 'path';

import * as express from 'express';
import * as send from 'send';

import {getHistory, addToHistory} from './history';

const statPromise = util.promisify(fs.stat);
const readdirPromise = util.promisify(fs.readdir);

const port = 8000;
const servePath = process.argv[2];
if (!servePath) {
  console.log('no servePath provided: ' + process.argv[2]);
  process.exit(1);
}

const server = express();

server.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

server.get('/', async (req, res) => {
  res.writeHead(200, {'content-type': 'text/html'});
  res.end(indexTemplate(await getHistory()));
});

function parseUrl(reqUrl: string) {
  const parsedUrl = url.parse(reqUrl);
  console.log('requrl: ' + reqUrl);
  const relativePath = decodeURIComponent(parsedUrl.pathname);
  // TODO make sure relativePath doesnt use .. for secuutiry
  const absolutePath = path.join(servePath, relativePath);
  return {relativePath, absolutePath};
}

server.use('/browse', async (req, res) => {
  const {relativePath, absolutePath} = parseUrl(req.url);
  let stats = null;
  try {
    stats = await statPromise(absolutePath);
  } catch (error) {
    res.writeHead(500, {'content-type': 'text/plain'});
    res.end('failed to fs.stat.'
      + '\n  relativePath: ' + relativePath
      + '\n  absolutePath: ' + absolutePath
      + '\n  error: ' + error);
    return;
  }

  if (stats.isDirectory()) {
    // read the directory and output the contents
    let dirents = null;
    try {
      dirents = await readdirPromise(absolutePath, {withFileTypes: true});
    } catch (error) {
      res.writeHead(500, {'content-type': 'text/plain'});
      res.end('failed to readdir:\n' + error);
      return;
    }
    res.writeHead(200, {'content-type': 'text/html'});
    res.end(renderDir(relativePath, dirents));

  } else {
    // send a webpage which embeds the file!
    res.writeHead(200, {'content-type': 'text/html'});
    res.end(renderReader(relativePath));
  }
});

server.use('/file', async (req, res) => {
  const {absolutePath} = parseUrl(req.url);
  send(req, absolutePath).pipe(res);
});

let paths: Array<string> = null;
server.use('/next', async (req, res) => {
  const {relativePath} = parseUrl(req.url);
  const index = paths.indexOf(relativePath);
  if (index < 0) {
    res.writeHead(400, {'content-type': 'text/plain'});
    res.end('failed to find /next for path: ' + relativePath);
    return;
  }

  const nextIndex = index >= paths.length ? 0 : index + 1;
  const nextPath = paths[nextIndex];

  res.writeHead(307, {
    'content-type': 'text/plain',
    'location': `/browse/${encodeURIComponent(nextPath)}`
  });
  res.end('/next redirecting'
    + '\n  from: ' + relativePath
    + '\n    to: ' + nextPath);
});

(async () => {
  console.log('scanning for files on path "' + servePath + '" ...');
  paths = await getRelativeFilepathsInDir(servePath, '/');
  server.listen(port, () => console.log('listening on port ' + port + ', serving path: ' + servePath));
})();

function indexTemplate(history: Array<string>) {
  return `
  <!DOCTYPE html>
  <head>
    <title>mango</title>
  </head>
  <body>
    <h2>last files:</h2>
    ${history.map(file => `<div>${file}</div>`)}
    <h2>browse:</h2>
    <a href="/browse">browse</a>
  </body>
  `;
}

function renderDir(relativePathUnencoded: string, dirents: Array<fs.Dirent>): string {
  const relativePath = encodeURIComponent(relativePathUnencoded);

  const contents = dirents.map(dirent => {
    if (dirent.isDirectory()) {
      return `<div><a href="${path.join('/browse', relativePath, dirent.name)}">${dirent.name}/</a></div>`;
    }
    return `<div><a href="${path.join('/browse', relativePath, dirent.name)}">${dirent.name}</a></div>`;
  }).reduce((accumulator, currentValue) => accumulator + currentValue);

  return `
  <!DOCTYPE html>
  <head>
    <title>mango</title>
  </head>
  <body>
    <h2>${relativePathUnencoded}</h2>
    <h3>${dirents.length} files</h3>
    ${contents}
  </body>
  `;
}

function renderReader(relativePathUnencoded: string): string {
  const relativePath = encodeURIComponent(relativePathUnencoded);
  return `
  <!DOCTYPE html>
  <head>
    <title>mango</title>
  </head>
  <body>
    <a href="/next/${relativePath}">
      <img src="/file/${relativePath}"></img>
    </a>
  </body>
  `;
}

async function getRelativeFilepathsInDir(rootpath: string, currentpath: string): Promise<Array<string>> {
  let relativeFilepaths = [];
  const dirents = await readdirPromise(path.join(rootpath, currentpath), {withFileTypes: true});
  for (const dirent of dirents) {
    if (dirent.isDirectory()) {
      const subFilepaths = await getRelativeFilepathsInDir(rootpath, path.join(currentpath, dirent.name));
      relativeFilepaths = relativeFilepaths.concat(subFilepaths);
    } else {
      relativeFilepaths.push(path.join(currentpath, dirent.name));
    }
  }
  return relativeFilepaths;
}
