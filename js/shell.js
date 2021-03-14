
/**
 * @param {object} [raw_input]
 * @constructor
 */
function ShellGameElementTemplate(raw_input) {
    this.element_name = '';
    this.element_init = '';

    if (!$.isPlainObject(raw_input)) { throw new ShellGameShellError("raw_input is not an object");}

    if ('element_name' in raw_input) {
        if (!(typeof raw_input.shell_name === 'string' || raw_input.shell_name instanceof String)) {
            throw new ShellGameShellError("element_name is not a string");
        }
        this.element_name = raw_input.element_name;
    } else {
        throw new ShellGameElementTemplateError("no name set for template in element_name");
    }

    if ('element_init' in raw_input) {
        if (!(typeof raw_input.shell_name === 'string' || raw_input.shell_name instanceof String)) {
            throw new ShellGameShellError("element_init is not a string");
        }
        switch (raw_input.shell_name) {
            case 'original':
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
 * @constructor
 */
function ShellGameShell(raw_input,run_object, master,live_parent ) {

    /**
     * @type {ShellGameRun}
     */
    this.run_object = null;

    /**
     * @type {string}
     */
    this.shell_name = '';

    /**
     * @type {string}
     */
    this.shell_parent_name = '';

    /**
     * @type {ShellGameShell}
     */
    this.shell_parent = null;

    /**
     * @type {ShellGameElementTemplate[]}
     */
    this.templates = [];

    /**
     * @type {ShellGameElement[]}
     */
    this.shell_elements = [];


    if (raw_input instanceof ShellGameShell && live_parent instanceof  ShellGameShell) {

        /**
         * @type {ShellGameShell}
         */
        let master = raw_input;
        this.run_object = master.run_object;
        this.shell_name = master.shell_name;
        this.shell_parent_name = master.shell_parent_name;
        this.shell_parent = live_parent;

        for (let i = 0; i < master.templates.length; i++) {
            let template = master.templates[i];
            if (template.element_init === 'new') {

            } else if (template.element_init === 'find') {

            } else {
                throw new ShellGameShellError("Cannot init an element in shell: " + this.shell_name + " --> " + template.element_name );
            }
        }

    } else if (run_object instanceof  ShellGameRun) {
        /**
         * @type {ShellGameRun}
         */
        this.run_object = run_object;


        if (!$.isPlainObject(raw_input)) {
            throw new ShellGameShellError("raw_input is not an object");
        }

        if ('shell_name' in raw_input) {
            if (!(typeof raw_input.shell_name === 'string' || raw_input.shell_name instanceof String)) {
                throw new ShellGameShellError("shell_name is not a string");
            }
            this.shell_name = raw_input.shell_name;
        } else {
            throw new ShellGameShellError("no name set for shell in shell_name");
        }

        if ('shell_parent_name' in raw_input) {
            if (!(typeof raw_input.shell_parent_name === 'string' || raw_input.shell_parent_name instanceof String)) {
                throw new ShellGameShellError("shell_parent_name is not a string");
            }
            this.shell_parent_name = raw_input.shell_parent_name;
        }

        if ('templates' in raw_input) {
            if (!Array.isArray(raw_input.templates)) {
                throw new ShellGameShellError("templates is not an array");
            }

            for (let i = 0; i < raw_input.templates.length; i++) {
                let pre_node = raw_input.templates[i];
                if (!jQuery.isPlainObject(pre_node)) {
                    throw new ShellGameShellError("raw templates node is not an object");
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

    this.spawn = function() {
        //make a clone and then either copy the variables from the lib, if new, or find in shell_elements of ancestor chain.
        // If in ancestor chain,  then copy from closet ancestor, or skip
        //put anything found in the clone shell's shell_elements
        //return cloned shell with elements
        return new ShellGameShell(this);
    }
}