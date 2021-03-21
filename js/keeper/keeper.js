
/**
 * @constructor
 */
function ShellGameKeeper() {

    /**
     *
     * @type {?ShellGameRawInput}
     */
    this.last_raw = null;

    /**
     * @var {ShellGameRun}
     */
    this.run = null;

    /**
     *
     * @type {boolean}
     */
    this.is_loading = false;

    /**
     *
     * @type {boolean}
     */
    this.is_stepping = false;


    /**
     * @type {Object.<string, ShellGameEventHook>}
     */
    this.event_hooks = {};



    /**
     * @param {ShellGameRawInput} raw
     */
    this.load = function(raw) {
        this.is_loading = true;
        this.last_raw = raw;
        this.run = new ShellGameRun(this.last_raw.game);

        for(let event_hook_guid in this.event_hooks) {
            if (!this.event_hooks.hasOwnProperty(event_hook_guid)) {continue;}
            this.event_hooks[event_hook_guid].do_event_hook(this);
        }

        this.is_loading = false;
    }

    this.step = function() {
        if (!this.run) {
            // noinspection ExceptionCaughtLocallyJS
            throw new ShellGameKeeperError("Please Load First");
        }
        this.is_stepping = true;
        this.run.glom();
        this.run.step();

        for(let event_hook_guid in this.event_hooks) {
            if (!this.event_hooks.hasOwnProperty(event_hook_guid)) {continue;}
            this.event_hooks[event_hook_guid].do_event_hook(this);
        }

        this.is_stepping = false;
    }

    /**
     * @param {ShellGameEventHook} hook
     *
     */
    this.add_event = function(hook) {
        hook.keeper = this;
        this.event_hooks[hook.guid] = hook;
    }

    /**
     *
     * @param {string} hook_guid
     */
    this.remove_event = function(hook_guid) {
        delete this.event_hooks[hook_guid];
    }

    /**
     * @param {string} element_search , either the master element guid or the running element guid
     * @param {string} glom_reference_filter , the name of the reference for the glom in this element(s), if set to null, or missing, then will get info for all the gloms in the element(s)
     * @return {ShellGameGlomReference[]}
     *
     */
    this.get_glom_targets = function(element_search,glom_reference_filter) {
        /*
            get array of found elements (allowing master names like in the reference)
            for each element, get its shell via the shell gui
            and then for each glom in that element, find the first match
            return the array of glom references with the: starting element, the starting element shell, the target element, the target element shell, glom reference name, and variable target name
         */

        let lookup_value = element_search;
        if (this.run.element_lib.master_element_guid_lookup.hasOwnProperty(element_search)) {
            let master_element = this.run.element_lib.master_element_guid_lookup[lookup_value];
            lookup_value = master_element.element_name;
        }

        let looking_for_element_array = this.run.main_shell.list_running_elements(lookup_value);

        /**
         *
         * @type {ShellGameGlomReference[]}
         */
        let ret_glom_array = [];

        /**
         *
         * @param {ShellGameShell} start_shell
         * @param {string} variable_name
         * @return {ShellGameElement}
         */
        function find_closest_variable_name_in_shell_chain(start_shell,variable_name) {
            if (!start_shell) {return null;}
            let elements = start_shell.shell_elements;
            for(let i = 0; i < elements.length; i++) {
                let el = elements[i];
                for(let v = 0; v < el.element_variables.length; v++) {
                    if (el.element_variables[v].variable_name === variable_name) {
                        return el;
                    }
                }
            }
            //look in parent
            return find_closest_variable_name_in_shell_chain(start_shell.shell_parent,variable_name);
        }


        for(let found_element_search_index =0; found_element_search_index < looking_for_element_array.length; found_element_search_index++) {
            let element = looking_for_element_array[found_element_search_index];
            let shell = this.run.shell_lib.shell_guid_lookup[element.owning_shell_guid];


            for(let glom_in_element_index = 0; glom_in_element_index < element.element_gloms.length; glom_in_element_index++) {
                let found_glom = element.element_gloms[glom_in_element_index];
                if (glom_reference_filter) {
                    if (found_glom.glom_reference_name !== glom_reference_filter) {continue;}
                }

                //find a match from this shell on up
                let found_element = find_closest_variable_name_in_shell_chain(shell,found_glom.glom_target_name);
                let node_ref = new ShellGameGlomReference();
                node_ref.glom_reference_name = found_glom.glom_reference_name;
                node_ref.starting_element = element;
                node_ref.starting_shell = shell;
                node_ref.variable_target_name = found_glom.glom_target_name;
                if (found_element) {
                    node_ref.target_element = found_element;
                    node_ref.target_shell = this.run.shell_lib.shell_guid_lookup[found_element.owning_shell_guid];
                }
                ret_glom_array.push(node_ref);
            }

        }
        return ret_glom_array;
    }


    /**
     * @param {string} element_search , either the master element guid or the running element guid
     * @param {string} glom_reference_filter , the name of the reference for the glom in this element(s), if set to null, or missing, then will get info for all the gloms in the element(s)
     * @return {ShellGameGlomReference[]}
     *
     */
    this.get_glom_template_targets = function(element_search,glom_reference_filter) {
        /*
            get array of found elements (allowing master names like in the reference)
            for each element, get its name, then get a list of all the shells that has the element name in their templates
            and then for each glom in that master element, and for each shell, find the nearest target name and get that other target master element
            return the array of glom references with the: starting element, the starting element shell, target element, the target element shell, glom reference name, and the variable target name
         */

        let lookup_value = element_search;
        if (this.run.element_lib.master_element_guid_lookup.hasOwnProperty(element_search)) {
            let master_element = this.run.element_lib.master_element_guid_lookup[lookup_value];
            lookup_value = master_element.element_name;
        }

        let looking_for_element_array = this.run.main_shell.list_running_elements(lookup_value);
        /**
         *
         * @type {Object.<string, number>}
         */
        let name_dictionary = {}

        for(let k = 0; k < looking_for_element_array.length; k ++) {
            let el = looking_for_element_array[k];
            if (name_dictionary.hasOwnProperty(el.element_name)) {
                name_dictionary[el.element_name] ++;
            } else {
                name_dictionary[el.element_name] = 1;
            }
            name_dictionary[el.element_name] = el.element_name;
        }


        /**
         *
         * @type {ShellGameGlomReference[]}
         */
        let ret_glom_array = [];



        /**
         *
         * @param {ShellGameShell} start_shell
         * @param {string} variable_name
         * @return {object}
         */
        let find_closest_template_variable_name_in_shell_chain = (function (start_shell,variable_name) {
            if (!start_shell) {return null;}
            for(let i = 0; i < start_shell.templates.length; i++) {
                let template = start_shell.templates[i];
                let el = this.run.element_lib.get_element(template.element_name);
                for(let v = 0; v < el.element_variables.length; v++) {
                    if (el.element_variables[v].variable_name === variable_name) {
                        return {element: el, shell: start_shell};
                    }
                }
            }
            //look in parent
            return find_closest_template_variable_name_in_shell_chain(start_shell.shell_parent,variable_name);
        }).bind(this)




        for(let element_name in name_dictionary) {
            if (!name_dictionary.hasOwnProperty(element_name)) {continue;}

            //get a list of shells that use this element name
            for(let master_shell_guid in this.run.shell_lib.master_shell_guid_lookup) {
                if (!this.run.shell_lib.master_shell_guid_lookup.hasOwnProperty(master_shell_guid)) {continue;}
                let master_shell = this.run.shell_lib.master_shell_guid_lookup[master_shell_guid];

                for(let template_index = 0; template_index <  master_shell.templates.length; template_index++) {
                    let template  = master_shell.templates[template_index];
                    //get master element
                    let master_element = this.run.element_lib.get_element(template.element_name);
                    if (!master_element) {throw new ShellGameKeeperError("Could not find master element from the name of an element: " + template.element_name);}



                    for(let glom_in_element_index = 0; glom_in_element_index < master_element.element_gloms.length; glom_in_element_index++) {
                        let found_glom = master_element.element_gloms[glom_in_element_index];
                        if (glom_reference_filter) {
                            if (found_glom.glom_reference_name !== glom_reference_filter) {continue;}
                        }

                        //find a match from this shell on up
                        let info = find_closest_template_variable_name_in_shell_chain(master_shell,found_glom.glom_target_name);

                        let node_ref = new ShellGameGlomReference();
                        node_ref.glom_reference_name = found_glom.glom_reference_name;
                        node_ref.starting_element = master_element;
                        node_ref.starting_shell = master_shell;
                        node_ref.variable_target_name = found_glom.glom_target_name;
                        if (info) {
                            let found_element = info.element;
                            let found_shell = info.shell;
                            node_ref.target_element = found_element;
                            node_ref.target_shell = found_shell;
                        }
                        ret_glom_array.push(node_ref);
                    } //end for each glom
                } //end for each template
            } // end for each shell
        } //end for each element name


        return ret_glom_array;

    }


}

