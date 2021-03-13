
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
                throw new ShellGameElementTemplateError("wrong init plan set for template in element_init. Needed original|find but got: " + raw_input.shell_name);
            }
        }

    } else {
        throw new ShellGameElementTemplateError("no init plan set for template in element_init");
    }
}

/**
 * @param {object} [raw_input]
 * @constructor
 */
function ShellGameShell(raw_input ) {
    this.shell_name = '';
    this.shell_parent = null;

    /**
     * @type {ShellGameElementTemplate[]}
     */
    this.elements = [];

    if (!$.isPlainObject(raw_input)) { throw new ShellGameShellError("raw_input is not an object");}

    if ('shell_name' in raw_input) {
        if (!(typeof raw_input.shell_name === 'string' || raw_input.shell_name instanceof String)) {
            throw new ShellGameShellError("shell_name is not a string");
        }
        this.shell_name = raw_input.shell_name;
    } else {
        throw new ShellGameShellError("no name set for shell in shell_name");
    }

    if ('shell_parent' in raw_input) {
        if (!(typeof raw_input.shell_parent === 'string' || raw_input.shell_parent instanceof String)) {
            throw new ShellGameShellError("shell_parent is not a string");
        }
        this.shell_parent = raw_input.shell_parent;
    }

    if ('elements' in raw_input) {
        if (!Array.isArray(raw_input.elements)) { throw new ShellGameShellError("elements is not an array");}

        for(let i = 0; i < raw_input.elements.length; i++) {
            let pre_node = raw_input.elements[i];
            if (!jQuery.isPlainObject(pre_node)) { throw new ShellGameShellError("raw elements node is not an object");}
            let template  = new ShellGameElementTemplate(pre_node);
            this.elements.push(template);
        }
    }
}