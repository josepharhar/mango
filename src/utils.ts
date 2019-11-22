import * as url from 'url';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

const readdirPromise = util.promisify(fs.readdir);

export async function getRelativeFilepathsInDir(rootpath: string, currentpath: string): Promise<Array<string>> {
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

export function parseUrl(servePath: string, reqUrl: string) {
  const parsedUrl = url.parse(reqUrl);
  const relativePath = decodeURI(parsedUrl.pathname);
  // TODO make sure relativePath doesnt use .. for secuutiry
  const absolutePath = path.join(servePath, relativePath);
  return {relativePath, absolutePath};
}
