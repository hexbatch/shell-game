


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


function ShellGameSerializedRunningShell() {
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
}


function ShellGameSerializedRunningShellElement() {
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
     * @type {Object.<string, string>}
     */
    this.gloms = {};
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