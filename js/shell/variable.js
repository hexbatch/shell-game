/**
 * @param {object} [raw_input]
 * @constructor
 */
function ShellGameVariable(raw_input ) {
    this.variable_name = '';
    this.variable_initial_value = null;
    this.variable_current_value = null;

    if (!$.isPlainObject(raw_input) && (!raw_input instanceof ShellGameVariable)) {
        throw new ShellGameVariableError("raw_input is not a plain object or a ShellGame Variable");
    }

    if ('variable_name' in raw_input) {
        if (!(typeof raw_input.variable_name === 'string' || raw_input.variable_name instanceof String)) {
            throw new ShellGameVariableError("variable_name is not a string");
        }
        this.variable_name = raw_input.variable_name;

        let name_regex = /^[a-zA-Z_]+$/;
        if (!name_regex.test(this.variable_name)) {
            throw new ShellGameKeeperError("Only variable names with letters and underscore is allowed");
        }
    }



    if ('variable_initial_value' in raw_input) {
        this.variable_initial_value = raw_input.variable_initial_value;
    }

    if ('variable_current_value' in raw_input) {
        this.variable_current_value = raw_input.variable_current_value;
    }
}