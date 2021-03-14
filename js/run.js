
/**
 * @param {object} yaml_parsed
 * @constructor
 *
 * Yaml String is array of ShellGameVariable
 */
function ShellGameRun(yaml_parsed) {


    /**
     * @type {ShellGameElementLib}
     */
    this.element_lib = null;

    /**
     * @type {ShellGameShellLib}
     */
    this.shell_lib = null;

    if (!$.isPlainObject(yaml_parsed)) { throw new ShellGameRunError("yaml parsed is not an object");}
    if (!('element_lib' in yaml_parsed)) {throw new ShellGameRunError("yaml parsed does not have an element_lib member");}
    if (!('shell_lib' in yaml_parsed)) {throw new ShellGameRunError("yaml parsed does not have an shell_lib member");}

    this.element_lib = new ShellGameElementLib(yaml_parsed);

    this.shell_lib = new ShellGameShellLib(yaml_parsed,this);


    let elements_raw = yaml_parsed.elements;

    /**
     * @type {ShellGameElement[]}
     */
    this.elements = [];

    for(let i = 0; i < elements_raw.length; i++) {
        let pre_node = elements_raw[i];
        if (!$.isPlainObject(pre_node)) { throw "raw element node is not an object";}
        let element = new ShellGameElement(pre_node);
        this.elements.push(element);
    }

    this.init = function() {
        //step all the functions
        for(let i = 0; i < this.elements.length ; i++) {
            this.elements[i].init_element();
        }
    }

    this.glom = function() {
        //build a lookup of all the variable values in the run
        //each value is keyed by the variable name
        // if there is only one variable by the same name, it will be an array of one
        //if there is more than one variable value, then the lookup will have an array of more than one value for that variable name
            // and the gloms will randomly choose which element
        let lookup = {};
        for(let e = 0; e < this.elements.length; e++) {
            let variables = this.elements[e].element_variables;
            for (let v = 0; v < variables.length; v++) {
                let variable = variables[v];
                if (!lookup.hasOwnProperty(variable.variable_name)) {
                    lookup[variable.variable_name] = [];
                }
                lookup[variable.variable_name].push(variable.variable_current_value);
            }
        }

        for(let e = 0; e < this.elements.length; e++) {
            let gloms = this.elements[e].element_gloms;
            for (let g = 0; g < gloms.length; g++) {
                let glom = gloms[g];
                if (lookup.hasOwnProperty(glom.glom_target_name)) {
                    let ar = lookup[glom.glom_target_name];
                    glom.glom_current_value = _.sample(ar);
                } else {
                    glom.glom_current_value = null;
                }
            }
        }


    }


    this.step = function() {
        //step all the functions
        for(let i = 0; i < this.elements.length ; i++) {
            this.elements[i].step_element();
        }
    }


}








