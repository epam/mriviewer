# Development notes

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
