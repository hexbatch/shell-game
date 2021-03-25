


function ShellGameSerialized() {

    /**
     *
     * @type {Object.<string, ShellGameSerializedElement>}
     */
    this.element_lib = {};

    /**
     *
     * @type {Object.<string, ShellGameSerializedShell>}
     */
    this.shell_lib = {};

    /**
     *
     * @type {Object.<string, ShellGameSerializedRunningShell[]>}
     */
    this.running_shells = {};
}

/**
 *
 * @param {ShellGameShell} [real_shell]
 * @constructor
 */
function ShellGameSerializedRunningShell(real_shell) {
    /**
     * @type {string}
     */
    this.guid = '';

    /**
     *
     * @type {Object.<string, ShellGameSerializedRunningShellElement>}
     */
    this.shell_elements = {};

    /**
     *
     * @type {Object.<string, ShellGameSerializedRunningShell[]>}
     */
    this.shell_children = {};

    if (real_shell) {
        this.guid = real_shell.guid;

        for(let i =0; i <  real_shell.shell_elements.length; i++) {
            let da_el = real_shell.shell_elements[i];
            this.shell_elements[da_el.element_name] = new ShellGameSerializedRunningShellElement(da_el);
        }

        for(let i = 0; i < real_shell.shell_children; i++) {
            let da_shell = real_shell.shell_children[i];
            if (!this.shell_children.hasOwnProperty(da_shell.shell_name) ) {
                this.shell_children[da_shell.shell_name] = [];
            }
            let node = new ShellGameSerializedRunningShell(da_shell);
            this.shell_children[da_shell].push(node);
        }
    }
}


/**
 * @param {ShellGameElement} [real_element]
 * @constructor
 */
function ShellGameSerializedRunningShellElement(real_element) {
    /**
     * @type {string}
     */
    this.guid = '';

    /**
     *
     * @type {Object.<string, string>}
     */
    this.variables = {};

    /**
     *
     * @type {Object.<string, ?string>}
     */
    this.gloms = {};

    if (real_element) {
        this.guid = real_element.guid;
        for(let i = 0; i <  real_element.element_variables.length ; i++) {
            let da_var = real_element.element_variables[i];
            this.variables[da_var.variable_name] = da_var.variable_current_value;
        }

        for(let i = 0; i <  real_element.element_gloms.length ; i++) {
            let da_glom = real_element.element_gloms[i];
            this.gloms[da_glom.glom_reference_name] = da_glom.glom_current_value;
        }
    }
}


function ShellGameSerializedElement() {
    /**
     * @type {string}
     */
    this.guid = '';

    /**
     * @type {string}
     */
    this.element_name = '';

    /**
     *
     * @type {Object.<string, ShellGameSerializedVariable>}
     */
    this.element_variables = {};

    /**
     *
     * @type {Object.<string, ShellGameSerializedGlom>}
     */
    this.element_gloms = {};

    /**
     *
     * @type {string}
     */
    this.element_script = '';
}

function ShellGameSerializedVariable() {
    /**
     * @type {string}
     */
    this.variable_name = '';

    /**
     * @type {string}
     */
    this.variable_initial_value = '';
}

function ShellGameSerializedGlom() {
    /**
     * @type {string}
     */
    this.glom_target_name = '';

    /**
     * @type {string}
     */
    this.glom_reference_name = '';
}


/*
main:
      shell_name: main
      guid: shell-master-fedf1f65-4e38-4997-a52d-171a57e24aa3
      shell_parent_name: null
      elements:
        - element_name: first
          element_init: new
          element_end: void
        - element_name: second
          element_init: new
          element_end: void
 */

function ShellGameSerializedShell() {
    /**
     * @type {string}
     */
    this.guid = '';

    /**
     * @type {string}
     */
    this.shell_name = '';

    /**
     * @type {string}
     */
    this.shell_parent_name = '';

    /**
     *
     * @type {ShellGameSerializedShellElement[]}
     */
    this.elements = [];

}


function ShellGameSerializedShellElement() {
    /**
     * @type {string}
     */
    this.element_name = '';

    /**
     * @type {string}
     */
    this.element_init = '';

    /**
     *
     * @type {string}
     */
    this.element_end = '';


}