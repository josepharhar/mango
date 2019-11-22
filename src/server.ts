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
  console.log(`${req.method} ${req.url}`);
  next();
});

server.get('/', async (req, res) => {
  res.writeHead(200, {'content-type': 'text/html'});
  res.end(indexTemplate(await getHistory()));
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
  const {absolutePath} = parseUrl(servePath, req.url);
  send(req, absolutePath).pipe(res);
});

let paths: Array<string> = null;
server.use('/next', async (req, res) => {
  const {relativePath} = parseUrl(servePath, req.url);
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
