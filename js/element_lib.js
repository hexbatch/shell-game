
/**
 * @param {Object} raw_input
 * @constructor

 */
function ShellGameElementLib(raw_input) {


    if (!$.isPlainObject(raw_input)) { throw new ShellGameElementLibError("raw_input is not an object");}
    /**
     * @type {Object.<string, ShellGameElement>}
     */
    this.elements = {};

    if ('element_lib' in raw_input) {
        if (!$.isPlainObject(raw_input.element_lib)) { throw new ShellGameElementLibError( "raw element_lib is not an object");}

        for(let i in raw_input.element_lib) {
            if (!raw_input.element_lib.hasOwnProperty(i)) {continue;}
            let pre_node = raw_input.element_lib[i];
            if (!jQuery.isPlainObject(pre_node)) { throw new ShellGameElementLibError( "raw element_lib node is not an object");}
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

    this.original_and_init = function(element_name) {
        if (this.elements.hasOwnProperty(element_name)) {
            let found = this.elements[element_name];
            let copy = $.extend(true,{}, found);
            copy.init_element();
            return copy;
        }
        throw new ShellGameElementLibError('Cannot find element of ' + element_name + " in the library");
    }

}








