# Shell Emulator For the HexBatch project

The hexbatch project has code executing as elements inside shells. This program is used to test some concepts

### Version 0.2

This version has the basic storage and operations. Its basically a YAML editor with three buttons

![image](https://user-images.githubusercontent.com/725763/111222848-60ce4f00-85aa-11eb-9f68-78b1f48862a9.png)


The next version after this will have more of a gui. The state will still be stored in the yaml though. 
So, all the below will be used in the next version. 

The future gui will make it easier to design and test out shell and element concepts, and add in higher order behavior implemented by 
using the yaml and data structures in this version. As of version 0.2, all the code and yaml works

## First version is pretty bare bones. A yaml editor, a load button and a step button , and a add button

Edit the yaml directly to set things up

#### To install:

run `yarn` at the root to install the js libraries

#### To Run:

Load in index.html in a web browser. You do not need a local server here, just the files on disk

#### To use:

* Add in a new yaml or copy and paste it from somewhere, and press the start button to load in the yaml text. 
* Watch things change in the yaml by pressing the step button
* Insert New Shell Copies with the Add Button

### Most of the screen has the big yaml editor, to the side are two buttons start and step
Please refer to the yaml example below at the bottom of the page , or see yaml/testing.yaml 

* The YAML Document is only automatically read from and written to under the `game:` key, so you can add anything else in other keys
  Here, in the example I put in an author, date and notes
* Under the game key there are three sections
  * `element_lib:` Defines the different elements shells can use. While any shell can mix and match elements,
    or the element can only appear in one shell if needed; all the elements are listed here in no particular order . 
    Each element starts its name as the key its under, and has the following subkeys
    
    * `element_name`
        * The name of the element needs to be unique, its an error to name two different elements the same name
      
    * `element_variables`
        * The Variables used in the element are defined here. Each variable is entered under its name 
          and has the following keys
          * `variable_name` The name of the variable. Each variable needs to be a different name inside the element.
            But, any elements can use the same names. Variable names need to be valid js syntax
          * `variable_initial_value` 
            What the starting value will be if not otherwise set by the running_shells section ( talked about further down). 
            If this is not set, then the initial value will be null. Any valid javascript primitive value (string number boolean null)
            will be fine here
   
    * `element_gloms`
        * The Gloms used in the element are defined here. Each glom is entered under its own name, and has the folowing keys
          * `glom_target_name` This is the name of the variable, in other elements of the shell or in the shells in the chain above,
          that this glom will try to find
          * `glom_reference_name` This is the the name the glom value is referred to in the script of the element.
            Its only used in its own element. Glom names need to be unique among variables and gloms inside each element. 
            Glom names need to be valid javascript syntax
            Different elements can used the same glom names  
        
    * `element_script`
        * The javascript which runs inside the element when a step happens
        * the *this* keyword will be having the variables and gloms, so can reference this.glom_reference_name or this.variable_name
  
  * `shell_lib` Defines the shells that can be used. Each shell has a parent, and name, and a list of variables it uses. 
    Each shell is entered under its own name and has the following keys
    * `shell_name` the name of the shell
    * `shell_parent_name` all shells, except a top shell, has a parent
    * `elements` an array of elements it uses, each element object here has two keys
      * `element_name` The name of the element which is already defined in the *element_lib* section
      * `element_init`  Has two possible values, **new** or **find** , if new , then the variable is initilized fresh 
        (using the init value defined above for it), if find then the element is only added if it exists in a parent or ancestor already
        If the variable is found ok, then it has the same starting value as the current one it finds.
        The search will go from the parent on to the top shell and stop as soon as it finds a match 
        
  * `running_shells` stores the current information for the stepping, it is refreshed in the yaml after each step, automatically.
     And when the *Load* button is pressed the next step will read from whatever state is in the running_shells now
     Each shell is entered under its own name, and if more than one shell is there, then this is an array of objects under the key
     . Each running shell entry has the following keys
    * `shell_elements` contains the current state of the elements and all its variables and gloms. Each element is entered under its name
      . Each element object here has the following keys
      * `gloms` under which are key values with the glom reference name, and its current value. Unset gloms are always null
      * `variables` have key values with the name of the variable, and its current value
    * `shell_children` has any child shells defined under here. So, because there is only one top shell, it means all the other shells will 
      be entered under the top shell shell_children, or nested further on down in other levels after that


      

### Pressing the Load button will parse the yaml from text and build up the objects in the javascript

* the yaml will be parsed and checked for following the rules, then the yaml will be copied back out to replace the text that was loaded
* Useful to see if the yaml and code works okay 

### Pressing the Step button will do one cycle of the elements

* The YAML is read in again each time the button is pressed, so you can make edits here to the yaml in between

* The elements in each shell, from the inner most shells to the top shell in that order, will try to glom and then run their javascript

* Gloms work by looking for the elements in the current shell, and if not there, will keep looking up to the next parent until it gets to the top

* Once all the glomming is done, then the scripts for each element are run. And the order is the same , run from the inner most shell to the top shell

* After the step, the yaml is updated on the screen and the *running_shells* section will have the new values

* If you want to remove a shell, just delete it from the *running_shells*


### Pressing the Add button will add a shell under its parent

You only need to start with an empty top shell that is running, and then can add in shells as you want.
 There can be unlimited siblings that are the same shell, but each of these can be set with different values

The select box will list all the non topmost shells, the new shell instance will set its element's variables according to its
*element_init* setting (new or find)


## Development Reference

* [Bootstrap](https://getbootstrap.com/)
* [Ace JS library](https://ace.c9.io/) 
* [Making MIT license](https://license-generator.intm.org/)
* [Bootstrap 4 toast wrapper](https://github.com/Script47/Toast)
* [Yaml Library](https://github.com/nodeca/js-yaml)
    * [Intro To YAML](https://www.cloudbees.com/blog/yaml-tutorial-everything-you-need-get-started/)
* [Lodash](https://lodash.com/)
  
* [JsDoc lookup](https://jsdoc.app/tags-type.html)



## Todo

[Add Badges to other things](https://shields.io/category/version)


## Example YAML

```yaml
author: Will
date: 2021-03-14
notes: first test
game:
  element_lib:
    first:
      element_name: "first"
      element_variables:
        apple:
         variable_name: apple
         variable_initial_value: 1
        baker:
          variable_name: baker
          variable_initial_value: 'a string will go here'
        my_const:
          variable_name: my_const
          variable_initial_value: 22
      element_gloms:
        x:
          glom_target_name: 'xer'
          glom_reference_name: 'x'
        y:
          glom_target_name: 'yer'
          glom_reference_name: 'y'
      element_script: |
        this.apple = this.x * this.y + (this.apple* this.my_const)/10;
        this.baker = this.y + ' is y value';

    second:
      element_name: 'second'
      element_variables:
        xer:
          variable_name: xer
          variable_initial_value: 1
        yer:
          variable_name: yer
          variable_initial_value: 1
      element_gloms: {}
      element_script: |
        this.xer ++;
        this.yer --;

  shell_lib:
    main:
      shell_name: main
      shell_parent_name: null
      elements:
        - element_name: first
          element_init: new
        - element_name: second
          element_init: new
    other:
      shell_name: other
      shell_parent_name: main
      elements:
        - element_name: first
          element_init: find


  running_shells:
    main:
      - shell_elements:
          first:
            variables:
              apple: -10101
              baker: 'inititted b'
            gloms:
              x: 28,
              y: -527
          second:
            variables:
              xer: 100
              yer: -100
            gloms: []
        shell_children:
          other:
            - shell_elements:
                first:
                  variables:
                    apple: 25
                  gloms:
                    x: 0.125
            - shell_elements:
                first:
                  variables:
                    apple: 5
                    baker: 'bottom of the barrel'
                  gloms: { }

```