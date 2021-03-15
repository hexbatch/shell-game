
/**
 * @param {Object} raw_input
 * @param {ShellGameRun} run_object
 * @constructor
 
 */
function ShellGameShellLib(raw_input, run_object) {

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
     * @return {Object.<string, ShellGameShell>}
     * returns an object with keys of all the shell names with values of the raw shell objects
     */
    this.export_lib = function() {
        let ret = {};
        for(let shell_name in this.shells) {
            if (!this.shells.hasOwnProperty(shell_name)) {continue;}
            let shell = this.shells[shell_name];
            let node = {shell_name: shell.shell_name, shell_parent_name: shell.shell_parent_name,elements: []};
            for (let t = 0; t < shell.templates.length; t++) {
                let da_tempest = shell.templates[t];
                let mini = {element_name: da_tempest.element_name, element_init: da_tempest.element_init}
                node.elements.push(mini);
            }
            ret[node.shell_name] = node;
        }
        return ret;
    };

    /**
     *
     * @return {[]}
     */
    this.export_lib_as_parent_list = function() {
        let ret = [];
        for(let shell_name in this.shells) {
            if (!this.shells.hasOwnProperty(shell_name)) {continue;}
            let shell = this.shells[shell_name];
            let par_name = shell.shell_parent_name;
            let node = {shell_name: shell.shell_name, parents: []};
            while(par_name) {
                node.parents.push(par_name);
                par_name = this.get_parent_name_via_child_name(par_name);
            }
            ret.push(node);
        }
        return ret;
    }

    /**
     *
     * @param {string} shell_name
     * @return {boolean}
     */
    this.check_if_shell_exists = function(shell_name) {
        return this.shells.hasOwnProperty(shell_name);

    }

    /**
     *
     * @param {string} shell_name
     * @return {string}
     */
    this.get_parent_name_via_child_name = function(shell_name) {
        if (this.check_if_shell_exists(shell_name)) {
            let child_shell = this.shells[shell_name];
            return child_shell.shell_parent_name;
        }
        throw new ShellGameShellLibError("Shell not found in library: " + shell_name);
    }

    /**
     *
     * @param {string} shell_name
     * @param {?ShellGameShell?} live_parent
     * @return {ShellGameShell}
     */
    this.spawn_shell = function(shell_name,live_parent) {
        if (this.shells.hasOwnProperty(shell_name)) {
            let found = this.shells[shell_name];
            return found.spawn(live_parent);
        }
        throw new ShellGameElementLibError('Cannot find element of ' + shell_name + " in the library");
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
            let body = raw_input[shell_name];
            if (!this.check_if_shell_exists(shell_name)) {
                throw new ShellGameShellLibError("Cannot reconstitute shell of name " + shell_name + " as its not in the library");
            }
            let alive = this.spawn_shell(shell_name,top_parent);

            if ('shell_children' in body) {
                if (!_.isPlainObject(body.shell_children)) {
                    throw new ShellGameShellError(shell_name + ".shell_children is not a plain object");
                }
                this.reconstitute_running(body.shell_children,alive);
            }
            tops.push(alive);
        }
        return tops;
    }


    

}








