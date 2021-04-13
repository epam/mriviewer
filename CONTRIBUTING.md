# Development notes

## Getting started

Load project from git server:
```
git clone https://github.com/epam/med3web.git
```

Start operations in order to load all required Node.js packages:
```
cd med3web
npm install
```

## Prerequisites

### Node.js and Tools

Download link:
[NodeJS](https://nodejs.org/en/download/).

Version not below than v.6.10.3 is required.

After NodeJS installation please check that everything is installed correctly (for example, PATH ), using command:
```
node --version
```
Stdout should be
v6.10.3 (or higher).

## Project installation on local machine
Run command 
```
npm install
```
to download all required for this project nodeJS packages


# Build and run

All build commands performed via npm interface. Please, see commands details in package.json nfile.

## Start app on local server

```
npm run start
```

Start app on local virtual server:
localhost://3000

## Lint project

```
npm run lint
```

You will see lint result

## Perform auto-tests

```
npm run test
```

Run all auto - tests for project. *.test.js files will be used for test run

## Create autodocumentation

```
npm run doc
```

See results in esdoc folder

## Create app build for project deploy on server

```
npm run build
```

See results in build folder


## Project customization

### References to your own demonstration data
Open -> Demo models Open allows to add some predefined data to the app
in the demonstrational puproses.
You can change <project>/src/demo/config/config.js file to add your own
data.

#### Data declaration
Here example of config.js modification:
```
export default {
  demoWomanPelvisPrefix : 'http://your.site.com/folder1/folder2/folder3/dicom/modelName1/',
  demoWomanPelvisUrls : [
    'file0001.dcm',
    'file0002.dcm',
    'file0003.dcm',
    'file0004.dcm',
    'file0005.dcm',
    'file0006.dcm',
    'file0007.dcm',
    'file0008.dcm',
    'file0009.dcm',
    'file0010.dcm',
    'file0011.dcm',
  ],
  demoLungsPrefix: 'http://your.site.com/folder1/folder2/folder3/dicom/modelName2/',
  demoLungsUrls: [
    'name001.dcm',
    'name002.dcm',
    'name003.dcm',
    'name004.dcm',
    'name005.dcm',
    'name006.dcm',
  ],
};
```
Remember, nice demo data should have at least 32 slices (dcm files)

#### Source code modification

In your code you can add remote dcm file loading procedure in the following way:
```
  const arrFileNames = [];
  arrFileNames.push('http://your.site.com/folder/file00001.dcm');
  arrFileNames.push('http://your.site.com/folder/file00002.dcm');
  arrFileNames.push('http://your.site.com/folder/file00003.dcm');
  // ...
  const store = this.getGlobalStorePointer();
  const loader = new LoaderUrlDicom(store);
  loader.loadFromUrlArray(arrFileNames);
```
