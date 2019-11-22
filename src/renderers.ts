import * as fs from 'fs';
import * as path from 'path';

function wrapBody(body: string): string {
  return `
  <!DOCTYPE html>
  <head>
    <title>mango</title>
    <style>
    * {
      margin: 0;
      padding: 0;
    }
    a {
      display: grid;
      height: 100%;
    }
    div.imgcontainer {
      display: grid;
      height: 100%;
    }
    div.imgcontainer > img {
      max-width: 100%;
      max-height: 100vh;
      margin: auto;
    }
    </style>
  </head>
  <body>
    <a href="/"><p>home</p></a>
    ${body}
  </body>
  `;
}

export function indexTemplate(history: Array<string>) {
  const historyListHtml = history
    .map(historyPath => {
      return `<a href=${encodeURI(path.join('/browse', historyPath))}>${historyPath}</a>`;
    }).reduce((accumulator, currentValue) => {
      return currentValue + '\n' + accumulator;
    });
  return wrapBody(`
  <body>
    <a href="/browse"><h2>browse</h2></a>
    <h2>last files:</h2>
    ${historyListHtml}
  </body>
  `);
}

export function renderDir(relativePathUnencoded: string, dirents: Array<fs.Dirent>): string {
  const contents = dirents.map(dirent => {
    if (dirent.isDirectory()) {
      return `<div><a href="${encodeURI(path.join('/browse', relativePathUnencoded, dirent.name))}">${dirent.name}/</a></div>`;
    }
    return `<div><a href="${encodeURI(path.join('/browse', relativePathUnencoded, dirent.name))}">${dirent.name}</a></div>`;
  }).reduce((accumulator, currentValue) => accumulator + currentValue);

  return wrapBody(`
  <body>
    <h2>${relativePathUnencoded}</h2>
    <h3>${dirents.length} files</h3>
    ${contents}
  </body>
  `);
}

export function renderReader(relativePathUnencoded: string): string {
  return wrapBody(`
  <body>
    <button id="cssbutton">css</button>
    <a href="${encodeURI(path.join('/next', relativePathUnencoded))}">
      <div id="imgcontainer" class="imgcontainer">
        <img src="${encodeURI(path.join('/file', relativePathUnencoded))}">
      </div>
    </a>
    <script>
      document.getElementById('cssbutton').addEventListener('click', () => {
        document.getElementById('imgcontainer').classList.toggle('imgcontainer');
      });
    </script>
  </body>
  `);
}

