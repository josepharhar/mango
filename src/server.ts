import * as url from 'url';
import * as util from 'util';

import * as express from 'express';

import {getHistory, addToHistory} from './history';

const statPromise = util.promisify(fs.stat);

const port = 8000;
const servePath = process.argv[2];

const server = express();

server.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

server.get('/', async (req, res) => {
  res.writeHead(200, {'content-type': 'text/html'});
  res.end(indexTemplate(await getHistory()));
});

server.get('/file', async (req, res) => {
  //res.writeHead(200, {'content-type': 'text/html'});
  const parsedUrl = url.parse(req.url);
  const relativePath = parsedUrl.pathname.substring('/file'.length);
  // TODO make sure relativePath doesnt use .. for secuutiry
  const absolutePath = path.join(servePath, relativePath);

  let stats = null;
  try {
    stats = await statPromise(absolutePath);
  } catch (error) {
    res.writeHead(500, {'content-type': 'text/plain'});
    res.end('failed to fs.stat:\n' + error);
    return;
  }

  if (stats.isDirectory()) {
    // read the directory and output the contents
  } else {
    // send a webpage which embeds the file!
    // ... but i also need a way for the webpage to request the contents of the file...
  }
});
server.listen(port, () => console.log('listening on port ' + port + ', serving path: ' + servePath));

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
    <a href="/file">browse</a>
  </body>
  `;
}
