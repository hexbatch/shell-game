# Used to Practice and Refine Shells

Version 0.1

## First version is pretty bare bones. A yaml editor, a start button and a step button 

There is no support for shells here, its just elements running in a single shell

####to install:
run `yarn` at the root to install the js libraries

####To use:
Add in a new yaml or copy and paste it from somewhere, and press the run button to load in the elements and start fresh. 
watch things change in the yaml or in the debugger by pressing the step button

### Most of the screen has the big yaml editor, to the side are two buttons start and step

* The yaml will be an array of elements
* Each element has the following fields in the yaml
    * Name
        * The name needs to be unique
    * Variables
        * each variable has name, value, and initial value, if no initial value default will be null at start
        * the value can be anything
        * Any variable can be used as a target for a glom
    * Gloms
        * each glom has a name and value and on
        * name must match a variable from any other element
        * the name is always there 
        * value is cleared at the beginning of each step, set to null, and updated with the variable value during the glomming phase
        * the on is by default true, so if missing the glom will be used. To turn off the glom, set to 0 or false. On is 1 or true
    * Script
        * The javascript which runs for the elements during the execute phase.
        * The defined variables defined by a let in each code block so the script can work with these
        * The script can update any of the variables
        * The gloms are defined with const in the block
    * Error
        * If an error happens, then the error message will be placed here

### Pressing the Start button will initilize the yaml

* the yaml will be parsed and checked for unique names in each element, any glom values will be nulled out
* the yaml in the editor will be updated with these changes

### Pressing the Step button will do one cycle of the elements

* First all the elements, in an undefined order, will try to glom and successes will fill the value of the glom
   * If a glom on value is falsy, then will not try to glom 
   * If a glom is not found, the value will be null
   * If more than one glom is found, then a random choice will be made
   * The glom values will be updated in the element in memory 
* Second all the elements, in an undefined order, will run their scripts
   * The script string will have a generated let and const definitions for the variables and gloms be prepended.
     So any declarations using the same names will be an error
   * The script string will have a function call appended to the bottom that will have all the variables
     be passed in with their names and values 
       * This function will update the array of elements in memory
   * The script string will be evalled, inside a handler to catch any exceptions ,
     and exception will have its message put in the array node in memory
* Third the yaml in the editor will be updated from the memory 

Then the page will wait for the next step button press


## Development Reference

* [Bootstrap](https://getbootstrap.com/)
* [Ace JS library](https://ace.c9.io/) 
* [Making MIT license](https://license-generator.intm.org/)
* [Bootstrap 4 toast wrapper](https://github.com/Script47/Toast)
* [Yaml Library](https://github.com/nodeca/js-yaml)
* [Lodash](https://lodash.com/)


## Todo

[Add Badges to other things](https://shields.io/category/version)
