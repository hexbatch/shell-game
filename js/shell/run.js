
/**
 * @param {ShellGameSerialized} yaml_parsed
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

    if (!_.isPlainObject(yaml_parsed) && (!yaml_parsed instanceof  ShellGameSerialized)) { throw new ShellGameRunError("yaml parsed is not a ShellGameSerialized or plain object");}
    if (!('element_lib' in yaml_parsed)) {throw new ShellGameRunError("yaml parsed does not have an element_lib member");}
    if (!('shell_lib' in yaml_parsed)) {throw new ShellGameRunError("yaml parsed does not have an shell_lib member");}

    this.element_lib = new ShellGameElementLib(yaml_parsed);

    this.shell_lib = new ShellGameShellLib(yaml_parsed,this);
    this.shell_lib.add_shells_to_lookup();

    /**
     *
     * @type {ShellGameShell}
     */
    this.main_shell = null;

    if ('running_shells' in yaml_parsed) {
        let tops = this.shell_lib.reconstitute_running(yaml_parsed.running_shells);
        if (tops.length > 1) {
          throw new ShellGameRunError('yaml parased has more than one top shell in the running_shells');
        } else if (tops.length === 1) {
            //is only one
            this.main_shell = tops[0];
        }
    }



    //end constructor stuff



    this.glom = function() {
        if (this.main_shell) {this.main_shell.glom(null);}
    }


    // noinspection JSUnusedGlobalSymbols  (will use this when doing presentation controls)
    /**
     *
     * @param {string} shell_name_or_guid , the name of the shell to add
     * @param {?string} [live_parent_name_or_guid] optional guid of the parent to add, or add name and first match in running will be used
     */
    this.add_active_shell = function(shell_name_or_guid,live_parent_name_or_guid) {

        let master_shell;
        if (this.shell_lib.master_shell_guid_lookup.hasOwnProperty(shell_name_or_guid)) {
            master_shell = this.shell_lib.master_shell_guid_lookup[shell_name_or_guid];
        } else if (this.shell_lib.shells.hasOwnProperty(shell_name_or_guid)) {
            master_shell = this.shell_lib.shells[shell_name_or_guid]
        } else {
            throw new ShellGameRunError("Cannot find master shell by name or guid")
        }



        if (!live_parent_name_or_guid && master_shell.shell_parent_name) {
            //get the name of the parent
            if (this.shell_lib.shells.hasOwnProperty(master_shell.shell_parent_name)) {
                let parent_master_shell = this.shell_lib.shells[master_shell.shell_parent_name];
                live_parent_name_or_guid = parent_master_shell.shell_name;
            } else {
                throw new ShellGameRunError("Cannot find master shell by name or guid")
            }
        }

        let found_live_parent;
        if (_.isString(live_parent_name_or_guid)) {
            let find_live_parent_array = this.get_live_shells(live_parent_name_or_guid,1);
            if (!find_live_parent_array.length) {
                throw new ShellGameRunError("Could not find parent shell to add with , parent name was " + live_parent_name_or_guid);
            }
             found_live_parent = find_live_parent_array[0];

        } else {
            throw new ShellGameRunError("Could not add shell, the live parent was not a string or a shell ");
        }
        if (master_shell.shell_parent_name !== found_live_parent.shell_name) {
            throw new ShellGameRunError("Spawned shell must have proper parent");
        }

        return this.shell_lib.spawn_shell(shell_name_or_guid,found_live_parent,[]);
    }

    /**
     *
     * @param {string} [shell_search]
     * @param {number} [limit] default 1
     */
    this.pop_active_shell = function(shell_search, limit) {
        if (!shell_search) {return;}
        if (!this.main_shell) {return;}
        let my_limit = limit || 1;
        let shells = this.main_shell.list_shells(shell_search,my_limit);
        for(let i = 0; i < shells.length; i++) {
            let shell = shells[i];
            shell.pop_shell(this);
        }
    }



    /**
     *
     * @param {string} [shell_name]
     * @param {number} [limit] default 1
     */
    this.get_live_shells = function(shell_name, limit) {
        let my_limit = limit || 1;
        if (this.main_shell) {return this.main_shell.list_shells(shell_name,my_limit);}
    }

    /**
     * Steps through each shell, from the innermost to the outermost, and runs their step
     */
    this.step = function() {
        //runs active shells
        if (this.main_shell) {this.main_shell.step();}
    }



    /**
     * returns an object to be used to print out the yaml under the game key
     * structure
     *  element_lib with keys for each element name with the element object under that
     *  shell_lib with keys for each shell name with the shell object under that
     *  running_shells with key of shell name, and then export data. start with top shell (will be called main no mater what) and children under that
     *
     * @return {ShellGameSerialized}
     */
    this.export_as_object = function() {


        let out = new ShellGameSerialized();
        out.element_lib = this.element_lib.export_lib();
        out.shell_lib = this.shell_lib.export_lib();

        if (this.main_shell) {
            this.main_shell.export_running_shell(out.running_shells);
        }

        return out;

    }


}








