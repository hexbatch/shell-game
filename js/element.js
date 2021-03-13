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
     * @type {?string}
     */
    this.element_script = '';

    if (!$.isPlainObject(raw_input)) { throw new ShellGameElementError("raw_input is not an object");}

    if ('element_name' in raw_input) {
        if (!(typeof raw_input.element_name === 'string' || raw_input.element_name instanceof String)) {
            throw "element_name is not a string";
        }
        this.element_name = raw_input.element_name;
    }

    if ('element_variables' in raw_input) {
        if (!Array.isArray(raw_input.element_variables)) { throw new ShellGameElementError('Element ' + this.element_name + ": raw element_variables is not an array");}

        for(let i = 0; i < raw_input.element_variables.length; i++) {
            let pre_node = raw_input.element_variables[i];
            if (!jQuery.isPlainObject(pre_node)) { throw new ShellGameElementError('Element ' + this.element_name + ": raw element_variables node is not an object");}
            let variable  = new ShellGameVariable(pre_node);
            this.element_variables.push(variable);
        }
    }

    //check to make sure all variables have a unique name
    let checker = {};
    for(let i = 0;i < this.element_variables.length ; i++) {
        let n = this.element_variables[i];
        if (checker.hasOwnProperty(n.variable_name)) {
            throw new ShellGameElementError('Element ' + this.element_name + ": Variables cannot have same names: found " + n.variable_name);
        }
        checker[n.variable_name] = 0;
    }

    if ('element_gloms' in raw_input) {
        if (!Array.isArray(raw_input.element_gloms)) { throw new ShellGameElementError('Element ' + this.element_name + ": raw element_gloms is not an array");}

        for(let i = 0; i < raw_input.element_gloms.length; i++) {
            let pre_node = raw_input.element_gloms[i];
            if (!jQuery.isPlainObject(pre_node)) { throw new ShellGameElementError('Element ' + this.element_name + ": raw element_gloms node is not an object");}
            let glom  = new ShellGameGlom(pre_node);
            this.element_gloms.push(glom);
        }
    }

    //check to make sure all gloms have a unique name AND do not have a variable name

    for(let i = 0;i < this.element_gloms.length ; i++) {
        let n = this.element_gloms[i];
        if (checker.hasOwnProperty(n.glom_reference_name)) {
            throw new ShellGameElementError('Element ' + this.element_name + ": Gloms cannot have same names as each other or variables: found " + n.glom_reference_name);
        }
        checker[n.variable_name] = 0;
    }

    if ('element_script' in raw_input) {
        if (!raw_input.element_script) {this.element_script = null;}
        else {
            if (!(typeof raw_input.element_script === 'string' || raw_input.element_script instanceof String)) {
                throw new ShellGameElementError('Element ' + this.element_name + ": element_script is not a string ");
            }
            this.element_script = raw_input.element_script;
        }
    }



    this.init_element = function() {
        for(let y =0; y < this.element_variables.length; y++) {
            let node = this.element_variables[y];
            node.variable_current_value = node.variable_initial_value;
        }

        for(let y =0; y < this.element_gloms.length; y++) {
            let node = this.element_gloms[y];
            node.glom_current_value = null;
        }
    }

    this.step_element = function() {
        if (!this.element_script) {return;}

        function run_script(vars_to_run,script) {
             eval(
                `
                    "use strict";

                    // noinspection JSUnusedLocalSymbols
                    function w() {
                        `
                        +
                        script
                        +
                        `
                    }
                    w.bind(vars_to_run)();
               
                `
             );

        }


        let vars_to_run = {};
        let variable_lookup = {};
        for(let y =0; y < this.element_variables.length; y++) {
            let node = this.element_variables[y];
            vars_to_run[node.variable_name] = node.variable_current_value;
            variable_lookup[node.variable_name] = node;
        }

        for(let y =0; y < this.element_gloms.length; y++) {
            let node = this.element_gloms[y];
            vars_to_run[node.glom_reference_name] = node.glom_current_value;
        }

        console.log('Element ' + this.element_name + ": running vars from script " + this.element_name,vars_to_run,this.element_script);
        try {
            run_script(vars_to_run, this.element_script);
        } catch (err) {
            console.warn('Element ' + this.element_name + ": that script don't run! ",err);
            return;
        }
        console.log('Element ' + this.element_name + ": changed stuff is",vars_to_run);

        for(let m in vars_to_run) {
            if (!vars_to_run.hasOwnProperty(m)) {continue;}
            if (!variable_lookup.hasOwnProperty(m)) {continue;}
            let found_var = variable_lookup[m];
            found_var.variable_current_value = vars_to_run[m];
        }
        console.log('Element ' + this.element_name + ": new variables are",this.element_variables);

    }


}