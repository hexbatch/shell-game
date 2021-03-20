

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
     * @type {ShellGameShell}
     */
    this.shell_master = null;

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


    /**
     *
     * @param {string} search_for_element_name
     * @return {ShellGameElement}
     */
    this.find_first_element_in_ancestor_chain = function(search_for_element_name){
        let par = this.shell_parent;
        let found_element = null;
        while (par && (found_element === null)) {
            for (let u = 0; u < par.shell_elements.length; u++) {
                let test_element = par.shell_elements[u];
                if (test_element.element_name === search_for_element_name) {
                    found_element = test_element;
                    break;
                }
            }
        }
        return found_element;
    }


    if (master instanceof ShellGameShell && (live_parent instanceof  ShellGameShell || !live_parent  )) {

        this.shell_master = master;
        this.run_object = master.run_object;
        this.shell_name = master.shell_name;

        this.guid = 'shell-'+uuid.v4();
        if (!run_object.shell_lib.shell_guid_lookup.hasOwnProperty(this.guid)) {
            run_object.shell_lib.shell_guid_lookup[this.guid] = this;
        }


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
            let element_new;
            if (template.element_init === 'new') {
                element_new = this.run_object.element_lib.original_and_init(template.element_name);
                if (lookup_element_states.hasOwnProperty(element_new.element_name)) {
                    let ele_state = lookup_element_states[element_new.element_name];
                    element_new.restore_element_from_state(ele_state);
                }

            } else if (template.element_init === 'find') {
                //go up through the chain of parents to try to find it
                let found_element = this.find_first_element_in_ancestor_chain(template.element_name);

                if (found_element) {
                    element_new = new ShellGameElement(found_element,found_element.element_master);
                    if (lookup_element_states.hasOwnProperty(element_new.element_name)) {
                        let ele_state = lookup_element_states[element_new.element_name];
                        element_new.restore_element_from_state(ele_state);
                    }
                }
            } else {
                throw new ShellGameShellError("Cannot init an element in shell: " + this.shell_name + " --> " + template.element_name );
            }

            this.shell_elements.push(element_new);
            element_new.owning_shell_guid = this.guid;

            if (!this.run_object.element_lib.element_guid_lookup.hasOwnProperty(element_new.guid)) {
                this.run_object.element_lib.element_guid_lookup[element_new.guid] = element_new;
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
        } else {
            this.guid = 'shell-master-'+uuid.v4();
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
     * @param {ShellGameRun} run_object
     * @param {?ShellGameShell} live_parent
     * @param {ShellGameElementState[]} element_states
     * @return {ShellGameShell}
     */
    this.spawn = function(run_object, live_parent,element_states) {
        // make a clone and then either copy the variables from the lib, if new, or find in shell_elements of ancestor chain.
        // If in ancestor chain,  then copy from closet ancestor, or skip
        //put anything found in the clone shell's shell_elements
        //return cloned shell with elements
        return new ShellGameShell(null,run_object,this,live_parent,element_states);
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
     *
     * @param {string} search_for_element_name
     * @return {ShellGameElement}
     */
    this.find_this_element = function(search_for_element_name){
        let ret = null;
        for(let i = 0; i < this.shell_elements.length ; i++) {
            if (this.shell_elements[i].element_name === search_for_element_name) {
                ret = this.shell_elements[i];
                break;
            }
        }
        return ret;
    }

    /**
     * For any elements that have element_end of return, then find the element in the ancestor chain, starting with the parent,
     * and overwrite the first found element's value to be what this value is
     *
     * Remove it from the parent's shell_children, set the shell_parent to null
     *
     * @param {ShellGameRun} run_object
     */
    this.pop_shell = function(run_object) {
        if (!this.shell_parent) {return;}

        //pop any shell children first
        for(let child_index = 0; child_index < this.shell_children.length; child_index++) {
            let child = this.shell_children[child_index];
            child.pop_shell(run_object);
        }

        for (let i = 0; i < this.shell_master.templates.length; i++) {
            let template = this.shell_master.templates[i];
            if (template.element_end === 'return') {
                let found_element = this.find_first_element_in_ancestor_chain(template.element_name);


                if (found_element) {
                    let our_element = this.find_this_element(template.element_name);
                    if (!our_element) {throw new ShellGameShellError("Cannot find element of '"+template.element_name+"' even though its in the template");}
                    for(let variable_index = 0; variable_index <  our_element.element_variables.length; variable_index++) {
                        let da_var = our_element.element_variables[variable_index];
                        let dat_var = found_element.get_variable(da_var.variable_name);
                        dat_var.variable_current_value = da_var.variable_current_value;
                    }
                    delete run_object.element_lib.element_guid_lookup[our_element.guid];
                }
            }
        }//end template loop when ending

        //remove self from parent's child list
        let found_index = -1;
        for(let shell_child_index = 0; shell_child_index < this.shell_parent.shell_children.length; shell_child_index++) {
            let is_it_me = this.shell_parent.shell_children[shell_child_index];
            if (is_it_me.guid === this.guid) {
                found_index = shell_child_index;
                break;
            }
        }

        if (found_index >= 0) {
            this.shell_parent.shell_children.splice(found_index, 1);
        }

        //remove from game

        this.shell_parent = null;

        delete run_object.shell_lib.shell_guid_lookup[this.guid] ;

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
     * returns up to limit results from search, a blank search means include everything, starts from top and works from walks the tree from left to right to fill up the slots
     * @param {string} [shell_search] optional name or guid to search for
     * @param {number} [limit] default 1
     * @param {ShellGameShell[]} [found_list]
     * @return {ShellGameShell[]} returns 0 or more in an array
     */
    this.list_shells = function(shell_search,limit,found_list) {

        if (_.isEmpty(found_list)) {
            found_list = [];
        }

        if (shell_search) {
            if (shell_search === this.shell_name || shell_search === this.guid) {
                !_.includes(found_list,this) && found_list.push(this);
                if (found_list.length >= limit) {return found_list;}
            }
            for (let i = 0; i < this.shell_children.length; i++) {
                let child = this.shell_children[i];
                if (shell_search === child.shell_name || shell_search === child.guid) {
                    !_.includes(found_list,child) && found_list.push(child);
                    if (found_list.length >= limit) {return found_list;}
                }
            }

            for (let i = 0; i < this.shell_children.length; i++) {
                let sub_search = this.shell_children[i].list_shells(shell_search,limit - found_list.length,found_list);
                found_list = _.union(found_list,sub_search);
                if (found_list.length >= limit) {return found_list;}
            }
        } else {

            found_list.push(this);
            if (found_list.length >= limit) {return found_list;}
            for (let i = 0; i < this.shell_children.length; i++) {
                let das_child = this.shell_children[i]
                !_.includes(found_list,das_child) &&  found_list.push(das_child);
                if (found_list.length >= limit) {return found_list;}
            }

            for (let i = 0; i < this.shell_children.length; i++) {
                let child_ret = this.shell_children[i].list_shells(shell_search,limit - found_list.length,found_list);
                for(let u = 0; u < child_ret.length; u ++) {
                    let mini_me = child_ret[u];
                    !_.includes(found_list,mini_me) &&  found_list.push(mini_me);
                    if (found_list.length >= limit) {return found_list;}
                }
            }

        }

        return found_list;


    }




    /**
     * Gets a list of elements in this shell, and children shells, searching either by the element name or the element guid
     * returns up to limit results from search, a blank search means include everything, starts from top and works from walks the tree from left to right to fill up the slots
     * @param {string} [element_search] optional name or guid to search for
     * @param {number} [limit] default 1
     * @param {ShellGameShell[]} [found_list]
     * @return {ShellGameShell[]} returns 0 or more in an array
     */
    this.list_running_elements = function(element_search, limit, found_list) {

        if (_.isEmpty(found_list)) {
            found_list = [];
        }

        for(let element_index = 0; element_index < this.shell_elements.length; element_index++) {
            let el = this.shell_elements[element_index];
            if (element_search) {
                if ((element_search !== el.element_name) && (element_search !== el.guid) ) {continue;}
            }

            !_.includes(found_list,this) && found_list.push(this);
            if (found_list.length >= limit) {return found_list;}
        }

        for (let i = 0; i < this.shell_children.length; i++) {
            let sub_search = this.shell_children[i].list_running_elements(element_search,limit - found_list.length,found_list);
            found_list = _.union(found_list,sub_search);
            if (found_list.length >= limit) {return found_list;}
        }

        return found_list;

    }

}