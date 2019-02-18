 
# Med3Web project coding standard

## Debugging

Display object data:
- Inside integrated development environment (most correct way)
- Using web app gui (may be, good way too)
- Using console.log(msg)
- Using alert(msg) (should be strongly avoided)


There are (at least) 2 methods to see console.log content:
- Open console output window in your development environment / browser (usually by pressing F12 key)
- Install [Firefox Developer Edition v54.0a2](https://www.mozilla.org/ru/firefox/developer/) and press Ctrl+Shift+K, or select menu command Settings/Web Console

## Coding standard

Project applies very strict rules to ECMA2016 script language. Please refer to 
[Airbnb style guide](https://github.com/airbnb/javascript)

This coding standard is written with 3 most important project targets. Also this is connected to open source project life cycle.
- ES2016 (ES6) programming language. This is some kind of great extension of the standard JavaScript language. Allow to build code close to C++ and other high-level strict syntax languages
- Source code quality is automatically checked by EsLint node package, which is configured as eslint-config-airbnb-base. You can check project syntax using command: **gulp lint:js > style_err.txt**
- You can build auto documentation from the source code using gulp-jsdoc3 node package. Run in command line: **gulp docs**

> IMPORTANT !!!

Before making any new commit into project, please run Eslint + Jsdoc to be ensure that your commit does not add errors.
The reason why you should do both these command - Jsdoc parser is significantly more strict in comparison with parser in EsLint.

#### Coding standard rules list

Source code rule list can be found in:
YourProjectFolder/node_modules/eslint-config-airbnb-base/rules


## Some important rules for source code maintain

### Source text file (file somename.js) should be ended with exactly 1 empty string

This requirement is taken from some old-dusted cores of unix-programmig. Also you can't use more then 1 empty string.

### Spaces at the end of each line of the source text

Any line of source code (even including comments) should not contain spaces or tab characters at the end.
This is error type: Trailing spaces not allowed              no-trailing-spaces

### Using  let or const instead of var

Since the project is developed on a superset JavaScript - the ES2015 language, then instead of the declaration
variable / object via var (this is worm-bound by the scope of the variable / object)
You need to declare a variable or object using let or const. It is desirable to strive for
to the maximum use of const (as far as possible). This is an error of type Unexpected var, use let or const instead of no-var.

~~WRONG CODE~~
```
var a = 6;
```

**CORRECT CODE**
```
const a = 6;
```

~~WRONG CODE~~
```
var a = 6;
a = a + 2;
```

**CORRECT CODE**
```
let a = 6;
a = a + 2;
```

### Using a single quote instead of double quote

For almost all string constants, you need to use a single quote.
This is a violation of the Strings must use single quote quotes.

~~WRONG CODE~~
```
import THREE from "n3d-threejs";
```

**CORRECT CODE**
```
import THREE from 'n3d-threejs';
```


### Unnecessary quotes when declaring object properties

It should avoid using a single quote when declaring properties of an object. So intuitively you might want to,
considering the JSON standard, but inside * .js modules so is not needed.
This is a violation of the type Unnecessarily quoted property 'propertyName' found quote-props.

~~WRONG CODE~~
```
const params = {
  dimension: 256,
  'numSpheres': 48,
};
```

**CORRECT CODE**
```
const params = {
  dimension: 256,
  numSpheres: 48,
};
```

### Avoid using lowercase concatenation

If you want to create a string from parts, you need to use a mechanism that resembles printf-formatting.
This is a violation of the type Unexpected string concatenation prefer-template.

~~WRONG CODE~~
```
console.log('Now loading ' + strUrl + ' ...');
```

**CORRECT CODE**
```
console.log(`Now loading ${strUrl} ...`);
```

### After the comment symbol from the double division sign, one space is needed

Stylistics of comments should provide for one space

~~WRONG CODE~~
```
//create geometry
```

**CORRECT CODE**
```
// create geometry
```


### Chained assignment

You cannot do chain assignment in one line. For some reason, it is believed that such code is worse read and potentially bug-dangerous.

~~WRONG CODE~~
```
const a = b = c = 5;
```
**CORRECT CODE**
```
const a = 5;
const b = 5;
const c = 5;
```

### Spaces after and before curly braces

After the opening brace and before the closing brace there must be one space.
This is an error of the type A space is required before '}' object-curly-spacing

~~WRONG CODE~~
```
const someObject = {feature1: 123};
```

**CORRECT CODE**
```
const someObject = { feature1: 123 };
```

### Spaces before and after the signs of operations

When writing expressions, you need to put one space before and after the sign of the operation

~~WRONG CODE~~
```
width = (width < 1600)? width: 1600;
```

**CORRECT CODE**
```
width = (width < 1600) ? width : 1600;
```

~~WRONG CODE~~
```
const c = a+b;
```

**CORRECT CODE**
```
const c = a + b;
```


### Setting up the opening and closing braces that bound the code block

Curly brackets should be placed in a strict unix-style, which assumes no symmetry in the vertical direction.

~~WRONG CODE~~
```
if (someCondition) 
{
  doActionOnTrueCondition();
}
else
{
  doActionOnFalseCondition();
}

```

**CORRECT CODE**
```
if (someCondition) {
  doActionOnTrueCondition();
} else {
  doActionOnFalseCondition();
}
```

### Blank lines in blocks

You cannot leave blank lines in code blocks.
This is an error of the type Block must be padded by blank lines padded-blocks.

~~WRONG CODE~~
```
if (someCondition) {
  doAction1();

  doAction2();
}
```

**CORRECT CODE**
```
if (someCondition) {
  doAction1();
  doAction2();
}
```

### Mandatory final point in the list of component parts of the object when it is declared

This is an error of the Missing trailing comma comma-dangle type.

~~WRONG CODE~~
```
const params = {
  dimension: 256,
  numSpheres: 48
};

```

**CORRECT CODE**
```
const params = {
  dimension: 256,
  numSpheres: 48,
};
```

### Using unary operations in the case of complex assignments

This is a bug of the Unary operator type '++' used no-plusplus.

~~WRONG CODE~~
```
for (let z = 0; z < zDim; z++, zOff += xDim * yDim) {
```

**CORRECT CODE**
```
for (let z = 0; z < zDim; z += 1, zOff += xDim * yDim) {
```

### Using an assignment with an operation instead of just assigning + an operation

~~WRONG CODE~~
```
ave = ave + hist[i];
```

**CORRECT CODE**
```
ave += hist[i];
```



### Using arrow functions and using jQuery and "on" instead of directly assigning callbacks

To create interfaces with elements of the DOM hierarchy for an HTML document, you need to use
so called arrow functions and use the purpose of the listener.
This is due to the very unfortunate behavior of this when writing the callback function in
"old" JavaScript style.

This violation is accompanied by a preemptive type Unexpected unnamed function func-names.

~~WRONG CODE~~
```
let buttonOpenIcon0 = document.getElementById("button-open-icon");
buttonOpenIcon0.onclick = function(event) {
  doSomethingWith(event);
};
```

**CORRECT CODE**
```
let buttonOpenIcon0 = $("#button-open-icon");
buttonOpenIcon0.on('click', (event) => {
  doSomethingWith(event);
});

```

## Declaring Constants Within Classes

It is important to correctly declare constants within classes

~~WRONG CODE~~
```
export default class KtxHeader {
  static KTX_GL_RED = 0x1903;
}
```

**CORRECT CODE**
```
export default class KtxHeader {
}
KtxHeader.KTX_GL_RED = 0x1903;
```


---------------------------------------------------------------------------
## Important Notes in Connection with the Use of the JSDOC3 Auto documenter
---------------------------------------------------------------------------

### You cannot leave a final comma in the last argument of a function or class method

~~WRONG CODE~~
```
  const mt = new THREE.Matrix4();
  mt.set(ma[0], ma[1], ma[2], 0.0,
           ma[3], ma[4], ma[5], 0.0,
           ma[6], ma[7], ma[8], 0.0,
           0.0, 0.0, 0.0, 1.0,);
```

**CORRECT CODE**
```
  const mt = new THREE.Matrix4();
  mt.set(ma[0], ma[1], ma[2], 0.0,
           ma[3], ma[4], ma[5], 0.0,
           ma[6], ma[7], ma[8], 0.0,
           0.0, 0.0, 0.0, 1.0);
```

#### You cannot move arguments to the next line when calling functions or methods

~~WRONG CODE~~
```
  const vec = new THREE.Vector3();
  vec.set(
           0.0,
           0.0,
           0.0
         );
```

**CORRECT CODE**
```
  const vec = new THREE.Vector3();
  vec.set(0.0,
          0.0,
          0.0);
```

