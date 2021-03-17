
/**
 * @param {object} [raw_input]
 * @constructor
 */
function ShellGameElementTemplate(raw_input) {
    this.element_name = '';
    this.element_init = '';

    if (!$.isPlainObject(raw_input) && (!raw_input instanceof ShellGameElementTemplate)) {
        throw new ShellGameShellError("raw_input is not a plain object or a ShellGame Ele Template");
    }

    if ('element_name' in raw_input) {
        if (!(typeof raw_input.element_name === 'string' || raw_input.element_name instanceof String)) {
            throw new ShellGameElementTemplateError("element_name is not a string");
        }
        this.element_name = raw_input.element_name;
    }

    if (!this.element_name) {
        throw new ShellGameElementTemplateError("no name set for template in element_name");
    }

    if ('element_init' in raw_input) {
        if (!(typeof raw_input.element_init === 'string' || raw_input.element_init instanceof String)) {
            throw new ShellGameElementTemplateError("element_init is not a string");
        }
        switch (raw_input.element_init) {
            case 'new':
            case 'find': {
                this.element_init = raw_input.element_init;
                break
            }
            default: {
                throw new ShellGameElementTemplateError("wrong init plan set for template in element_init. Needed new|find but got: " + raw_input.shell_name);
            }
        }

    } else {
        throw new ShellGameElementTemplateError("no init plan set for template in element_init");
    }
}

/**
 * @param {object} [raw_input]
 * @param {ShellGameRun} [run_object]
 * @param {ShellGameShell} [master]
 * @param {ShellGameShell} [live_parent]
 * @param {ShellGameElementState[]} [element_states]
 * @constructor
 */
