/**
 * @param {?object} raw_input
 * @param {?ShellGameElement} element_master
 * @constructor
 */
function ShellGameElement(raw_input,element_master) {

    this.element_name = '';

    /**
     * @type {?string}
     */
    this.guid = null;


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

    /**
     * @type {?string}
     */
    this.owning_shell_guid = null;


    /**
     * @type {?ShellGameElement}
     */
    this.element_master = null;

    if (raw_input === null) {return;}

    this.element_master = element_master;

    if (!$.isPlainObject(raw_input) && (!raw_input instanceof  ShellGameElement) && (!raw_input instanceof  ShellGameSerializedElement)) {
        throw new ShellGameElementError("raw_input is not a plain object or an Element");}

    if ('element_name' in raw_input) {
        if (!(typeof raw_input.element_name === 'string' || raw_input.element_name instanceof String)) {
            throw new ShellGameElementError("element_name is not a string");
        }
        this.element_name = raw_input.element_name;
    }

    if (!this.element_name) {
        throw new ShellGameElementError('No name set for element');
    }

    if ('element_variables' in raw_input) {
        if (_.isPlainObject(raw_input.element_variables)) {

            for (let variable_name in raw_input.element_variables) {
                if (!raw_input.element_variables.hasOwnProperty(variable_name)) {
                    continue;
                }
                let pre_node = raw_input.element_variables[variable_name];
                if (!jQuery.isPlainObject(pre_node) && (!pre_node instanceof ShellGameVariable)) {
                    throw new ShellGameElementError('Element ' + this.element_name + ": raw element_variables node is not a plain object or a ShellGame Variable");
                }

                let variable = new ShellGameVariable(pre_node);
                this.element_variables.push(variable);
            }
        } else if (Array.isArray(raw_input.element_variables)) {
            for(let i = 0; i < raw_input.element_variables.length; i++) {
                let pre_node = raw_input.element_variables[i];
                if (!jQuery.isPlainObject(pre_node) && (!pre_node instanceof ShellGameVariable)) {
                    throw new ShellGameElementError('Element ' + this.element_name + ": raw element_variables node is not a plain object or a ShellGame Variable (b)");
                }

                let variable = new ShellGameVariable(pre_node);
                this.element_variables.push(variable);
            }

        } else {
            throw new ShellGameElementError("element_variables is not a plain object or an array");
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
        if (_.isPlainObject(raw_input.element_gloms)) {

            for (let glom_name in raw_input.element_gloms) {
                if (!raw_input.element_gloms.hasOwnProperty(glom_name)) {
                    continue;
                }
                let pre_node = raw_input.element_gloms[glom_name];
                if (!jQuery.isPlainObject(pre_node) && (!pre_node instanceof ShellGameGlom)) {
                    throw new ShellGameElementError('Element ' + this.element_name + ": raw element_gloms node is not a plain object or a Glom");
                }
                let glom = new ShellGameGlom(pre_node);
                this.element_gloms.push(glom);
            }
        } else if (Array.isArray(raw_input.element_gloms)) {
            for(let i = 0; i < raw_input.element_gloms.length; i++) {
                let pre_node = raw_input.element_gloms[i];
                if (!jQuery.isPlainObject(pre_node) && (!pre_node instanceof ShellGameVariable)) {
                    throw new ShellGameElementError('Element ' + this.element_name + ": raw element_gloms node is not a plain object or a Glom (b)");
                }

                let glom = new ShellGameGlom(pre_node);
                this.element_gloms.push(glom);
            }
        }else {
            throw new ShellGameElementError("element_gloms is not a plain object or an array");
        }
    }

    if ('guid' in raw_input &&  !(raw_input instanceof  ShellGameElement) ) {
        if (!(typeof raw_input.guid === 'string' || raw_input.guid instanceof String || (raw_input.guid === null)) ) {
            throw new ShellGameElementError("element guid is not a string or null");
        }
        if (raw_input.guid) {
            this.guid = raw_input.guid;
        } else {
            if (this.element_master) {
                this.guid = 'element-'+uuid.v4();
            } else {
                this.guid = 'element-master-'+uuid.v4();
            }

        }

    } else {
        if (this.element_master) {
            this.guid = 'element-'+uuid.v4();
        } else {
            this.guid = 'element-master-'+uuid.v4();
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

        try {
            run_script(vars_to_run, this.element_script);
        } catch (err) {
            console.warn('Element ' + this.element_name + ": that script don't run! ",err);
            return;
        }

        for(let m in vars_to_run) {
            if (!vars_to_run.hasOwnProperty(m)) {continue;}
            if (!variable_lookup.hasOwnProperty(m)) {continue;}
            let found_var = variable_lookup[m];
            found_var.variable_current_value = vars_to_run[m];
        }

    }


    /**
     * @return {Object.<string,ShellGameSerializedRunningShellElement>}
     * key by element name and them having keys of variables and gloms
     *  those keys having the name and value
     *
     * @example

     first:
         variables:
             apple: 1
             baker: 'some string'
         gloms:
             x: null,
             y: 2

     */
    this.export_running_shell_element = function() {
        let node = new ShellGameSerializedRunningShellElement();
        node.guid = this.guid;

        for(let y =0; y < this.element_variables.length; y++) {
            let da_var = this.element_variables[y];
            node.variables[da_var.variable_name] = da_var.variable_current_value;
        }

        for(let y =0; y < this.element_gloms.length; y++) {
            let da_glom = this.element_gloms[y];
            node.gloms[da_glom.glom_reference_name] = da_glom.glom_current_value;
        }

        let ret = {};
        ret[this.element_name] = node;

        return ret;
    }

    /**
     *
     * @return {ShellGameSerializedElement}
     */
    this.export_element_definition = function() {

        let ret = new ShellGameSerializedElement();
        ret.guid = this.guid;
        ret.element_name = this.element_name;
        ret.element_script = this.element_script;

        for(let y =0; y < this.element_variables.length; y++) {
            let da_var = this.element_variables[y];
            let node = new ShellGameSerializedVariable();
            node.variable_initial_value = da_var.variable_initial_value;
            node.variable_name = da_var.variable_name;
            ret.element_variables[da_var.variable_name] = node;

        }

        for(let y =0; y < this.element_gloms.length; y++) {
            let da_glom = this.element_gloms[y];
            let node = new ShellGameSerializedGlom();
            node.glom_reference_name = da_glom.glom_reference_name;
            node.glom_target_name = da_glom.glom_target_name;
            ret.element_gloms[da_glom.glom_reference_name] = node;
        }

        return ret;
    }

    /**
     *
     * @param {string} variable_name
     * @return {boolean}
     */
    this.check_if_variable_exists = function(variable_name) {
        for(let i = 0; i < this.element_variables.length; i++) {
            let thing = this.element_variables[i];
            if (thing.variable_name === variable_name) {return true;}
        }
        return false;
    }

    /**
     *
     * @param {string} variable_name
     * @return {ShellGameVariable}
     */
    this.get_variable = function(variable_name) {

        for(let i = 0; i < this.element_variables.length; i++) {
            let thing = this.element_variables[i];
            if (thing.variable_name === variable_name) {return thing;}
        }
        throw new ShellGameElementError("Variable name of '"+ variable_name+"' does not exist in this element of guid " + this.guid);
    }

    /**
     *
     * @param {string} glom_name
     * @return {boolean}
     */
    this.check_if_glom_exists_by_reference_name = function(glom_name) {
        for(let i = 0; i < this.element_gloms.length; i++) {
            let thing = this.element_gloms[i];
            if (thing.glom_reference_name === glom_name) {return true;}
        }
        return false;
    }

    /**
     *
     * @param {ShellGameElementState} state
     */
    this.restore_element_from_state = function (state) {


        if (state.guid) {
            this.guid = state.guid;
        } else {
            this.guid = 'element-'+uuid.v4();
        }

        for(let var_name in state.state_variables) {
            if (!state.state_variables.hasOwnProperty(var_name)) {continue;}
            for(let i = 0; i < this.element_variables.length ; i++) {
                let v = this.element_variables[i];
                if (v.variable_name === var_name) {
                    v.variable_current_value = state.state_variables[var_name];
                    break;
                }
            }
        }


        for( let glom_name in state.state_gloms) {
            if (!state.state_gloms.hasOwnProperty(glom_name)) {continue;}
            for(let g_index = 0; g_index < this.element_gloms.length ; g_index++) {
                let g = this.element_gloms[g_index];
                if (g.glom_reference_name === glom_name) {
                    g.glom_current_value = state.state_gloms[glom_name];
                    break;
                }
            }
        }
    }


}