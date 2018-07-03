import {ext, parse} from './id-utils';

export default class PackageReader {
  constructor(locator) {
    this.locator = locator;
    this._readFile = this._readFile.bind(this);
  }

  readPackageJson() {
    if (this.hasOwnProperty('mainPath')) return Promise.resolve();

    return this.locator('package.json').then(file => {
      const meta = JSON.parse(file.contents);
      this.name = meta.name;

      let main = meta.main || 'index.js';
      if (main.startsWith('./')) main = main.substr(2);
      if (main.endsWith('/')) main = main.substr(0, main.length - 1);

      return this._targetPath(main);
    }).then(mainPath => {
      this.mainPath = mainPath;
      this.parsedMainId = parse(mainPath);
    });
  }

  _targetPath(id) {
    if (ext(id)) {
      return Promise.resolve(id);
    } else {
      const fileRef = id + '.js';
      const folderRef = id + '/index.js';
      // when main is "lib", it could means lib.js or lib/index.js
      return this.locator(fileRef).then(
        () => fileRef,
        () => {
          return this.locator(folderRef).then(() => folderRef);
        }
      );
    }
  }

  readMain() {
    return this.readPackageJson().then(() =>
      this.locator(this.mainPath).then(file => ({
        path: file.path,
        contents: file.contents,
        moduleId: this.name + '/' + this.parsedMainId.bareId,
        packageName: this.name
      }))
    );
  }

  readResource(resource) {
    return this.readPackageJson().then(() => {
      let parts = this.parsedMainId.parts;
      let len = parts.length;
      let i = 0;

      const findResource = () => {
        if (i >= len) new Promise.reject(new Error("could not find " + resource));

        let resParts = parts.slice(0, i);
        resParts.push(resource);

        let fullId = resParts.join('/');

        return this._targetPath(fullId).then(
          this._readFile,
          () => {
            i += 1;
            return findResource();
          }
        );
      }

      return findResource();
    });
  }

  _readFile(filePath) {
    return this.locator(filePath).then(file => ({
      path: file.path,
      contents: file.contents,
      moduleId: this.name + '/' + parse(filePath).bareId,
      packageName: this.name
    }));
  }
}
