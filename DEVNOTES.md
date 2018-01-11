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

### Build project ready for server upload

```
gulp build
```

Result folder will be in folder 'dist'.
