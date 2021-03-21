
/**
 * @param {Object} raw_input
 * @constructor

 */
function ShellGameElementLib(raw_input) {


    if (!$.isPlainObject(raw_input) ) { throw new ShellGameElementLibError("raw_input is not a plain object");}
    /**
     * contains only master elements by name
     * @type {Object.<string, ShellGameElement>}
     */
    this.elements = {};


    /**
     * Holds all Elements, running and master
     * @type {Object.<string, ShellGameElement>}
     */
    this.element_guid_lookup = {};


    /**
     * Holds master Elements
     * @type {Object.<string, ShellGameElement>}
     */
    this.master_element_guid_lookup = {};

    if ('element_lib' in raw_input) {
        if (!$.isPlainObject(raw_input.element_lib) && (!raw_input.element_lib instanceof  ShellGameElementLib)) {
            throw new ShellGameElementLibError( "raw element_lib is not a plain object or an Element Library");
        }

        for(let i in raw_input.element_lib) {
            if (!raw_input.element_lib.hasOwnProperty(i)) {continue;}
            let pre_node = raw_input.element_lib[i];
            if (!jQuery.isPlainObject(pre_node) && (!pre_node instanceof ShellGameElement)) {
                throw new ShellGameElementLibError( "raw element_lib node is not a plain object Or a ShellGame Element");
            }
            let element  = new ShellGameElement(pre_node,null);
            if (i !== element.element_name) {
                throw new ShellGameElementLibError( "raw element_lib node has a key of "+ i + " and a name of " + element.element_name +" but they need to be the same");
            }
            if (!this.element_guid_lookup.hasOwnProperty(element.guid)) {
                this.element_guid_lookup[element.guid] = element;
            }

            if (!this.master_element_guid_lookup.hasOwnProperty(element.guid)) {
                this.master_element_guid_lookup[element.guid] = element;
            }
            this.elements[i] = element;
        }
    }

    /**
     *
     * @param {string} element_name
     * @return {ShellGameElement|null}
     */
    this.get_element = function(element_name) {
        if (this.check_if_element_exists(element_name)) {
            return this.elements[element_name];
        }
        return null;
    }

    /**
     *
     * @param {string} element_name
     * @return {ShellGameElement}
     */
    this.get_master_element_by_name = function(element_name) {
        for(let i in this.master_element_guid_lookup) {
            if (!this.master_element_guid_lookup.hasOwnProperty(i)) {continue;}

            if (this.master_element_guid_lookup[i].element_name === element_name) {
                return this.master_element_guid_lookup[i];
            }
        }
        throw new ShellGameElementLibError("Master Element not found for name of " + element_name)
    }

    /**
     *
     * @param {string} element_name
     * @return {boolean}
     */
    this.check_if_element_exists = function(element_name) {
        return this.elements.hasOwnProperty(element_name);
    }

    /**
     *
     * @param element_name
     * @return {ShellGameElement}
     */
    this.original_and_init = function(element_name) {
        if (this.elements.hasOwnProperty(element_name)) {
            let found = this.elements[element_name];
            let master_element = this.get_master_element_by_name(element_name);
            let copy = new ShellGameElement(found,master_element);
            copy.init_element();
            if (!this.element_guid_lookup.hasOwnProperty(copy.guid)) {
                this.element_guid_lookup[copy.guid] = copy;
            }
            return copy;
        }
        throw new ShellGameElementLibError('Cannot find element of ' + element_name + " in the library");
    }

    /**
     * @return {Object.<string, ShellGameSerializedElement>}
     * returns an object with keys of all the element names with values of the raw element objects
     */
    this.export_lib = function() {
        let ret = {};
        for(let element_name in this.elements) {
            if (!this.elements.hasOwnProperty(element_name)) {continue;}
            let element = this.elements[element_name];
            ret[element.element_name] = element.export_element_definition();
        }
        return ret;
    };

}








