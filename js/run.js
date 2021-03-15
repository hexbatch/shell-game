
/**
 * @param {object} yaml_parsed
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

    if (!_.isPlainObject(yaml_parsed)) { throw new ShellGameRunError("yaml parsed is not an object");}
    if (!('element_lib' in yaml_parsed)) {throw new ShellGameRunError("yaml parsed does not have an element_lib member");}
    if (!('shell_lib' in yaml_parsed)) {throw new ShellGameRunError("yaml parsed does not have an shell_lib member");}

    this.element_lib = new ShellGameElementLib(yaml_parsed);

    this.shell_lib = new ShellGameShellLib(yaml_parsed,this);

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


    /**
     *
     * @param {string} shell_name
     * @param {?(ShellGameShell|string)} [live_parent]
     */
    this.add_active_shell = function(shell_name,live_parent) {

        if (live_parent === null) {
            live_parent = this.shell_lib.get_parent_name_via_child_name(shell_name);
        }

        if (_.isString(live_parent)) {
            let find_live_parent_array = this.get_live_shells(live_parent);
            if (!find_live_parent_array.count) {
                throw new ShellGameRunError("Could not find parent shell to add with , parent name was " + live_parent);
            }
            let found_live_parent = find_live_parent_array[0];
            return this.shell_lib.spawn_shell(shell_name,found_live_parent);
        } else if (live_parent instanceof ShellGameShell) {
            return this.shell_lib.spawn_shell(shell_name,live_parent);
        } else {
            throw new ShellGameRunError("Could not add shell, the live parent was not a string or a shell ");
        }
    }



    /**
     *
     * @param {string} [shell_name]
     */
    this.get_live_shells = function(shell_name) {
        if (this.main_shell) {this.main_shell.list_shells(shell_name);}
    }

    /**
     * Steps through each shell, from the innermost to the outermost, and runs their step
     */
    this.step = function() {
        //runs active shells
        if (this.main_shell) {this.main_shell.step();}
    }


    /**
     * inits each active shell
     */
    this.init = function() {
        if (this.main_shell) {this.main_shell.init();}
    }

    /**
     * returns an object to be used to print out the yaml under the game key
     * structure
     *  element_lib with keys for each element name with the element object under that
     *  shell_lib with keys for each shell name with the shell object under that
     *  running_shells with key of shell name, and then export data. start with top shell (will be called main no mater what) and children under that
     *
     * @return {object}
     */
    this.export_as_object = function() {
        let running = {};
        if (this.main_shell) {
            running = this.main_shell.export_shell();
        }

        let els = this.element_lib.export_lib();
        let shs = this.shell_lib.export_lib()
        return {
            element_lib: els ,
            shell_lib:shs ,
            running_shells : running
        };

    }


}








