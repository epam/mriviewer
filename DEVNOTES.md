# Development notes

## Coding standard
Please read [CODINGSTD.md](CODINGSTD.md) for details.

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

Start operations in order to load all required Node.js packages:

```
cd med3web
npm install
```

### Troubleshooting

If you use Node.js v.8.x.x, you may face node-sass installation issue. Please use lower version of Node.js or run command:
```
npm install node-sass@latest
```

### SonarQube 

In order to maintain project code clean and buggy-free as much as possible, SonarQube technology is used.
To start working with sonar, please download [SonarQube server](https://www.sonarqube.org/downloads/).
After installation, start Sonar server, run command:
```
Windows:
C:\sonarqube\bin\windows-x86-xx\StartSonar.bat
Other OS:
/etc/sonarqube/bin/[OS]/sonar.sh console

```
Important note: before sonar scanner start, you need to run test coverage utility, 
which will create file 'coverage/lcov.info' (this file is used by sonar scanner)
In order to run scanner, you need to install [SonarQube scanner](https://docs.sonarqube.org/display/SCAN/Analyzing+with+SonarQube+Scanner).
File 'sonar-project.properties' in the project root is used to configure sonar scanner for this project. After SonarQube server is started, you can run
sonar tool, by typing in command line:
```
sonar-scanner
```
After completion of sonar scanner tool you can see scanning result in virtual host by address:
```
localhost:9000/dashboard/index/epam:med3web
```

## Build instructions

### Run & Debug

```
gulp serve
```

If browser is not running, please open browser manually and run in command line:

```
localhost:9000
```
### Check sources for coding standard compliance with ESLint

```
gulp lint:js > style_err.txt
```
File style_err.txt contains style and logic errors


### Build auto documentation

```
gulp docs
```

Result will be in folder docs/auto

### Run unit-tests

Mocha framework is used for unit-tests. To run tests, run command:

```
gulp test
```
Result will be in standard output

Check unit-test coverage, run command:
```
gulp test:cover
```
See result in coverage/lcov-report/index.html

### Run functional tests (with Selenium webdriver)
Check you have installed Chrome browser before run functional tests
```
gulp test:e2e
```

### Build project ready for server upload

```
gulp build
```

Result folder will be in folder 'dist'.

## Loading volume on application startup

There are 2 ways to load some volume on application startup:

1) Load volume, placed in local application folder structure
2) Load volume, referenced by URL from some remote location in Web.

You need to write reference to loaded on stratup file in project/tools/config.js.
Both ways with more details:

1) You can place some file in ProjectFolder/app./data folder. 
For example, 'lungs.ktx' is already placed here to illustrate loading posibilities.
In this case you need to setup config.data.onloadsrc: 'data/lungs.ktx',
Implementing this way, you can place some not-very-large files directly 
inside web app build and this file will be acessed locally by application.
Pros: loading can be quick. Cons: Application build will contains this file inside.

2) You can place some files (single *.ktx file or folder with a lot of *dcm files) somewhere
on your web site and Med3Web application will load this file(s) from specified URL on startup stage.
If you need to load KTX file on startup, please put your somevolume.ktx file 
to your location and specify URL like:
config.data.onloadsrc: 'http://yoursite.com/folder1/folder2/somevolume.ktx'

If you need to load folder with *.dcm files, you need to put all your dcm files in
seperate folder (containing only these dcm files) and create special file
'file_list.txt' with just list of all files. You can create file_list.txt by running command in dcm folder:
```
dir *.dcm /w /b > file_list.txt
```
After that yo need to specify URL in tools/config.js like:
config.data.onloadsrc: 'http://yoursite.com/folder1/folder2/folder3',
where folder3 is final folder, contained all dcm files.

Also, you can read a lot of comments in tools/config.js : data description
