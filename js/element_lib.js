
/**
 * @param {Object.<string, ShellGameElement>} elements
 * @constructor
 *
 * Yaml String is array of ShellGameVariable
 */
function ShellGameElementLib(elements) {

    /**
     * @type {Object.<string, ShellGameElement>}
     */
    this.elements = elements;


    this.original_and_init = function(element_name) {
        if (this.elements.hasOwnProperty(element_name)) {
            let ret = this.elements[element_name];
            ret.init_element();
            return ret;
        }
        throw new ShellGameElementLibError('Cannot find element of ' + element_name + " in the library");
    }

}








