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
    div.menu > a,
    div.menu > a>h2,
    div.menu > button {
      display: inline;
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
    ${body}
  </body>
  `;
}

export function indexTemplate(history: Array<string>) {
  const historyListHtml = history
    .map(historyPath => {
      return `<div><a href=${encodeURI(path.join('/browse', historyPath))}>${historyPath}</a></div>`;
    }).reduce((accumulator, currentValue) => {
      return currentValue + '\n' + accumulator;
    });
  return wrapBody(`
  <a href="/"><h2>home</h2></a>
  <a href="/browse"><h2>browse</h2></a>
  <h2>last files:</h2>
  ${historyListHtml}
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
  <a href="/"><h2>home</h2></a>
  <h2>${relativePathUnencoded}</h2>
  <h3>${dirents.length} files</h3>
  ${contents}
  `);
}

export function renderReader(relativePathUnencoded: string): string {
  return wrapBody(`
  <body>
    <div class="menu">
      <a href="/"><h2>home</h2></a>
      <button id="cssbutton">css</button>
      <a href="${encodeURI(path.join('/prev', relativePathUnencoded))}"><h2>prev</h2></a>
      <span>${relativePathUnencoded}</span>
    </div>
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

