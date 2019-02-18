# Autodocumentation standard on the Med3Web project

It is required to keep autodocumentation standard [JSDOC](http://speakingjs.com/es5/ch29.html) from the very
early stage of the development process. This is important action to make project source code more understandable,
buggy free and easy maintainable in the future.

Good [JSDOC](http://2ality.com/2011/08/jsdoc-intro.html) tutorial can be used to make your autodocumentation better.

## Source file beginning

In the fist rows of source text file (with *.js extension) you need to add keyword **@module**

```
/**
* KTX header structure descriptor
* @module app/scripts/loaders/ktxheader
*/

```

## Class description

Before class description start it is required to add special comment with keyword **@class**

```
/**
* Class KtxHeader represent header for KTX file
* @class KtxHeader
*/

```
