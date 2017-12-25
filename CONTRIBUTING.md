# Contributing to Med3Web

Thank you for considering contributing to Med3Web! There are many ways you can do this, you don't even
have to do coding at all. We would be happy to know about your use cases, your experience with the
viewer, your expectations.

According to the CI principles all the development occurs inside
the `master` branch.


## Reporting Issues

> Please **don't report sensitive / security issues** via public channels, try to contact
> maintainers privately first (e.g. at [Vladislav Shubnikov](Vladislav_Shubnikov@epam.com) or [Mariia Verdina](Mariia_Verdina@epam.com)).

We use [GitHub Issues](https://guides.github.com/features/issues/) to keep track of tasks,
enhancements, and bugs.
available.

## Development

> Please make sure maintainers are expecting your changes and will consider merging them into
> master. If the changes do not fit the project roadmap, it might unfortunately happen that
> you have wasted your time.

### Core developers: clone the origin

We will not use pull requests in our everyday life. Clone the main repository and start working
on `master` branch. Commit and push to the origin but make sure you do not ruin anything.

### External developers: fork and branch

Fork the project [on GitHub](https://github.com/epam/med3web) and clone your fork locally.
Check that everything works correctly.

```sh
# grab the project
git clone git@github.com:username/med3web.git
cd med3web
git remote add upstream https://github.com/epam/med3web.git
```

For developing new features and bug fixes, you should pull the `master` branch.

```sh
# create a branch
git checkout -b hotfix/great-fix-whatever -t origin/master
```

### Development language. Some important ECMA2016 syntax features.

Important language features are listed in
[JavaScript2016](http://2ality.com/2015/08/getting-started-es6.html)

### Coding standard and Autodocumentation standard

Project applies very strict rules to ECMA2016 script language. Please refer to 
[Airbnb style guide](https://github.com/airbnb/javascript)

Some thoughts about project future, features enchancement and other important improvements/fixes,
please see in [To Do list](LISTTODO.md)

### Commit

The commit message should describe what changed and why. The first line should:

- start from an uppercase verb in imperative mood,
- don't end with a period,
- be 50 characters or less.

## Prerequisites

### Node.js and Tools

Download link:
[NodeJS](https://nodejs.org/en/download/)

Version noit below than v.6.10.3 is required

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
To start working with sonar, plase dowwnload [SonarQube server](https://www.sonarqube.org/downloads/).
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
File 'sonar-project.properties' inthe project root is used to configure sonar scaner for this project. After SonarQube server is started, you can run
sonar tool, by typing in command line:
```
sonar-scanner
```
After completion of sonar scanner tool you can see scanning result in virtual host by address:
```
localhost:9000/dashboard/index/epam:med3web
```
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




