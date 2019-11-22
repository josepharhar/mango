import * as fs from 'fs';
import * as path from 'path';

export function indexTemplate(history: Array<string>) {
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

export function renderDir(relativePathUnencoded: string, dirents: Array<fs.Dirent>): string {
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

export function renderReader(relativePathUnencoded: string): string {
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

