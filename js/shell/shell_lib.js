
/**
 * @param {Object} raw_input
 * @param {ShellGameRun} run_object
 * @constructor
 
 */
function ShellGameShellLib(raw_input, run_object) {


    /**
     * Holds all shells, running and master
     * @type {Object.<string, ShellGameShell>}
     */
    this.shell_guid_lookup = {};


    /**
     * Holds master shells
     * @type {Object.<string, ShellGameShell>}
     */
    this.master_shell_guid_lookup = {};


    /**
     * @type {ShellGameRun}
     */
    this.run_object = run_object;

    if (!$.isPlainObject(raw_input)) { throw new ShellGameShellLibError("raw_input is not an object");}
    /**
     * @type {Object.<string, ShellGameShell>}
     */
    this.shells = {};

    if ('shell_lib' in raw_input) {
        if (!$.isPlainObject(raw_input.shell_lib) && (!raw_input instanceof ShellGameShellLib)) {
            throw new ShellGameElementLibError( "raw shell_lib is not a plain object or a ShellLib");
        }

        for(let shell_name_key in raw_input.shell_lib) {
            if (!raw_input.shell_lib.hasOwnProperty(shell_name_key)) {continue;}
            let pre_node = raw_input.shell_lib[shell_name_key];
            if (!jQuery.isPlainObject(pre_node) && (!pre_node instanceof ShellGameShell)) {
                throw new ShellGameElementLibError( "raw shell_lib node is not a plain object or a shell");
            }
            let shell  = new ShellGameShell(pre_node,this.run_object);
            if (shell_name_key !== shell.shell_name) {
                throw new ShellGameElementLibError( "raw shell_lib node has a key of "+ shell_name_key + " and a name of " + shell.shell_name +" but they need to be the same");
            }
            this.shells[shell_name_key] = shell;
        }
    }


    //check to make sure all shells have a unique name
    let checker = {};
    for(let k in this.shells) {
        if (!this.shells.hasOwnProperty(k)) {continue;}
        let node = this.shells[k];
        if (checker.hasOwnProperty(node.shell_name)) {
            throw new ShellGameElementError("Shells cannot have same names: found " + node.shell_name);
        }
        checker[node.shell_name] = 0;
    }

    //set parent references
    for(let k in this.shells) {
        if (!this.shells.hasOwnProperty(k)) {continue;}
        let node = this.shells[k];
        if (!node.shell_parent_name) {continue;}
        if (!this.shells.hasOwnProperty(node.shell_parent_name)) {
            throw new ShellGameElementLibError( node.shell_name + " has shell_parent_name of "+ node.shell_parent_name + " which is not found in the shell lib " );
        }
        //check to make sure the parent does not have this node in its ancestor chain already, to prevent recursion
        let parent_to_set = this.shells[node.shell_name];
        let par = parent_to_set;
        let chain = [];
        chain.push(parent_to_set.shell_name);
        while(par.shell_parent) {
            chain.push(par.shell_parent.shell_name);
            if (parent_to_set.shell_parent.shell_name === node.shell_name) {
                throw new ShellGameElementLibError( node.shell_name + " has recursion of parents leading back to itself: "+ chain.join(' -> ') );
            }
            par = par.shell_parent;
        }
        node.shell_parent = parent_to_set;
    }

    /**
     * Adds the master shells
     */
    this.add_shells_to_lookup = function() {
        for(let shell_name in this.shells) {
            if (!this.shells.hasOwnProperty(shell_name)) {continue;}
            let shell = this.shells[shell_name];
            if (!shell.guid) {
                throw new ShellGameShellLibError('Shell of ' + shell.shell_name + ' does not have a guid');
            }
            this.shell_guid_lookup[shell.guid] = shell;
            this.master_shell_guid_lookup[shell.guid] = shell;
        }
    }


    /**
     * @return {Object.<string, ShellGameSerializedShell>}
     * returns an object with keys of all the shell names with values of the raw shell objects
     */
    this.export_lib = function() {
        let ret = {};
        for(let shell_name in this.shells) {
            if (!this.shells.hasOwnProperty(shell_name)) {continue;}
            let shell = this.shells[shell_name];

            let node = new ShellGameSerializedShell();
            node.guid = shell.guid;
            node.shell_name = shell.shell_name;
            node.shell_parent_name = shell.shell_parent_name;
            for (let t = 0; t < shell.templates.length; t++) {
                let da_tempest = shell.templates[t];
                let mote = new ShellGameSerializedShellElement();
                mote.element_name = da_tempest.element_name;
                mote.element_init = da_tempest.element_init;
                mote.element_end = da_tempest.element_end;

                node.elements.push(mote);
            }
            ret[node.shell_name] = node;
        }
        return ret;
    };



    /**
     *
     * @param {string} shell_name
     * @return {boolean}
     */
    this.check_if_shell_exists_by_name = function(shell_name) {
        return this.shells.hasOwnProperty(shell_name);

    }



    /**
     *
     * @param {string} shell_name
     * @param {ShellGameShell} live_parent
     * @param {ShellGameElementState[]} element_states
     * @return {ShellGameShell}
     */
    this.spawn_shell = function(shell_name,live_parent,element_states) {
        let found;
        if (this.shells.hasOwnProperty(shell_name)) {
            found = this.shells[shell_name];
        } else if (this.master_shell_guid_lookup.hasOwnProperty(shell_name)) {
            found = this.master_shell_guid_lookup[shell_name];
        } else {
            throw new ShellGameElementLibError('Cannot find element of ' + shell_name + " in the library");
        }


        return found.spawn(this.run_object,live_parent,element_states);
    }

    /**
     * @param {object} [raw_input]
     * @param {?ShellGameShell?} top_parent
     * @return ShellGameShell[]
     * @example the input can be one or more keys that is the name of the shell, and then the shell elements has the state of the shell
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
      shell_children:
        other:
          shell_elements:
            first:
              variables:
                apple: 25
                baker: 'in the basement'
              gloms: []
     */
    this.reconstitute_running = function(raw_input,top_parent) {
        if (_.isEmpty(raw_input)) {return [];}

        if (!_.isPlainObject(raw_input)) {
            throw new ShellGameShellError("raw_input is not a plain object");
        }

        let tops = [];
        for(let shell_name in raw_input) {
            if (!raw_input.hasOwnProperty(shell_name)) {continue;}

            if (!this.check_if_shell_exists_by_name(shell_name)) {
                throw new ShellGameShellLibError("Cannot reconstitute shell of name " + shell_name + " as its not in the library");
            }

            let shell_thing_array = raw_input[shell_name];
            if (!_.isArray(shell_thing_array)) {
                throw new ShellGameShellError("raw_input is not a plain object");
            }

            for(let dat_tang = 0; dat_tang < shell_thing_array.length; dat_tang ++) {
                let shell_thing = shell_thing_array[dat_tang];
                let settings = [];
                if ('shell_elements' in shell_thing && _.isPlainObject(shell_thing.shell_elements)) {
                    for(let setting_element_name in shell_thing.shell_elements) {
                        if (!shell_thing.shell_elements.hasOwnProperty(setting_element_name)) {continue;}
                        let el_raw = shell_thing.shell_elements[setting_element_name];
                        let el_setting = new ShellGameElementState(el_raw,setting_element_name,this.run_object);
                        settings.push( el_setting);
                    }
                }
                let alive = this.spawn_shell(shell_name, top_parent,settings);
                if (!alive.guid) {
                    throw new ShellGameShellLibError('Running Shell of ' + alive.shell_name + ' does not have a guid');
                }
                if ('guid' in shell_thing && shell_thing.guid) {
                    delete run_object.shell_lib.shell_guid_lookup[alive.guid];
                    alive.guid = shell_thing.guid;
                    for(let j = 0; j < alive.shell_elements.length; j++) {
                        alive.shell_elements[j].owning_shell_guid = alive.guid;
                    }
                    if (!run_object.shell_lib.shell_guid_lookup.hasOwnProperty(alive.guid)) {
                        run_object.shell_lib.shell_guid_lookup[alive.guid] = alive;
                    }
                }


                if ('shell_children' in shell_thing) {
                    if (!_.isPlainObject(shell_thing.shell_children)) {
                        throw new ShellGameShellError(shell_name + ".shell_children is not a plain object");
                    }
                    this.reconstitute_running(shell_thing.shell_children, alive);
                }
                tops.push(alive);
            }
        }
        return tops;
    }


    

}








