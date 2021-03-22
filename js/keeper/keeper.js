
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
     * @type {?ShellGameSerialized}
     */
    this.serialized_game = null;

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
     *
     * @type {boolean}
     */
    this.is_refreshing = false;

    /**
     *
     * @type {boolean}
     */
    this.is_pre = false;


    /**
     * @type {ShellGameEventHook[]}
     */
    this.event_hooks = [];

    /**
     *
     * @param {string} guid
     * @return {ShellGameSerializedElement}
     */
    this.get_element_by_guid = function(guid) {
        if (!this.run.element_lib.element_guid_lookup.hasOwnProperty(guid)) {
            throw new ShellGameKeeperError("Cannot find element of guid "+ guid);
        }
        let element_name = this.run.element_lib.element_guid_lookup[guid].element_name;

        if (!this.serialized_game.element_lib.hasOwnProperty(element_name)) {
            throw new ShellGameKeeperError("Cannot find element of name "+ element_name);
        }
        return this.serialized_game.element_lib[element_name];
    }

    /**
     *
     * @param {ShellGameSerializedElement} el
     * @return {string} the guid of the new element
     */
    this.add_element = function(el) {
        if (!el.element_name) {throw new ShellGameKeeperError("Added element needs a name");}
        let element = new ShellGameElement(el,null);
        this.run.element_lib.add_master_element(element);
        this.serialized_game = this.run.export_as_object();

        if (!_.isObject(this.last_raw)) {
            this.last_raw = {};
        }
        this.last_raw.game = this.serialized_game;
        this.refresh();
        return element.guid;

    }

    /**
     *
     * @param {string} name_or_guid
     */
    this.delete_element = function(name_or_guid) {
        let element ;
        if (this.run.element_lib.elements.hasOwnProperty(name_or_guid) ) {
            element = this.run.element_lib.elements[name_or_guid];
        } else if (this.run.element_lib.master_element_guid_lookup.hasOwnProperty(name_or_guid)) {
            element = this.run.element_lib.master_element_guid_lookup[name_or_guid];
        }else {
            throw new ShellGameKeeperError("Cannot find element of " + name_or_guid);
        }
        /**
         * To delete the element, need to find all things that use it as a master, and remove them from a copy of the serialized_game,
         *  then reload using that altered copy, the gui will be updated via the load events going out
         *
         * + Remove the element master from the elementLib
         * + Go through the running shells, and whenever see the name, remove it
         *
         */
        let element_name_to_remove = element.element_name;
        let element_guid_to_remove = element.guid;

        /**
         * @type {ShellGameSerialized}
         */
        let copy = _.cloneDeep(this.serialized_game);
        delete copy.element_lib[element_guid_to_remove];

        /**
         * @param {string} element_name_to_delete
         * @param {ShellGameSerializedRunningShell} shell
         */
        function remove_element_from_running_shells(element_name_to_delete, shell) {
            if (shell.shell_elements.hasOwnProperty(element_name_to_delete)) {
                delete shell.shell_elements[element_name_to_delete];
            }
            for(let child_shell_name in shell.shell_children) {
                if (!shell.shell_children.hasOwnProperty(child_shell_name)) {continue;}
                let child_array_of_shells = shell.shell_children[child_shell_name];
                for(let child_shell_index = 0; child_shell_index < child_array_of_shells.length; child_shell_index++) {
                    let child_shell = child_array_of_shells[child_shell_index];
                    remove_element_from_running_shells(element_name_to_delete,child_shell);
                }
            }
        }

        for(let top_shell_name in copy.running_shells) {
            if (!copy.running_shells.hasOwnProperty(top_shell_name)) {continue;}
            let top_shell_array = copy.running_shells[top_shell_name];
            for(let i = 0; i < top_shell_array.length; i++) {
                let running_shell = top_shell_array[i];
                remove_element_from_running_shells(element_name_to_remove,running_shell);
            }
        }

        //reload the game

        if (!_.isObject(this.last_raw)) {
            this.last_raw = {};
        }
        this.last_raw.game = copy;
        this.load(this.last_raw);

    }


    /**
     * Can update its name, or the guid, but not both at the same time or cannot find it to edit
     * @param {ShellGameSerializedElement} edited_element
     */
    this.edit_element = function(edited_element) {
        if (!edited_element.element_name) {throw new ShellGameKeeperError("Edited element needs a name");}
        let element ;
        if (this.run.element_lib.elements.hasOwnProperty(edited_element.element_name) ) {
            element = this.run.element_lib.elements[edited_element.element_name];
        } else if (this.run.element_lib.master_element_guid_lookup.hasOwnProperty(edited_element.guid)) { //because can change its name
            element = this.run.element_lib.master_element_guid_lookup[edited_element.guid];
        }else {
            throw new ShellGameKeeperError("Cannot find element by name of " + edited_element.element_name + " or by guid of "  + edited_element.guid);
        }

        /**
         * To edit the element, replace it wherever its mentioned from a copy of the serialized_game
         *
         *  then reload using that altered copy, the gui will be updated via the load events going out
         *
         * + Directly replace the element master from the elementLib, if name has changed then delete the old name and add the new name
         *
         * + if the name has changed, Go through the Shell Library, looking for the old element name, and whenever see the old name replace the key with the new name
         *
         *
         *
         * + Go through the running shells, and whenever see the old name:
         *      update its variables
         *          If a var is missing , then remove the reference
         *          If a new var, then assign value to it with just initial value, it has not had a chance to have the find policy set in the shell
         *
         *      update its gloms
         *          if a glom is now missing, then remove that reference
         *          if a glom is new, then add it and the value is always null as it will be found next step naturally
         *
         *
         *      if the name has changed, delete the old name key and add this under the new name key
         *
         */
        let old_element_name = element.element_name;
        let new_element_name = edited_element.element_name;

        /**
         * @type {ShellGameSerialized}
         */
        let copy = _.cloneDeep(this.serialized_game);
        if (old_element_name === new_element_name) {
            copy.element_lib[old_element_name] = edited_element;
        } else {
            delete copy.element_lib[old_element_name];
            copy.element_lib[new_element_name] = edited_element;

            //rename in shell library
            for(let lib_shell_name in copy.shell_lib) {
                if (!copy.shell_lib.hasOwnProperty(lib_shell_name)) {continue;}
                let lib_shell = copy.shell_lib[lib_shell_name];
                for( let u = 0; u < lib_shell.elements.length; u++) {
                    let shell_element = lib_shell.elements[u];
                    if (shell_element.element_name === old_element_name) {
                        shell_element.element_name = new_element_name;
                    }
                }
            }

        }





        /**
         *
         * @param {ShellGameSerializedRunningShell} shell
         */
        function edit_element_in_running_shells(shell) {

            if (shell.shell_elements.hasOwnProperty(old_element_name)) {
                let in_place = shell.shell_elements[old_element_name];

                /**
                 @type {Object.<string, string>}
                 */
                let new_var_entries = {};

                for(let edited_variable_name in edited_element.element_variables) {
                    if (!edited_element.element_variables.hasOwnProperty(edited_variable_name)) {continue;}
                    let edited_variable = edited_element.element_variables[edited_variable_name];

                    if (!in_place.variables.hasOwnProperty(edited_variable_name)) {
                        //add it to thing to merge in later
                        new_var_entries[edited_variable_name] = edited_variable.variable_initial_value;
                    }
                }

                in_place.variables = _.merge(in_place.variables,new_var_entries);

                for(let shell_variable_name in in_place.variables) {
                    if (!in_place.variables.hasOwnProperty(shell_variable_name)) {continue;}
                    if (!edited_element.element_variables.hasOwnProperty(shell_variable_name)) {
                        delete in_place.variables[shell_variable_name];
                    }
                }

                //edit the gloms

                /**
                 @type {Object.<string, ?string>}
                 */
                let new_glom_entries = {};

                for(let edited_glom_name in edited_element.element_gloms) {
                    if (!edited_element.element_gloms.hasOwnProperty(edited_glom_name)) {continue;}

                    if (!in_place.gloms.hasOwnProperty(edited_glom_name)) {
                        //add it to thing to merge in later
                        new_glom_entries[edited_glom_name] = null;
                    }
                }

                in_place.gloms = _.merge(in_place.gloms,new_glom_entries);

                for(let shell_glom_name in in_place.gloms) {
                    if (!in_place.gloms.hasOwnProperty(shell_glom_name)) {continue;}
                    if (!edited_element.element_gloms.hasOwnProperty(shell_glom_name)) {
                        delete in_place.gloms[shell_glom_name];
                    }
                }
                if (old_element_name !== new_element_name) {
                    delete shell.shell_elements[old_element_name];
                    shell.shell_elements[new_element_name] = in_place;
                }

            }


            for(let child_shell_name in shell.shell_children) {
                if (!shell.shell_children.hasOwnProperty(child_shell_name)) {continue;}
                let child_array_of_shells = shell.shell_children[child_shell_name];
                for(let child_shell_index = 0; child_shell_index < child_array_of_shells.length; child_shell_index++) {
                    let child_shell = child_array_of_shells[child_shell_index];
                    edit_element_in_running_shells(child_shell);
                }
            }
        }


        for(let top_shell_name in copy.running_shells) {
            if (!copy.running_shells.hasOwnProperty(top_shell_name)) {continue;}
            let top_shell_array = copy.running_shells[top_shell_name];
            for(let i = 0; i < top_shell_array.length; i++) {
                let running_shell = top_shell_array[i];
                edit_element_in_running_shells(running_shell);
            }
        }

        //reload the game

        if (!_.isObject(this.last_raw)) {
            this.last_raw = {};
        }
        this.last_raw.game = copy;
        this.load(this.last_raw);

    }




    this.add_shell = function(guid_or_name,parent_guid) {
        this.run.add_active_shell(guid_or_name,parent_guid);
        this.serialized_game = this.run.export_as_object();

        if (!_.isObject(this.last_raw)) {
            this.last_raw = {};
        }
        this.last_raw.game = this.serialized_game;
        this.refresh();
    }

    this.pop_shell = function(guid) {
        this.run.pop_active_shell(guid);
        this.serialized_game = this.run.export_as_object();

        if (!_.isObject(this.last_raw)) {
            this.last_raw = {};
        }
        this.last_raw.game = this.serialized_game;
        this.refresh();
    }



    /**
     * @param {ShellGameRawInput} raw
     */
    this.load = function(raw) {
        this.is_loading = true;
        if (!('game' in raw)) {
            // noinspection ExceptionCaughtLocallyJS
            throw new ShellGameRunError("yaml does not have a game member");
        }
        this.last_raw = raw;
        this.run = new ShellGameRun(this.last_raw.game);
        this.serialized_game = this.run.export_as_object();

        if (!_.isObject(this.last_raw)) {
            this.last_raw = {};
        }
        this.last_raw.game = this.serialized_game;

        for(let event_hook_index = 0; event_hook_index < this.event_hooks.length; event_hook_index++ ) {
            let my_hook = this.event_hooks[event_hook_index];
            if (!(my_hook.event_type === 'on_load')) { continue;}
            my_hook.do_event_hook(this);
        }

        this.is_loading = false;
        this.refresh();
    }

    this.step = function() {
        if (!this.run) {
            throw new ShellGameKeeperError("Please Load First");
        }

        if (this.is_loading) {
            throw new ShellGameKeeperError("Loading was interrupted, please load again");
        }
        this.is_stepping = true;
        this.run.glom();
        this.run.step();
        this.serialized_game = this.run.export_as_object();

        if (!_.isObject(this.last_raw)) {
            this.last_raw = {};
        }
        this.last_raw.game = this.serialized_game;

        for(let event_hook_index = 0; event_hook_index < this.event_hooks.length; event_hook_index++ ) {
            let my_hook = this.event_hooks[event_hook_index];
            my_hook.do_event_hook(this);
        }

        this.is_stepping = false;
        this.refresh();
    }

    let that = this;
    function pre_refresh() {
        that.is_pre = true;

        for(let event_hook_index = 0; event_hook_index < that.event_hooks.length; event_hook_index++ ) {
            let my_hook = that.event_hooks[event_hook_index];
            if (!(my_hook.event_type === 'on_pre')) { continue;}
            my_hook.do_event_hook(this);
        }

        that.is_pre = false;
    }

    this.refresh = function() {

        pre_refresh();

        this.is_refreshing = true;

        for(let event_hook_index = 0; event_hook_index < this.event_hooks.length; event_hook_index++ ) {
            let my_hook = this.event_hooks[event_hook_index];
            if (!(my_hook.event_type === 'on_refresh')) { continue;}
            my_hook.do_event_hook(this);
        }

        this.is_refreshing = false;
    }

    /**
     *
     * @param {string} top_key
     * @param {object} node
     * @param {boolean} [b_refresh]
     */
    this.add_top_key = function(top_key,node,b_refresh) {
        if (top_key === 'game') {
            throw new ShellGameKeeperError("Cannot set game key this way");
        }
        if (!_.isObject(this.last_raw)) {
            this.last_raw = {};
        }
        if (_.isEmpty(top_key) || !_.isString(top_key)) {
            throw new ShellGameKeeperError("Top key needs to be a string");
        }
        if (typeof b_refresh === 'undefined') {
            b_refresh = true;
        }
        b_refresh = !!b_refresh;

        this.last_raw[top_key] = node;
        if (b_refresh) {
            this.refresh();
        }

    }

    /**
     * @param {ShellGameEventHook} hook
     *
     */
    this.add_event = function(hook) {
        hook.keeper = this;
        this.event_hooks.push(hook);
    }

    /**
     *
     * @param {string} hook_guid
     */
    this.remove_event = function(hook_guid) {
        for(let event_hook_index = 0; event_hook_index < this.event_hooks.length; event_hook_index++ ) {
            let my_hook = this.event_hooks[event_hook_index];
            if (my_hook.guid === hook_guid) {
                this.event_hooks.splice(event_hook_index,1);
                return;
            }
        }
        throw new ShellGameKeeperError("Could not find hook of " + hook_guid);
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
     * @param {string} starting_element_guid , either the master element guid or the running element guid
     * @param {string} glom_reference_filter , the name of the reference for the glom in this element(s), if set to null, or missing, then will get info for all the gloms in the element(s)
     * @return {ShellGameGlomReference[]}
     *
     */
    this.get_glom_template_targets = function(starting_element_guid,glom_reference_filter) {
        /*
            get array of found elements (allowing master names like in the reference)
            for each element, get its name, then get a list of all the shells that has the element name in their templates
            and then for each glom in that master element, and for each shell, find the nearest target name and get that other target master element
            return the array of glom references with the: starting element, the starting element shell, target element, the target element shell, glom reference name, and the variable target name
         */

        let starting_element_name;
        if (this.run.element_lib.master_element_guid_lookup.hasOwnProperty(starting_element_guid)) {
            let master_element = this.run.element_lib.master_element_guid_lookup[starting_element_name];
            starting_element_name = master_element.element_name;
        } else {
            throw new ShellGameKeeperError(`Cannot find ${starting_element_guid} in master guid list`)
        }

        let looking_for_element_array = this.run.main_shell.list_running_elements(starting_element_name);



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


        //this-task convert to using the glom for the one element in the param above, and find matching vars in the master elements based on the position of the master shells

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
