import * as url from 'url';
import * as util from 'util';
import * as fs from 'fs';
import * as path from 'path';

import * as express from 'express';
import * as send from 'send';

import {getHistory, addToHistory} from './history';
import {indexTemplate, renderDir, renderReader} from './renderers';
import {parseUrl, getRelativeFilepathsInDir} from './utils';

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
  console.log(`${req.method} ${req.url}`
    + '\n    ' + decodeURIComponent(req.url));
  next();
});

server.get('/', async (req, res) => {
  res.writeHead(200, {'content-type': 'text/html'});
  const history = await getHistory();
  console.log('  history: ' + JSON.stringify(history));
  res.end(indexTemplate(/*await getHistory()*/history));
});

server.use('/browse', async (req, res) => {
  const {relativePath, absolutePath} = parseUrl(servePath, req.url);
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
    console.log('  rendering directory');
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
    // TODO write to history
    console.log('  rendering file reader');
    console.log('  relativePath: ' + relativePath);
    // send a webpage which embeds the file!
    res.writeHead(200, {'content-type': 'text/html'});
    res.end(renderReader(relativePath));
    console.log('  adding to history: ' + relativePath);
    await addToHistory(relativePath);
  }
});

server.use('/file', async (req, res) => {
  const {absolutePath} = parseUrl(servePath, req.url);
  send(req, absolutePath).pipe(res);
});

let paths: Array<string> = null;

async function prevNextHandler(req, res, prevOrNext: 'prev'|'next') {
  const {relativePath} = parseUrl(servePath, req.url);
  const index = paths.indexOf(relativePath);
  if (index < 0) {
    res.writeHead(400, {'content-type': 'text/plain'})
    res.end('failed to find /prev for path: ' + relativePath);
    return;
  }

  let nextIndex = null;
  if (prevOrNext === 'next') {
    nextIndex = index >= paths.length
      ? 0
      : index + 1;
  } else {
    nextIndex = index === 0
      ? paths.length - 1
      : index - 1;
  }
  const nextPath = paths[nextIndex];

  res.writeHead(307, {
    'content-type': 'text/plain',
    'location': encodeURI(path.join('/browse', nextPath))
  });
  res.end('redirecting'
    + '\n  from: ' + relativePath
    + '\n    to: ' + nextPath);
}

server.use('/next', (req, res) => prevNextHandler(req, res, 'next'));
server.use('/prev', (req, res) => prevNextHandler(req, res, 'prev'));

(async () => {
  console.log('scanning for files on path "' + servePath + '" ...');
  const allowedExtensions = [
    'jpeg',
    'png',
    'jpg'
  ];
  paths = (await getRelativeFilepathsInDir(servePath, '/'))
    .filter(path => {
      for (const allowedExtension of allowedExtensions) {
        if (path.endsWith(allowedExtension))
          return true;
      }
      return false;
    });
  server.listen(port, () => console.log('listening on port ' + port + ', serving path: ' + servePath));
})();
