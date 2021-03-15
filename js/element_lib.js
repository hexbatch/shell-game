
/**
 * @param {Object} raw_input
 * @constructor

 */
function ShellGameElementLib(raw_input) {


    if (!$.isPlainObject(raw_input) ) { throw new ShellGameElementLibError("raw_input is not a plain object");}
    /**
     * @type {Object.<string, ShellGameElement>}
     */
    this.elements = {};

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
            let element  = new ShellGameElement(pre_node);
            if (i !== element.element_name) {
                throw new ShellGameElementLibError( "raw element_lib node has a key of "+ i + " and a name of " + element.element_name +" but they need to be the same");
            }
            this.elements[i] = element;
        }
    }


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
            let copy = new ShellGameElement(found);
            copy.init_element();
            return copy;
        }
        throw new ShellGameElementLibError('Cannot find element of ' + element_name + " in the library");
    }

    /**
     * @return {Object.<string, ShellGameElement>}
     * returns an object with keys of all the element names with values of the raw element objects
     */
    this.export_lib = function() {
        let ret = {};
        for(let element_name in this.elements) {
            if (!this.elements.hasOwnProperty(element_name)) {continue;}
            let node = this.elements[element_name];
            ret[node.element_name] = node;
        }
        return ret;
    };

}








