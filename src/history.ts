import * as fs from 'fs';

//import {Mutex} from './mutex';

const historyFilepath = './history.json';
//const historyFileMutex = new Mutex();

export async function getHistory(): Promise<Array<string>> {
  const resultPromise: Promise<Array<string>> = new Promise(async resolve => {
    //await historyFileMutex.acquire();
    const accessError = await new Promise(resolve => {
      fs.access(historyFilepath, fs.constants.R_OK, error => {
        resolve(error);
      });
    });
    if (accessError) {
      console.log('failed to access history.json:\n' + accessError);
      resolve([]);
      return;
    }

    fs.readFile(historyFilepath, 'utf8', (error, data) => {
      if (error) {
        console.log('failed to read history.json:\n' + error);
        resolve([]);
        return;
      }
      let parsedHistory = null;
      try {
        parsedHistory = JSON.parse(data);
      } catch (error) {
        console.log('failed to parse json in history.json:\n' + error);
        resolve([]);
        return;
      }
      resolve(parsedHistory);
    });
  });
  resultPromise.then(() => {
    // TODO this pattern sucks
    //historyFileMutex.release();
  });
  return resultPromise;
}

export async function addToHistory(line: string) {
  const history = await getHistory();
  const resultPromise = new Promise(async resolve => {
    //await historyFileMutex.acquire();
    
    if (history.length > 25)
      history.shift();

    const repeatIndex = history.indexOf(line);
    if (repeatIndex >= 0)
      history.splice(repeatIndex, 1);

    history.push(line);

    fs.writeFile(historyFilepath, JSON.stringify(history, null, 2), error => {
      if (error)
        console.log('failed to write to history.json:\n' + error);
      resolve();
    });
  });
  resultPromise.then(() => {
    // TODO this pattern sucks
    //historyFileMutex.release();
  });
  return resultPromise;
}
