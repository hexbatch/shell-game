

/**
 * @param {object} [raw_input]
 * @constructor
 */
function ShellGameVariable(raw_input ) {
    this.variable_name = '';
    this.variable_initial_value = null;
    this.variable_current_value = null;

    if (!$.isPlainObject(raw_input)) { throw new ShellGameVariableError("raw_input is not an object");}

    if ('variable_name' in raw_input) {
        if (!(typeof raw_input.variable_name === 'string' || raw_input.variable_name instanceof String)) {
            throw new ShellGameVariableError("variable_name is not a string");
        }
        this.variable_name = raw_input.variable_name;
    }

    if ('variable_initial_value' in raw_input) {
        this.variable_initial_value = raw_input.variable_initial_value;
    }

    if ('variable_current_value' in raw_input) {
        this.variable_current_value = raw_input.variable_current_value;
    }
}


/**
 * @param {object} [raw_input]
 * @constructor
 */
function ShellGameGlom(raw_input) {
    this.glom_target_name = '';
    this.glom_current_value = null;

    if (!$.isPlainObject(raw_input)) { throw new ShellGameGlomError("raw_input is not an object");}

    if ('glom_target_name' in raw_input) {
        if (!(typeof raw_input.glom_target_name === 'string' || raw_input.glom_target_name instanceof String)) {
            throw new ShellGameGlomError ("glom_target_name is not a string");
        }
        this.glom_target_name = raw_input.glom_target_name;
    }

    if ('glom_current_value' in raw_input) {
        this.glom_current_value = raw_input.glom_current_value;
    }
}


/**
 * @param {object} [raw_input]
 * @constructor
 */
function ShellGameElement(raw_input) {

    this.element_name = '';
    /**
     * @type {ShellGameVariable[]}
     */
    this.element_variables = [];

    /**
     * @type {ShellGameGlom[]}
     */
    this.element_gloms = [];

    /**
     * @type {string}
     */
    this.element_script = '';

    if (!$.isPlainObject(raw_input)) { throw new ShellGameElementError("raw_input is not an object");}

    if ('element_variables' in raw_input) {
        if (!Array.isArray(raw_input.element_variables)) { throw new ShellGameElementError("raw element_variables is not an array");}

        for(let i = 0; i < raw_input.element_variables.length; i++) {
            let pre_node = raw_input.element_variables[i];
            if (!jQuery.isPlainObject(pre_node)) { throw new ShellGameElementError("raw element_variables node is not an object");}
            let variable  = new ShellGameVariable(pre_node);
            this.element_variables.push(variable);
        }
    }

    //check to make sure all variables have a unique name
    let checker = {};
    for(let i = 0;i < this.element_variables.length ; i++) {
        let n = this.element_variables[i];
        if (checker.hasOwnProperty(n.variable_name)) {
            throw new ShellGameElementError("Variables cannot have same names: found " + n.variable_name);
        }
        checker[n.variable_name] = 0;
    }

    if ('element_gloms' in raw_input) {
        if (!Array.isArray(raw_input.element_gloms)) { throw new ShellGameElementError("raw element_gloms is not an array");}

        for(let i = 0; i < raw_input.element_gloms.length; i++) {
            let pre_node = raw_input.element_gloms[i];
            if (!jQuery.isPlainObject(pre_node)) { throw new ShellGameElementError("raw element_gloms node is not an object");}
            let glom  = new ShellGameGlom(pre_node);
            this.element_gloms.push(glom);
        }
    }

    if ('element_script' in raw_input) {
        if (!(typeof raw_input.element_script === 'string' || raw_input.element_script instanceof String)) {
            throw "element_script is not a string";
        }
        this.element_script = raw_input.element_script;
    }

    if ('element_name' in raw_input) {
        if (!(typeof raw_input.element_name === 'string' || raw_input.element_name instanceof String)) {
            throw "element_name is not a string";
        }
        this.element_name = raw_input.element_name;
    }


}

/**
 * @param {object} yaml_parsed
 * @constructor
 *
 * Yaml String is array of ShellGameVariable
 */
function ShellGameRun(yaml_parsed) {



    if (!$.isPlainObject(yaml_parsed)) { throw new ShellGameRunError("yaml parsed is not an object");}
    if (!('elements' in yaml_parsed)) {throw new ShellGameRunError("yaml parsed does not have an elements member");}
    if (!Array.isArray(yaml_parsed.elements)) { throw new ShellGameRunError("yaml parsed element member is not an array");}

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

    this.step = function() {
        //do something with the elements and return them
        this.elements[0].element_script += " bitching!!";
        return this.elements
    }
}