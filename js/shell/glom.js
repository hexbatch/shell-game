/**
 * @param {object} [raw_input]
 * @constructor
 */
function ShellGameGlom(raw_input) {
    this.glom_target_name = '';
    this.glom_current_value = null;
    this.glom_reference_name = '';

    if (!$.isPlainObject(raw_input) && (!raw_input instanceof ShellGameGlom)) { throw new ShellGameGlomError("raw_input is not an object");}

    if ('glom_target_name' in raw_input) {
        if (!(typeof raw_input.glom_target_name === 'string' || raw_input.glom_target_name instanceof String)) {
            throw new ShellGameGlomError ("glom_target_name is not a string");
        }
        this.glom_target_name = raw_input.glom_target_name;
    }

    if ('glom_current_value' in raw_input) {
        this.glom_current_value = raw_input.glom_current_value;
    }

    let name_regex = /^[a-zA-Z_]+$/;
    if ('glom_reference_name' in raw_input) {
        this.glom_reference_name = raw_input.glom_reference_name;
        if (!name_regex.test(this.glom_reference_name)) {
            throw new ShellGameKeeperError("Only variable names with letters and underscore is allowed for glom reference names");
        }

    } else {
        this.glom_reference_name = this.glom_target_name;
        if (!name_regex.test(this.glom_reference_name)) {
            throw new ShellGameKeeperError("Only variable names with letters and underscore is allowed for glom reference names");
        }
    }
}