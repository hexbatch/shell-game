
/**
 * @param {object} raw_input
 * @param {string} element_name
 * @param {ShellGameRun} run_object
 * @constructor
 */
function ShellGameElementState(raw_input,element_name,run_object) {
    this.state_variables = {};
    this.state_gloms = {};
    this.element_name = element_name;
    if (!this.element_name) {
        throw new ShellGameElementStateError("element name is empty ");
    }
    let da_element = run_object.element_lib.get_element(this.element_name);
    if (!da_element) {
        throw new ShellGameElementStateError("element name is not registered in lib: " + element_name);
    }


    if (!$.isPlainObject(raw_input) && (!raw_input instanceof ShellGameElementState)) {
        throw new ShellGameElementStateError("raw_input is not a plain object or a ShellGame Ele State");
    }

    if ('variables' in raw_input && (! _.isEmpty(raw_input.variables))) {
        if (!$.isPlainObject(raw_input.variables) ) {
            throw new ShellGameElementStateError("raw_input.variables is not a plain object");
        }
        for(let variable_name in raw_input.variables) {
            if (!raw_input.variables.hasOwnProperty(variable_name)) {continue;}
            if (!da_element.check_if_variable_exists(variable_name)) {
                throw new ShellGameElementStateError("element name "+ element_name + " does not have a var called: " + variable_name);
            }

            this.state_variables[variable_name] = raw_input.variables[variable_name];
        }
    }

    if ('gloms' in raw_input && (! _.isEmpty(raw_input.gloms))) {

        if (!$.isPlainObject(raw_input.gloms) ) {
            throw new ShellGameElementStateError("raw_input.gloms is not a plain object");
        }
        for(let glom_name in raw_input.gloms) {
            if (!raw_input.gloms.hasOwnProperty(glom_name)) {continue;}
            if (!da_element.check_if_glom_exists(glom_name)) {
                throw new ShellGameElementStateError("element name "+ element_name + " does not have a glom called: " + glom_name);
            }

            this.state_gloms[glom_name] = raw_input.gloms[glom_name];
        }
    }


}