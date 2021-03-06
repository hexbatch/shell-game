
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
     * @type {ShellGameSerializedRunningShell}
     */
    this.selected_running_shell = null;


    /**
     *
     * @type {ShellGameSerializedRunningShellElement}
     */
    this.selected_running_element = null;

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
    this.is_selecting_running_shell = false;


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
     * @return {ShellGameSerializedShell[]}
     */
    this.get_master_child_shells_of_running_shell = function(guid) {
        if (!this.run.shell_lib.shell_guid_lookup.hasOwnProperty(guid)) {
            throw new ShellGameKeeperError(`The guid passed [${guid}] does not match a shell record`);
        }
        let regular_shell = this.run.shell_lib.shell_guid_lookup[guid];
        let master_shell;
        if (!regular_shell.shell_master) {
            master_shell = regular_shell;
        } else {
            master_shell = regular_shell.shell_master;
        }

        let found_raw_master_children = [];

        for(let that_master_guid in this.run.shell_lib.master_shell_guid_lookup) {
            if (!this.run.shell_lib.master_shell_guid_lookup.hasOwnProperty(that_master_guid)) {continue;}
            let master_candy = this.run.shell_lib.master_shell_guid_lookup[that_master_guid];
            if (master_candy.shell_parent_name === master_shell.shell_name) {
                found_raw_master_children.push(master_candy);
            }
        }

        let ret = [];
        for ( let i = 0; i < found_raw_master_children.length; i++ ) {
            let node = new ShellGameSerializedShell(found_raw_master_children[i]);
            ret.push(node);
        }
        return ret;
    }

    /**
     *
     * @param {string} guid
     * @return {ShellGameSerializedShell}
     */
    this.get_shell_or_null_by_guid = function(guid) {
        if (!this.run.shell_lib.shell_guid_lookup.hasOwnProperty(guid)) {
            return null;
        }
        let shell_name = this.run.shell_lib.shell_guid_lookup[guid].shell_name;

        if (!this.serialized_game.shell_lib.hasOwnProperty(shell_name)) {
            throw new ShellGameKeeperError("Cannot find shell of name "+ shell_name);
        }
        return this.serialized_game.shell_lib[shell_name];
    }

    /**
     *
     * @param {string} guid
     * @return {ShellGameSerializedShell}
     */
    this.get_shell_by_guid = function(guid) {
        if (!this.run.shell_lib.shell_guid_lookup.hasOwnProperty(guid)) {
            throw new ShellGameKeeperError("Cannot find shell of guid "+ guid);
        }
        let shell_name = this.run.shell_lib.shell_guid_lookup[guid].shell_name;

        if (!this.serialized_game.shell_lib.hasOwnProperty(shell_name)) {
            throw new ShellGameKeeperError("Cannot find shell of name "+ shell_name);
        }
        return this.serialized_game.shell_lib[shell_name];
    }




    /**
     *
     * @param {ShellGameSerializedShell} edited_shell
     */
    this.edit_shell = function(edited_shell) {
        /*
            find older shell via its guid,

            check for valid name and not used by any other shells

            copy the serialized
            get the old version of the shell,
                a)  make a list of components added and removed
                b)  see if the parent changed

            switch out the changed shell in the shell library in copy
            go through the running shells,
                a) if the parent has changed remove it, as it does not belong there anymore
                b) find each place this may be running, add or remove elements (components) as needed

           reload using the new serialized
         */


        if (!edited_shell.shell_name) {throw new ShellGameKeeperError("Edited Shell needs a name");}
        let real_shell ;
        if (this.run.shell_lib.shells.hasOwnProperty(edited_shell.shell_name) ) {
            real_shell = this.run.shell_lib.shells[edited_shell.shell_name];
        } else if (this.run.shell_lib.master_shell_guid_lookup.hasOwnProperty(edited_shell.guid)) { //because can change its name
            real_shell = this.run.shell_lib.master_shell_guid_lookup[edited_shell.guid];
        }else {
            throw new ShellGameKeeperError("Cannot find Shell by name of " + edited_shell.shell_name + " or by guid of "  + edited_shell.guid);
        }

        let old_shell = new ShellGameSerializedShell(real_shell);

        if (!old_shell.shell_parent_name && edited_shell.shell_parent_name) {
            throw new ShellGameKeeperError("Cannot change the top shell to a non top shell this way >>> Must be edited in the yaml");
        }



        let old_shell_name = old_shell.shell_name;
        let new_shell_name = edited_shell.shell_name;

        if (old_shell_name !== new_shell_name) {
            if (this.serialized_game.shell_lib.hasOwnProperty(new_shell_name)) {
                throw new ShellGameKeeperError("The shell name of " + new_shell_name + " is already being used. Cannot change name to this");
            }
        }

        let name_regex = /^[a-zA-Z_]+$/;
        if (!name_regex.test(new_shell_name)) {
            throw new ShellGameKeeperError("Only names with letters and underscore is allowed: " + new_shell_name);
        }


        /**
         * For looking up below
         * @type {Object.<string, ShellGameSerializedShellElement>}
         */
        let new_components = {};

        for(let i = 0; i < edited_shell.elements.length ; i++) {
            new_components[edited_shell.elements[i].element_name] = edited_shell.elements[i];
        }

        /**
         * For looking up below
         * @type {Object.<string, ShellGameSerializedShellElement>}
         */
        let old_components = {};


        for(let i = 0; i < old_shell.elements.length ; i++) {
            old_components[old_shell.elements[i].element_name] = old_shell.elements[i];
        }

        /**
         * If new has elements old does not then list here keyed by element name
         * find by going through new, and if old does not match then add
         * @type {Object.<string, ShellGameSerializedShellElement>}
         */
        let components_added = {};

        for(let component_name in new_components) {
            if (!new_components.hasOwnProperty(component_name)) {continue;}
            if (!old_components.hasOwnProperty(component_name)) {
                components_added[component_name] = new_components[component_name];
            }
        }



        /**
         * If new has removed elements that old still has then catalog here keyed by element name
         * find by going through old, and if new does not match then add
         @type {Object.<string, ShellGameSerializedShellElement>}
         */
        let components_removed = {};

        for(let component_name in old_components) {
            if (!old_components.hasOwnProperty(component_name)) {continue;}
            if (!new_components.hasOwnProperty(component_name)) {
                components_removed[component_name] = old_components[component_name];
            }
        }

        let b_parent_changed = false;
        if (old_shell.shell_parent_name !== edited_shell.shell_parent_name) {b_parent_changed = true;}

        /**
         *
         * @type {ShellGameSerialized}
         */
        let copy = _.cloneDeep(this.serialized_game);
        if (old_shell_name !== new_shell_name) {
            delete copy.shell_lib[old_shell_name];
        }
        copy.shell_lib[new_shell_name] = edited_shell;


        let that = this;

        /**
         *
         * @param {ShellGameSerializedRunningShell} running_shell
         * @param {string} element_name
         * @return {ShellGameSerializedRunningShellElement}
         */
        function find_closest_element(running_shell,element_name) {
            if (!that.run.shell_lib.shell_guid_lookup.hasOwnProperty(running_shell.guid)) {throw new ShellGameKeeperError("Uh, houston, we have a problem... cannot find guid when we damn well shoudl have");}
            let real_shells_for_real_men = that.run.shell_lib.shell_guid_lookup[running_shell.guid] ;
            let closet_element = real_shells_for_real_men.find_first_element_in_ancestor_chain(element_name);
            if (closet_element) {
                let ret = new ShellGameSerializedRunningShellElement(closet_element);
                return ret;
            } else {
                return null;
            }


        }


        /**
         *
         * @param {ShellGameSerializedRunningShell} running_shell
         * @param {string} running_shell_name
         */
        function edit_shell_from_running_shell(running_shell,running_shell_name) {
            //if this is the same kind of shell that was edited, then fix up its elements here

            if (running_shell_name === old_shell_name) {
                for(let component_name in  running_shell.shell_elements) {
                    if (!running_shell.shell_elements.hasOwnProperty(component_name)) {continue;}
                    if (components_removed.hasOwnProperty(component_name)) {
                        delete running_shell.shell_elements[component_name];
                    }
                }

                for(let component_name in components_added) {
                    if (!components_added.hasOwnProperty(component_name)) {continue;}
                    let component_dets = components_added[component_name];
                    /**
                     * @type {ShellGameSerializedRunningShellElement}
                     */
                    let node ;
                    if (component_dets.element_init === 'find') {
                        node  = find_closest_element(running_shell,component_name);
                        if (node) { //may not find it if not in ancestor chain
                            for (let glom_ref_name in node.gloms) {
                                if (!node.gloms.hasOwnProperty(glom_ref_name)) {
                                    continue;
                                }
                                node.gloms[glom_ref_name] = null;
                            }
                        }
                    } else {
                        node = new ShellGameSerializedRunningShellElement();
                        let el_my_hell = copy.element_lib[component_name];
                        for(let glommy_phonome in el_my_hell.element_gloms) {
                            if (!el_my_hell.element_gloms.hasOwnProperty(glommy_phonome)) {continue; /*..this code is too complicated, but it works*/}
                            node.gloms[glommy_phonome] = null;
                        }

                        for(let varmy_patruski in el_my_hell.element_variables) {
                            if (!el_my_hell.element_variables.hasOwnProperty(varmy_patruski)) {continue;}
                            let victory_is_mine = el_my_hell.element_variables[varmy_patruski];
                            node.variables[varmy_patruski] = victory_is_mine.variable_initial_value;
                        }
                    }

                    if (node) {
                        running_shell.shell_elements[component_name] = node;
                    }

                } //end each component added
            }


            //loop for each of its children shells,
            // if a child matches, and the parent was changed, then delete that child (and all its children) without pause
            // if a child matches, and the parent is the same, but the name was changed, then re-index this to be under the new name
            // for all children, recurse , using the old child name, if there was a name change


            for(let child_shell_name in running_shell.shell_children) {
                if (!running_shell.shell_children.hasOwnProperty(child_shell_name)) {continue;}
                if (child_shell_name === old_shell_name && b_parent_changed) {
                    delete running_shell.shell_children[child_shell_name];

                } else if (child_shell_name !== old_shell_name) {
                    //move the stack of children from old name to new name
                    let temp = running_shell.shell_children[child_shell_name];
                    delete running_shell.shell_children[child_shell_name];
                    running_shell.shell_children[new_shell_name] = temp;
                }
            }

            //now we have the child housekeeping out of the way, call each child

            for(let child_shell_name in running_shell.shell_children) {
                if (!running_shell.shell_children.hasOwnProperty(child_shell_name)) {continue;}
                let child_array_of_shells = running_shell.shell_children[child_shell_name];
                for(let child_shell_index = 0; child_shell_index < child_array_of_shells.length; child_shell_index++) {
                    let child_shell = child_array_of_shells[child_shell_index];
                    edit_shell_from_running_shell(child_shell,child_shell_name);
                }
            }

        }//end edit shell from running shell

        for(let top_shell_name in copy.running_shells) {
            if (!copy.running_shells.hasOwnProperty(top_shell_name)) {continue;}
            let top_shell_array = copy.running_shells[top_shell_name];
            for(let i = 0; i < top_shell_array.length; i++) {
                let running_shell = top_shell_array[i];
                edit_shell_from_running_shell(running_shell,top_shell_name);
            }
        }

        if (!_.isObject(this.last_raw)) {
            this.last_raw = {};
        }
        this.last_raw.game = copy;


        this.load(this.last_raw);



    } //end edit shell function


    /**
     *
     * @param {string} name_or_guid
     */
    this.delete_shell = function(name_or_guid) {
        /**
         * to delete the shell, find all the things using it as the master, and remove them from a cloned serialized,
         * then reload
         */

        /**
         * @type {ShellGameShell}
         */
        let found_real_shell ;
        if (this.run.shell_lib.shells.hasOwnProperty(name_or_guid) ) {
            found_real_shell = this.run.shell_lib.shells[name_or_guid];
        } else if (this.run.shell_lib.master_shell_guid_lookup.hasOwnProperty(name_or_guid)) {
            found_real_shell = this.run.shell_lib.master_shell_guid_lookup[name_or_guid];
        }else {
            throw new ShellGameKeeperError("Failed to delete: Cannot find Master Shell by name or guid of " + name_or_guid);
        }

        let shell_name_to_remove = found_real_shell.shell_name;
        let shell_guid_to_remove = found_real_shell.guid;

        //make sure we not deleting top shell
        let top_shell_name = this.run.main_shell.shell_name;
        if (top_shell_name === shell_name_to_remove) {
            throw new ShellGameKeeperError("Cannot delete top shell " + top_shell_name);
        }

        /**
         * @type {ShellGameSerialized}
         */
        let copy = _.cloneDeep(this.serialized_game);
        delete copy.shell_lib[shell_name_to_remove];

        let shell_names_to_remove_from_running = [shell_name_to_remove];


        for(let master_shell_name in copy.shell_lib) {
            if (!copy.shell_lib.hasOwnProperty(master_shell_name)) {continue;}
            let mouse = copy.shell_lib[master_shell_name];
            if (mouse.shell_parent_name === shell_name_to_remove) {
                shell_names_to_remove_from_running.push(master_shell_name);
                delete copy.shell_lib[master_shell_name];
            }
        }

        let top_shell_keys = Object.keys(copy.running_shells);
        if (top_shell_keys.length !== 1) {
            throw new ShellGameKeeperError("Cannot delete if there is more not one top shell");
        }

        let top_shell_array= copy.running_shells[top_shell_keys[0]];

        if (top_shell_array.length !==1 ) {
            throw new ShellGameKeeperError("Cannot delete if there is more not one top shell");
        }

        let top_shell = top_shell_array[0];

        /**
         *
         * @param {ShellGameSerializedRunningShell} running_shell
         */
        function remove_shell_from_running_shells(running_shell) {
            for(let child_shell_name in running_shell.shell_children) {
                if (!running_shell.shell_children.hasOwnProperty(child_shell_name)) {continue;}
                if (shell_names_to_remove_from_running.includes(child_shell_name)) {
                    delete running_shell.shell_children[child_shell_name];

                } else  {
                    let child_array_of_shells = running_shell.shell_children[child_shell_name];
                    for(let child_shell_index = 0; child_shell_index < child_array_of_shells.length; child_shell_index++) {
                        let child_shell = child_array_of_shells[child_shell_index];
                        remove_shell_from_running_shells(child_shell);
                    }
                }
            }
        }

        remove_shell_from_running_shells(top_shell);

        //reload the game

        let colors ;
        if (!('colors' in this.last_raw)) {
            colors = {};
        } else {
            colors = this.last_raw.colors;
        }
        if (colors.hasOwnProperty(shell_guid_to_remove)) {
            delete colors[shell_guid_to_remove];
            this.last_raw.colors = colors;
        }


        if (!_.isObject(this.last_raw)) {
            this.last_raw = {};
        }
        this.last_raw.game = copy;


        this.load(this.last_raw);
    }

    /**
     *
     * @param {ShellGameSerializedShell} shell
     * @param {string} element_color  css color with a # in front
     * @return {string} the guid of the new shell
     */
    this.add_shell = function(shell,element_color) {
        if (!shell.shell_name) {throw new ShellGameKeeperError("Added shell needs a name");}

        let name_regex = /^[a-zA-Z_]+$/;
        if (!name_regex.test(shell.shell_name)) {
            throw new ShellGameKeeperError("Only in shell names with letters and underscore is allowed");
        }

        if (this.serialized_game.shell_lib.hasOwnProperty(shell.shell_name)) {
            throw new ShellGameKeeperError("The shell name of " + shell.shell_name + " is already being used");
        }

        if (!shell.shell_parent_name) {
            throw new ShellGameKeeperError("Cannot add the top shell this way >>> Must be placed into the yaml");
        }

        this.serialized_game.shell_lib[shell.shell_name] = shell;
        this.last_raw.game = this.serialized_game;
        this.load(this.last_raw);

        let new_guid = this.serialized_game.shell_lib[shell.shell_name].guid;

        let colors ;
        if (!('colors' in this.last_raw)) {
            colors = {};
        } else {
            colors = this.last_raw.colors;
        }

        colors[new_guid] = element_color;
        this.last_raw.colors = colors;


        this.refresh();
        return shell.guid;
    }

    /**
     *
     * @param {string} guid
     * @return {ShellGameSerializedElement}
     */
    this.get_element_or_null_by_guid = function(guid) {
        if (!this.run.element_lib.element_guid_lookup.hasOwnProperty(guid)) {
            return null;
        }
        let element_name = this.run.element_lib.element_guid_lookup[guid].element_name;

        if (!this.serialized_game.element_lib.hasOwnProperty(element_name)) {
            throw new ShellGameKeeperError("Cannot find element of name "+ element_name);
        }
        return this.serialized_game.element_lib[element_name];
    }

    /**
     *
     * @param {string} guid
     * @return {ShellGameSerializedRunningShellElement}
     */
    this.get_running_element_or_null_by_guid = function(guid) {
        if (!this.run.element_lib.element_guid_lookup.hasOwnProperty(guid)) {
            return null;
        }

        return new ShellGameSerializedRunningShellElement(this.run.element_lib.element_guid_lookup[guid]);
    }

    /**
     *
     * @param {ShellGameSerializedRunningShellElement} running_element
     */
    this.update_running_element = function(running_element) {
        if (!this.run.element_lib.element_guid_lookup.hasOwnProperty(running_element.guid)) {
            throw new ShellGameKeeperError(`Cannot find running element in the game by guid: ${running_element.guid}`)
        }

        let da_el = this.run.element_lib.element_guid_lookup[running_element.guid];
        for (let i = 0; i < da_el.element_variables.length; i++) {
            let v = da_el.element_variables[i];
            if (running_element.variables.hasOwnProperty(v.variable_name)) {
                v.variable_current_value = running_element.variables[v.variable_name];
            }
        }

        this.serialized_game = this.run.export_as_object();

        this.last_raw.game = this.serialized_game;
        this.load(this.last_raw);

        this.refresh();

    }

    /**
     *
     * @param {string} guid
     * @return {ShellGameSerializedElement}
     */
    this.get_master_element_by_guid = function(guid) {
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
     * @param {string} element_color  css color with a # in front
     * @return {string} the guid of the new element
     */
    this.add_element = function(el,element_color) {
        if (!el.element_name) {throw new ShellGameKeeperError("Added element needs a name");}

        let name_regex = /^[a-zA-Z_]+$/;
        if (!name_regex.test(el.element_name)) {
            throw new ShellGameKeeperError("Only names with letters and underscore is allowed");
        }

        if (this.serialized_game.element_lib.hasOwnProperty(el.element_name)) {
            throw new ShellGameKeeperError("The element name of " + el.element_name + " is already being used");
        }

        let element = new ShellGameElement(el,null);
        this.run.element_lib.add_master_element(element);
        this.serialized_game = this.run.export_as_object();



        if (!_.isObject(this.last_raw)) {
            this.last_raw = {};
        }
        this.last_raw.game = this.serialized_game;

        let colors ;
        if (!('colors' in this.last_raw)) {
            colors = {};
        } else {
            colors = this.last_raw.colors;
        }
        let new_guid = this.serialized_game.element_lib[el.element_name].guid;
        colors[new_guid] = element_color;
        this.last_raw.colors = colors;


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
        delete copy.element_lib[element_name_to_remove];

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

        let colors ;
        if (!('colors' in this.last_raw)) {
            colors = {};
        } else {
            colors = this.last_raw.colors;
        }
        if (colors.hasOwnProperty(element_guid_to_remove)) {
            delete colors[element_guid_to_remove];
            this.last_raw.colors = colors;
        }


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

        if (old_element_name !== new_element_name) {
            if (this.serialized_game.element_lib.hasOwnProperty(new_element_name)) {
                throw new ShellGameKeeperError("The element name of " + new_element_name + " is already being used. Cannot change name to this");
            }
        }

        let name_regex = /^[a-zA-Z_]+$/;
        if (!name_regex.test(new_element_name)) {
            throw new ShellGameKeeperError("Only names with letters and underscore is allowed: " + new_element_name);
        }

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

    /**
     *
     * @param {string} running_shell_guid
     * @return {ShellGameSerializedShell}
     */
    this.get_master_shell_by_childs_guid = function(running_shell_guid) {
        if (!this.run) {
            throw new ShellGameKeeperError("Not loaded, cannot find shell");
        }
        if (this.run.shell_lib.shell_guid_lookup.hasOwnProperty(running_shell_guid)) {
            return new ShellGameSerializedShell( this.run.shell_lib.shell_guid_lookup[running_shell_guid]);
        }
        throw new ShellGameKeeperError(`Cannot find raw shell by guid of ${running_shell_guid}`);
    }

    /**
     *
     * @param {string} running_shell_guid
     * @return {ShellGameSerializedShell}
     */
    this.get_top_master_shell = function() {
        if (!this.run) {
            throw new ShellGameKeeperError("Not loaded, cannot find shell");
        }
        let top_running = this.run.main_shell
        return new ShellGameSerializedShell( top_running.shell_master );

    }

    /**
     *
     * @param {string} master_shell_guid_to_add
     * @param {string} running_parent_shell_guid
     */
    this.insert_running_shell = function(master_shell_guid_to_add,running_parent_shell_guid) {
        if (!this.run) {
            throw new ShellGameKeeperError("Not loaded, cannot insert running shell");
        }
        this.run.add_active_shell(master_shell_guid_to_add,running_parent_shell_guid);
        this.serialized_game = this.run.export_as_object();

        if (!_.isObject(this.last_raw)) {
            this.last_raw = {};
        }
        this.last_raw.game = this.serialized_game;
        this.refresh();
    }


    // noinspection JSUnusedGlobalSymbols  //will use in display layer
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

    this.is_loaded = function() {return !!this.run;}

    /**
     * @param {?ShellGameSerializedRunningShell} [selected_shell]
     * @param {?ShellGameSerializedRunningShellElement} [selected_element]
     */
    this.refresh = function(selected_shell,selected_element) {
        if (!this.run) {return;}
        if (this.is_refreshing || this.is_loading || this.is_pre) {return;} //do not allow nested refreshes
        pre_refresh();

        let old_selected_shell = this.selected_running_shell;
        let old_selected_element = this.selected_running_element;

        if (selected_element === undefined) {
            this.selected_running_element = null;
        } else {
            this.selected_running_element = selected_element;
        }

        if (selected_shell !== undefined) {
            if (selected_shell) {
                this.selected_running_shell = selected_shell;
            } else {
                this.selected_running_shell = null;
            }

            if (old_selected_shell !== this.selected_running_shell || old_selected_element  !== this.selected_running_element ) {

                this.is_selecting_running_shell = true;
                for (let event_hook_index = 0; event_hook_index < this.event_hooks.length; event_hook_index++) {
                    let my_hook = this.event_hooks[event_hook_index];
                    if (!(my_hook.event_type === 'on_selected_running_shell')) {
                        continue;
                    }
                    my_hook.do_event_hook(this);
                }
                this.is_selecting_running_shell = false;
            }
        }


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
     * @param {string} starting_element_guid , either the master element guid or the running element guid
     * @param {?string} glom_reference_filter , the name of the reference for the glom in this element(s), if set to null, or missing, then will get info for all the gloms in the element(s)
     * @return {ShellGameGlomRunningReference[]}
     *
     */
    this.get_glom_targets = function(starting_element_guid,glom_reference_filter) {
        /*
            get array of found elements (allowing master names like in the reference)
            for each element, get its shell via the shell gui
            and then for each glom in that element, find the first match
            return the array of glom references with the: starting element, the starting element shell, the target element, the target element shell, glom reference name, and variable target name
         */

        /**
         *
         * @type {ShellGameElement[]}
         */
        let looking_for_element_array = this.run.main_shell.list_running_elements(starting_element_guid);

        /**
         *
         * @type {ShellGameGlomRunningReference[]}
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
                if (found_element) {
                    let node_ref  = new ShellGameGlomRunningReference();
                    node_ref.glom_reference_name = found_glom.glom_reference_name;
                    node_ref.variable_target_name = found_glom.glom_target_name;

                    node_ref.starting_running_element = new ShellGameSerializedRunningShellElement(element);
                    node_ref.starting_running_shell = new ShellGameSerializedRunningShell(shell);
                    node_ref.target_running_element = new ShellGameSerializedRunningShellElement(found_element);
                    let target_shell = this.run.shell_lib.shell_guid_lookup[found_element.owning_shell_guid]
                    node_ref.target_running_shell = new ShellGameSerializedRunningShell(target_shell);
                    ret_glom_array.push(node_ref);

                }

            }

        }
        return ret_glom_array;
    }


    /**
     * Returns the nearest glom match for the shell library, so not running matches
     * @param {string} starting_element_guid , either the master element guid or the running element guid
     * @param {string} glom_reference_filter , the name of the reference for the glom in this element(s), if set to null, or missing, then will get info for all the gloms in the element(s)
     * @return {ShellGameGlomLibraryReference[]}
     *
     */
    this.get_glom_template_targets = function(starting_element_guid,glom_reference_filter) {
        /*
            find the name of the element
            get the shells this element is in, in the shell lib
            for each shell, get the shells of the closet targets
            return the array of glom references with the: starting element, the starting element shell, target element, the target element shell, glom reference name, and the variable target name
         */

        let starting_element_name;

        if (this.run.element_lib.master_element_guid_lookup.hasOwnProperty(starting_element_guid)) {
            let master_element = this.run.element_lib.master_element_guid_lookup[starting_element_guid];
            starting_element_name = master_element.element_name;
        } else {
            throw new ShellGameKeeperError(`Cannot find ${starting_element_guid} in master guid list`)
        }
        /**
         *
         * @type {ShellGameSerializedGlom[]}
         */
        let array_of_gloms_to_get_info_about = [];

        if (this.serialized_game.element_lib.hasOwnProperty(starting_element_name)) {
            let master_s_element = this.serialized_game.element_lib[starting_element_name];

            for(let glom_name_in_element in  master_s_element.element_gloms) {
                if (!master_s_element.element_gloms.hasOwnProperty(glom_name_in_element)) {continue;}
                let found_glom = master_s_element.element_gloms[glom_name_in_element];
                if (glom_reference_filter) {
                    if (found_glom.glom_reference_name !== glom_reference_filter) {
                        continue;
                    }
                    array_of_gloms_to_get_info_about.push(found_glom);
                }
            }

        } else {
            throw new ShellGameKeeperError(`Cannot find ${starting_element_name} in element library for the serialized game`)
        }





        /**
         *
         * @type {ShellGameGlomLibraryReference[]}
         */
        let ret_glom_array = [];



        /**
         *
         * @param {ShellGameSerializedShell} start_shell
         * @param {string} variable_name
         * @return {object}
         */
        let find_closest_template_variable_name_in_shell_chain = (function (start_shell,variable_name) {
            if (!start_shell) {return null;}

            for(let i = 0; i < start_shell.elements.length; i++) {
                /**
                 * @type {ShellGameSerializedShellElement}
                 */
                let el_name = start_shell.elements[i].element_name;
                //if (el_name === starting_element_name) {continue;} //do not match vars in same element (actually , we can)
                let el = this.serialized_game.element_lib[el_name];
                for(let maybe_target_element_name in  el.element_variables) {
                    if (maybe_target_element_name === variable_name) {
                        return {element: el, shell: start_shell};
                    }
                }
            }

            //look in parent
            let parent_shell = null;
            if (start_shell.shell_parent_name) {
                parent_shell = this.serialized_game.shell_lib[start_shell.shell_parent_name];
            }
            return find_closest_template_variable_name_in_shell_chain(parent_shell,variable_name);
        }).bind(this)

        for(let glom_index = 0; glom_index <  array_of_gloms_to_get_info_about.length ; glom_index++) {
            let me_glom = array_of_gloms_to_get_info_about[glom_index];
            for(let shell_name in this.serialized_game.shell_lib) {
                if (!this.serialized_game.shell_lib.hasOwnProperty(shell_name)) {continue;}
                let dat_shell = this.serialized_game.shell_lib[shell_name];
                //process any shell that dares to have this element

                /**
                 *
                 * @type {ShellGameSerializedShellElement}
                 */
                let starting_element = null;

                for(let element_in_shell_index = 0; element_in_shell_index < dat_shell.elements.length; element_in_shell_index++) {
                    if (dat_shell.elements[element_in_shell_index].element_name === starting_element_name) {
                        starting_element = dat_shell.elements[element_in_shell_index];
                        break;
                    }
                }

                if (!starting_element) {continue;} //that element is not in this shell

                //find a match from this shell on up
                let info = find_closest_template_variable_name_in_shell_chain(dat_shell,me_glom.glom_target_name);
                if (info) {
                    let starting_element_with_more_info = this.serialized_game.element_lib[starting_element.element_name]
                    let node_ref = new ShellGameGlomLibraryReference();
                    node_ref.glom_reference_name = me_glom.glom_reference_name;
                    node_ref.starting_element = starting_element_with_more_info;
                    node_ref.starting_shell = dat_shell;
                    node_ref.variable_target_name = me_glom.glom_target_name;
                    node_ref.target_element = info.element;
                    node_ref.target_shell = info.shell;

                    ret_glom_array.push(node_ref);
                }

            }
        }


        return ret_glom_array;

    }


}

