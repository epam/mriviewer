# Contributing

## Getting started

0. Install [Git](https://git-scm.com/downloads) and [Node.js](https://nodejs.org/en/download/)
1. Run in Terminal:
```
$ git clone https://github.com/epam/mriviewer.git && cd mriviewer
$ npm i
$ npm start
```

## IDE Configuration

https://stackoverflow.com/questions/41920324/adding-spaces-between-imports-and-braces-in-webstorm

## Submitting changes

We are following [GitHub's Collaborating with Issues and Pull Requests Guide](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests)

## Demo data customization

### To add custom models to Demo files
Edit `/src/demo/config/config.js`, for example:

```
export default {
  demoPelvisPrefix : 'http://your.site.com/folder1/folder2/folder3/dicom/modelName1/',
  demoPelvisUrls : [
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
    ...
    'file9871.dcm',
  ],
  demoLungsPrefix: 'http://your.site.com/folder1/folder2/folder3/dicom/modelName2/',
  demoLungsUrls: [
    'name001.dcm',
    'name002.dcm',
    'name003.dcm',
    'name004.dcm',
    'name005.dcm',
    ...
    'name406.dcm',
  ],
};
```
Demo data should have at least 32 dcm files (slices).

