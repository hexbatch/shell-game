


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

    /**
     *
     * @param {string} shell_name
     * @param {number} depth
     * @return {string}
     */
    this.to_dot = function(shell_name,depth) {

        let extra_tabs = '';
        for(let k = 0; k < depth; k++) {
            extra_tabs += `\t`;
        }

        let ret = `${extra_tabs}subgraph "cluster-${this.guid}" {\n`;
        ret += `${extra_tabs}\tlabel="${shell_name}";\n`;
        ret += `${extra_tabs}\tid="${this.guid}";\n`;
        ret += `${extra_tabs}\tcolor="[[${shell_name}::shell-color]]"\n`;
        //ret += `${extra_tabs}\tcolor=lime\n`;
        for(let element_name in this.shell_elements) {
            if (!this.shell_elements.hasOwnProperty(element_name)) {continue;}
            let element_as_dot = this.shell_elements[element_name].to_dot(element_name,extra_tabs);
            ret += `\t${extra_tabs}${element_as_dot}\n`;
        }
        ret += `\n`;
        for(let shell_child_name in this.shell_children) {
            if (!this.shell_children.hasOwnProperty(shell_child_name)) {continue;}
            let shell_stack = this.shell_children[shell_child_name];
            for(let shell_stack_index = 0; shell_stack_index < shell_stack.length; shell_stack_index++) {
                let child_shell = shell_stack[shell_stack_index];
                let child_as_dot = child_shell.to_dot(shell_child_name,depth+1);
                ret += `\t${child_as_dot}\n`;
            }

        }
        ret += `${extra_tabs}\t}`;
        return ret;
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

    /**
     *
     * @param {string} element_name
     * @param {string} extra_tabs
     * @return {string}
     */
    this.to_dot = function(element_name,extra_tabs) {

        let ret = `"${this.guid}"  [ shape=ellipse color="[[${element_name}::element-color]]" fixedsize="false" label=<\n`;

        ret += `${extra_tabs}\t<TABLE  BGCOLOR="[[${element_name}::element-color]]" BORDER="2" COLOR="[[${element_name}::element-color]]" CELLBORDER="0" CELLSPACING="0" CELLPADDING="2">\n`;

        ret += `${extra_tabs}\t\t<TR><TD COLSPAN="2" BORDER="2" COLOR="[[${element_name}::element-color]]">${element_name}</TD></TR>\n`;

        const MAGIC_PADDING_CONST = 8;
        for(let var_name in this.variables) {
            if (!this.variables.hasOwnProperty(var_name)) {continue;}

            let name_width = var_name.length * MAGIC_PADDING_CONST;
            let value = this.variables[var_name];
            let value_width = '';
            if (value) {
                value_width =  value.toString().length * MAGIC_PADDING_CONST;
            }

            ret += `${extra_tabs}\t\t<TR>`+
                `<TD WIDTH="${name_width}" PORT="${var_name}" BORDER="2" COLOR="whitesmoke" ALIGN="CENTER">${var_name}</TD>`+
                `<TD WIDTH="${value_width}" BORDER="2" COLOR="whitesmoke" ALIGN="CENTER">${value}</TD>`+
                `</TR>\n`;
        }

        for(let glom_name in this.gloms) {
            if (!this.gloms.hasOwnProperty(glom_name)) {continue;}

            let name_width = glom_name.length * MAGIC_PADDING_CONST;
            let value = this.gloms[glom_name];
            let value_width = '';
            if (value) {
                value_width =  value.toString().length * MAGIC_PADDING_CONST;
            }

            ret += `${extra_tabs}\t\t<TR>`+
                `<TD WIDTH="${name_width}" PORT="${glom_name}" BORDER="2" COLOR="lightskyblue" ALIGN="CENTER" >${glom_name}</TD>`+
                `<TD WIDTH="${value_width}" BORDER="2" COLOR="lightskyblue" ALIGN="CENTER">${value}</TD>`+
                `</TR>\n`;
        }

        ret += `${extra_tabs}\t</TABLE>>];`;

        return ret;

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

/**
 * * @param {ShellGameShell} [real_shell]
 * @constructor
 */
function ShellGameSerializedShell(real_shell) {
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

    if (real_shell) {
        this.guid = real_shell.guid;
        this.shell_name = real_shell.shell_name;
        this.shell_parent_name = real_shell.shell_parent_name;
        for(let k = 0; k < real_shell.templates.length; k ++) {
            let template = real_shell.templates[k];
            let el_me_my = new ShellGameSerializedShellElement(template);
            this.elements.push(el_me_my);
        }
    }

}


/**
 * * @param {ShellGameElementTemplate} [real_template]
 * @constructor
 */
function ShellGameSerializedShellElement(real_template) {
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

    if (real_template) {
        this.element_name = real_template.element_name;
        this.element_init = real_template.element_init;
        this.element_end = real_template.element_end;
    }


}