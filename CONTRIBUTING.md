# Contributing to Med3Web

Thank you for considering contributing to Med3Web! There are many ways you can do this, you don't even
have to do coding at all. We would be happy to know about your use cases, your experience with the
viewer, your expectations.

According to the CI principles all the development occurs inside
the `master` branch.

Some thoughts about project future, features enhancement and other important improvements/fixes,
please see in [To Do list](LISTTODO.md)

## Reporting Issues

> Please **don't report sensitive / security issues** via public channels, try to contact
> [maintainers](MAINTAINERS.md) privately first.

We use [GitHub Issues](https://guides.github.com/features/issues/) to keep track of tasks,
enhancements, and bugs.

## Development

### Core developers: clone the origin

Core developers have rights to push. So if you are one of them, then clone the main
repository and just start working on `master` branch. Commit and push to the origin
but make sure you do not ruin anything.

### External developers: fork and branch

External contributors are welcome to fork, branch and create pull-requests. 
Fork the project [on GitHub](https://github.com/epam/med3web) and clone your fork locally. 
Apply changes, run automated and manual tests to verify that everything works correctly.

```sh
# grab the project
git clone git@github.com:username/med3web.git
cd med3web
git remote add upstream https://github.com/epam/med3web.git

# create a branch
git checkout -b hotfix/great-fix-whatever -t origin/master
```

Before you commit and push, please ensure that the build is not broken.

### Development language. Some important ECMA2016 syntax features.

Important language features are listed in
[JavaScript2016](http://2ality.com/2015/08/getting-started-es6.html)


### Commit

The commit message should describe what changed and why. The first line should:

- start with a verb in imperative mood and with a small letter,
- don't end with a dot,
- be 50 characters or less.

E.g. "add dicom reader", "change style of 2d tools panel". The second line should be empty, and then details should follow if any.

Commit message consists of a title and body text (optional).
The title and body text are separated with empty line.
Body text can contain several lines.
Each line can start with '-', altogether representing a list of changes. 

### Build instructions, prerequisites, coding standard
Please read [DEVNOTES.md](DEVNOTES.md) for details.



