
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
        if (!$.isPlainObject(raw_input.shell_lib)) { throw new ShellGameElementLibError( "raw shell_lib is not an object");}

        for(let i in raw_input.shell_lib) {
            if (!raw_input.shell_lib.hasOwnProperty(i)) {continue;}
            let pre_node = raw_input.shell_lib[i];
            if (!jQuery.isPlainObject(pre_node)) { throw new ShellGameElementLibError( "raw shell_lib node is not an object");}
            let shell  = new ShellGameShell(pre_node,this.run_object);
            if (i !== shell.shell_name) {
                throw new ShellGameElementLibError( "raw shell_lib node has a key of "+ i + " and a name of " + shell.shell_name +" but they need to be the same");
            }
            this.shells[i] = shell;
        }
    }


    //check to make sure all variables have a unique name
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


    

}








