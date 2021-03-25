
/**
 * @param {object} [raw_input]
 * @constructor
 */
function ShellGameElementTemplate(raw_input) {
    this.element_name = '';
    this.element_init = '';
    this.element_end = '';

    if (!$.isPlainObject(raw_input) && (!raw_input instanceof ShellGameElementTemplate) && (!raw_input instanceof  ShellGameSerializedShellElement)) {
        throw new ShellGameShellError("raw_input is not a plain object or a ShellGame Ele Template");
    }

    if ('element_name' in raw_input) {
        if (!(typeof raw_input.element_name === 'string' || raw_input.element_name instanceof String)) {
            throw new ShellGameElementTemplateError("element_name is not a string");
        }
        this.element_name = raw_input.element_name;
    }

    if (!this.element_name) {
        throw new ShellGameElementTemplateError("no name set for template in element_name");
    }

    if ('element_init' in raw_input) {
        if (!(typeof raw_input.element_init === 'string' || raw_input.element_init instanceof String)) {
            throw new ShellGameElementTemplateError("element_init is not a string");
        }
        switch (raw_input.element_init) {
            case 'new':
            case 'find': {
                this.element_init = raw_input.element_init;
                break
            }
            default: {
                throw new ShellGameElementTemplateError("wrong init plan set for template in element_init. Needed new|find but got: " + raw_input.element_init);
            }
        }

    } else {
        throw new ShellGameElementTemplateError("no init plan set for template in element_init");
    }


    if ('element_end' in raw_input) {
        if (!(typeof raw_input.element_end === 'string' || raw_input.element_end instanceof String)) {
            throw new ShellGameElementTemplateError("element_end is not a string");
        }
        switch (raw_input.element_end) {

            case null:
            case '':
            case 'void': {
                this.element_end = 'void';
                break;
            }
            case 'return': {
                this.element_end = raw_input.element_end;
                break
            }
            default: {
                throw new ShellGameElementTemplateError("wrong end plan set for template in element_end. Needed void|return but got: " + raw_input.element_end);
            }
        }

    } else {
        this.element_end = 'void';
    }
}