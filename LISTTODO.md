# TODO List

List of incomplete features in Med3Wewb project

## Dicom reader
- Support read several series inside single file folder. Now only 1 series is supported.

## Nifti reader
- Support big endian file bytes encoding (now only little endian is supported)
- Support "data type" 512 read (now only data type == 4 is supported)
- Support compressed nifti files (usually distributed in open web repositories)

## MHD reader
- Add reading data in the form of pair files XXX.mhd + XXX.raw, where mhd - is text volume description, raw - binary volume raw pixels

## 2D mode functionality
- Add area selection and measurement.
- Add image contrast enhancement, edges enhancement, non-rectangular area selection, automatic area selection, etc.

## Dicom tags
- In future tags edition functionality (probably) will be implemented. 
  For example: automatic removal personal information from data, automatic conversion tool to another file format.

## Different data sources support
- Add support read volumes from popular web storage clouds, like Amazon, etc.

## Project code issues

- Complete project autodocumentation (insert special comment tags). Update readme.md on this issue.
**STATUS:** Now auto documentation is partially built

- Add a lot of unit-tests, based on mocha framework. Write short instructions (how to use) in readme.md.
**STATUS:** Now first unit-test module has created. See project/test/loaders/voltools.js. Need more wide unit-test source code coverage.
- Add progress bar (or waiting animation) during dicom, files reading.
**STATUS:** More or less functional progress bar is added.
- Explore some tool for auto documentation coverage.
- Find and decide how to apply lint tool to the shader files.
**STATUS:** Now we have plan to adopt all project shaders to glslangValidator checking utility
- How to create autodocumentation on shader files.
- 2D mode. Display volume slice with color channel selection (r, g, b, a, all). For the non-1-byte pixel format volumes.
- Add more deep reaction on shader compilation errors. Now we have some non-obvious exception somewhere in code core.