function ShellGameShell(raw_input,run_object,
                        master,live_parent,element_states ) {

    /**
     * @type {ShellGameRun}
     */
    this.run_object = null;

    /**
     *
     * @type {?string}
     */
    this.guid = null;

    /**
     * @type {string}
     */
    this.shell_name = '';

    /**
     * @type {?string}
     */
    this.shell_parent_name = null;

    /**
     * @type {ShellGameShell}
     */
    this.shell_parent = null;

    /**
     * @type {ShellGameShell[]}
     */
    this.shell_children = [];

    /**
     * @type {ShellGameElementTemplate[]}
     */
    this.templates = [];

    /**
     * @type {ShellGameElement[]}
     */
    this.shell_elements = [];


    if (master instanceof ShellGameShell && (live_parent instanceof  ShellGameShell || !live_parent  )) {

        this.run_object = master.run_object;
        this.shell_name = master.shell_name;

        this.guid = 'shell-'+uuid.v4();


        if (live_parent) {
            //check for recursion before it has a chance to happen
            let par = live_parent;
            while(par) {
                if (par.shell_parent_name === this.shell_name) {//
                    throw new ShellGameShellError("Cannot have an ancestor have a descendant as a parent: " + this.shell_name);
                }
                par = par.shell_parent;
            }
            this.shell_parent_name = master.shell_parent_name;
            this.shell_parent = live_parent;
            this.shell_parent.shell_children.push(this);

        } else {
            this.shell_parent_name = null;
            this.shell_parent = null;
        }




        if (_.isEmpty(element_states)) {element_states = [];}
        let lookup_element_states = {};
        for(let z = 0; z < element_states.length ; z++) {
            let p = element_states[z];
            lookup_element_states[p.element_name] = p;
        }

        for (let i = 0; i < master.templates.length; i++) {
            let template = master.templates[i];
            if (template.element_init === 'new') {
                let element_new = this.run_object.element_lib.original_and_init(template.element_name);
                if (lookup_element_states.hasOwnProperty(element_new.element_name)) {
                    let ele_state = lookup_element_states[element_new.element_name];
                    element_new.restore_element_from_state(ele_state);
                }
                this.shell_elements.push(element_new);
            } else if (template.element_init === 'find') {
                //go up through the chain of parents to try to find it
                let par = this.shell_parent;
                let found_element = null;
                while(par && (found_element === null)) {
                    for (let u = 0; u < par.shell_elements.length; u++) {
                        let test_element = par.shell_elements[u];
                        if (test_element.element_name === template.element_name) {
                            found_element = test_element;
                            break;
                        }
                    }
                }

                if (found_element) {
                    let element_new = new ShellGameElement(found_element);
                    if (lookup_element_states.hasOwnProperty(element_new.element_name)) {
                        let ele_state = lookup_element_states[element_new.element_name];
                        element_new.restore_element_from_state(ele_state);
                    }
                    this.shell_elements.push(element_new);
                }
            } else {
                throw new ShellGameShellError("Cannot init an element in shell: " + this.shell_name + " --> " + template.element_name );
            }
        }//end template loop when spawning

        //fill in any optionally set values for initial values of gloms and vars

    } else if (run_object instanceof  ShellGameRun) {
        /**
         * @type {ShellGameRun}
         */
        this.run_object = run_object;


        if (!$.isPlainObject(raw_input) && (!raw_input instanceof ShellGameShell)) {
            throw new ShellGameShellError("raw_input is not a plain object or a Shell");
        }

        if ('shell_name' in raw_input) {
            if (!(typeof raw_input.shell_name === 'string' || raw_input.shell_name instanceof String)) {
                throw new ShellGameShellError("shell_name is not a string");
            }
            this.shell_name = raw_input.shell_name;
        }

        if (!this.shell_name) {
            throw new ShellGameShellError("no name set for shell in shell_name");
        }

        if ('guid' in raw_input) {
            if (!(typeof raw_input.guid === 'string' || raw_input.guid instanceof String)) {
                throw new ShellGameShellError("guid is not a string");
            }
            this.guid = raw_input.guid;
        }


        if ('shell_parent_name' in raw_input) {
            if (!(typeof raw_input.shell_parent_name === 'string' || raw_input.shell_parent_name instanceof String || raw_input.shell_parent_name === null )) {
                throw new ShellGameShellError("shell_parent_name is not a string or null");
            }
            this.shell_parent_name = raw_input.shell_parent_name;
        }

        if ('elements' in raw_input) {
            if (!Array.isArray(raw_input.elements)) {
                throw new ShellGameShellError("templates is not an array");
            }

            for (let i = 0; i < raw_input.elements.length; i++) {
                let pre_node = raw_input.elements[i];
                if (!jQuery.isPlainObject(pre_node) && (!pre_node instanceof  ShellGameElementTemplate)) {
                    throw new ShellGameShellError("raw templates node is not a plain object or a Element Template");
                }
                let template = new ShellGameElementTemplate(pre_node);
                let check_goodness = this.run_object.element_lib.check_if_element_exists(template.element_name);
                if (!check_goodness) {
                    throw new ShellGameShellError("templates in shell " + this.shell_name + " has an element " + template.element_name + " which is not found in the lib");
                }
                this.templates.push(template);
            }
        }
    } //end if not a copy constructor
    else {
        throw new ShellGameShellError("Constructor of Shell called with wrong args (no run, or no master and live parent) ");
    }

    if (this.shell_name === this.shell_parent_name) {
        throw new ShellGameShellError(" Shell cannot be its own parent: " + this.shell_name);
    }


    /**
     * @param {?ShellGameShell} live_parent
     * @param {ShellGameElementState[]} element_states
     * @return {ShellGameShell}
     */
    this.spawn = function(live_parent,element_states) {
        // make a clone and then either copy the variables from the lib, if new, or find in shell_elements of ancestor chain.
        // If in ancestor chain,  then copy from closet ancestor, or skip
        //put anything found in the clone shell's shell_elements
        //return cloned shell with elements
        return new ShellGameShell(null,null,this,live_parent,element_states);
    }


    this.step = function() {
        //any children , call theirs first
        for(let c = 0; c < this.shell_children.length; c++) {
            let child = this.shell_children[c];
            child.step();
        }

        //step all the functions
        for(let i = 0; i < this.shell_elements.length ; i++) {
            this.shell_elements[i].step_element();
        }
    }


    this.init = function() {
        //any children , call theirs first
        for(let c = 0; c < this.shell_children.length; c++) {
            let child = this.shell_children[c];
            child.init();
        }
        //step all the functions
        for(let i = 0; i < this.shell_elements.length ; i++) {
            this.shell_elements[i].init_element();
        }
    }



    /**
     * @param {Object.<string, ShellGameGlom[]>}  [gloms]
     */
    this.glom = function(gloms) {

        if (!gloms) {
            //do gloms of children first, if any
            for (let child_shell_index = 0; child_shell_index < this.shell_children.length; child_shell_index++) {
                let child_shell = this.shell_children[child_shell_index];
                child_shell.glom(null);
            }
        }

        //build a lookup of all the gloms in this shell, keyed by the name they are looking for
        // starting here, go up through the parent chain until find a match in the elements
        // if there is only one variable by the same name, in the same shell, it will be an array of one
        //if there is more than one variable value, then the lookup will have an array of more than one value for that variable name
        // and the gloms will randomly choose which element

       if (!gloms) {
           gloms = {};

           for (let e = 0; e < this.shell_elements.length; e++) {
               let glom_array = this.shell_elements[e].element_gloms;
               for (let g = 0; g < glom_array.length; g++) {
                   let glom = glom_array[g];
                   glom.glom_current_value = null;
                   if (!glom.hasOwnProperty(glom.glom_target_name)) {
                       gloms[glom.glom_target_name] = [];
                   }
                   gloms[glom.glom_target_name].push(glom) ;
               }
           }
       }

        //now we have a list of gloms, go through our elements, if not here, call parent to do same


        let lookup = {};
        for(let e = 0; e < this.shell_elements.length; e++) {
            let variables = this.shell_elements[e].element_variables;
            for (let v = 0; v < variables.length; v++) {
                let variable = variables[v];
                if (!lookup.hasOwnProperty(variable.variable_name)) {
                    lookup[variable.variable_name] = [];
                }
                lookup[variable.variable_name].push(variable.variable_current_value);
            }
        }



        for (let glom_target_name in gloms) {
            if (! gloms.hasOwnProperty(glom_target_name)) {continue;}
            let glom_array = gloms[glom_target_name];
            if (lookup.hasOwnProperty(glom_target_name)) {
                let ar = lookup[glom_target_name];
                let glom_indexes_to_remove_from_array = [];
                for(let da_glom_index = 0; da_glom_index < glom_array.length; da_glom_index++) {
                    let glom = glom_array[da_glom_index];
                    glom.glom_current_value = _.sample(ar);
                    glom_indexes_to_remove_from_array.push(da_glom_index);
                }

                for(let x = 0; x < glom_indexes_to_remove_from_array.length; x++) {
                    let done_index = glom_indexes_to_remove_from_array[x];
                    gloms[glom_target_name].splice(done_index,1);
                    if (gloms[glom_target_name].length === 0) {
                        delete gloms[glom_target_name];
                    }
                }
            }
        }

        if (!_.isEmpty(gloms)) {
            if (this.shell_parent) {
                this.shell_parent.glom(gloms);
            }
        }





    }//end glom

    /**
     * @param {?object} [ret]
     * return object with shell name as the only key,
     * under that the shell elements keyed by element name and them having keys of variables and gloms
     *  those keys having the name and value
     * @example
       main:
        shell_elements:
         first:
             variables:
                 apple: 1
                 baker: 'some string'
             gloms:
                 x: null,
                 y: 2
           second:
             variables:
                 xer: 1
                 yer: 1
             gloms: []
        shell_children: []
     */
    this.export_shell = function(ret) {

        if (!ret) {ret = {};}
        if (!ret.hasOwnProperty(this.shell_name)) {
            ret[this.shell_name] = [];
        }

        let master_node = {guid: this.guid,shell_elements: {},shell_children: {}};
        for(let b =0; b < this.shell_elements.length; b++) {
            let node = this.shell_elements[b];
            let top_export = node.export_element();
            _.merge(master_node.shell_elements, top_export);
        }

        for(let s =0; s < this.shell_children.length; s++) {
            let child_shell = this.shell_children[s];
            child_shell.export_shell(master_node.shell_children);
        }

        ret[this.shell_name].push(master_node);

        return ret;
    }

    /**
     *
     * @param {string} [shell_name] optional name to search for
     * @return {ShellGameShell[]} returns 0 or more in an array
     */
    this.list_shells = function(shell_name) {

        if (shell_name) {
            if (shell_name === this.shell_name) {
                return [this];
            }
            for (let i = 0; i < this.shell_children.length; i++) {
                let child = this.shell_children[i];
                if (shell_name === child.shell_name) {
                    return [child];
                }
            }

            for (let i = 0; i < this.shell_children.length; i++) {
                let maybe_ret = this.shell_children[i].list_shells(shell_name);
                if (maybe_ret.length) {
                    return maybe_ret;
                }
            }
        } else {
            let ret = [];
            ret.push(this);
            for (let i = 0; i < this.shell_children.length; i++) {
                ret.push(this.shell_children[i])
            }

            for (let i = 0; i < this.shell_children.length; i++) {
                let child_ret = this.shell_children[i].list_shells(shell_name);
                for(let u = 0; u < child_ret.length; u ++) {
                    let mini_me = child_ret[u];
                    ret.push(mini_me);
                }
            }

            return ret;


        }


    }

}