# Med3Web Dicom 2d/3d web viewer.

Copyright (c) 2015–2017 [EPAM Systems, Inc.](https://www.epam.com/)

Med3Web is a high performance web tool for advanced visualization (both in 2d and 3d modes)
medical volumetric data, provided in popular file formats: Dicom, Nifti, Ktx.
Med3Web can read local data from files/folders and from predefined web locations.
Demonstration project shows both (local data / remote data) usage types.
It works as a standalone HTML5 web application. The latest version can be used with
WebGL-enabled desktop browsers (Chrome, Firefox, Safari) and allow limited usage
with mobile browsers (Android Chrome). browsers are supported.


![Background image](app/images/med3web_logo.png)

## Market evaluation

Med3Web can be used in medical center with diagnostic equipment.
MRI and CT scanning results can be viewed in any computer (inside medical office and in the client home)
and qualified medical personnel can provide diagnosis or conclusion based on provided visualization.
Unlike the range of standalone Dicom viewers executables, this app can be used as web
application as a part of large web sites and services. Also it can be used by research institutes
due to Nifti file standard support (more popular for researchers rather then physicians).
Medical centers can create their clients database, based on this viewer.

## References

Dicom file format description can be found [here](http://dicom.nema.org/standard.html) and [here](https://www.leadtools.com/sdk/medical/dicom-spec)
Ktx file format details are listed in [KTX](https://www.khronos.org/opengles/sdk/tools/KTX/file_format_spec/).
Popular Dicom loader framework: [GDCM](http://gdcm.sourceforge.net/wiki/index.php/Main_Page)
Some JavaScript libraries to work with Dicom file format:
1. [dicomParser](https://github.com/chafey/dicomParser)
2. [Daikon](https://github.com/rii-mango/Daikon)
3. [Xtk](https://github.com/xtk/X#readme)

## 3d volumetric rendering idea in a few words

Three.js is used as some gateway to WebGL renderer. Current Three.js version is not supported 3d textures,
so we use tricky way to build 2d texture from initial 3d texture by linking 2d slices all together
as a large tile map. This idea (with source codes) can be seen in project [WebGL Volume Rendering](https://github.com/lebarba/WebGLVolumeRendering)

## Project documentation

Introduction to the project can be loaded here:
[Application user interface documentation](docs/general/README.md)

## Demo app
[Here](https://epa.ms/mri) you can find a demo app.

## More datasets
[Here](http://obsolete.tuberculosis.by/getpatientimages) you can download more dicom datasets.

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
[NodeJS](https://nodejs.org/en/download/)

Version not below than v.6.10.3 is required

After NodeJS installation please check that everything is installed correctly (for example, PATH ), using command:
```
node --version
```
Stdout should be
v6.10.3 (or higher)

Then, please install gulp:

```
npm install -g gulp-cli
```


## Project running details

All gulp targets are listed in:
gulpfile.babel.js

For the virtual server create process, all source file are "merged" into single file bundle.js which can be found in:
./.tmp/scripts

### Browser support
Currently only Chrome, Firefox, Safari browsers are supported. Other browsers can be used but with performance slowdown and other
rendering artefacts. Mobile browsers are not currently supported, but some of them can be used with performance problems and so on.


### Important note concerning project running modes
App can be run in 3 modes:
1. Run remote web app. Steps: build app locally, performing command "gulp build", then copy ready web app (from "dist" folder) to your server.
2. Run local web app under virtual server. Steps: run command "gulp server"
3. Run local web app. Steps: Build app via command "gulp build" and open file <LocalProjectLocation>/dist/index.html in your browser.
Important note: Local run mode (3) is not completely working under Google Chrome browser due to its strong security policy concerning local files opening.
Other browsers has no such strong security restrictions and can be used. Local run (mode 3) is not recommended way to use this application.


### Build and Run

```
gulp serve
```

If browser is not running, please open browser manually and run in command line:

```
localhost:9000
```


### Build auto documentation

```
gulp docs
```

Result will be in folder docs/auto


### Build project ready for server upload

```
gulp build
```

Result folder will be in folder 'dist'.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License
Please read [LICENSE](LICENSE) for details.
