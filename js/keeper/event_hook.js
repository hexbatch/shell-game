
/**

 raw_input_key;
 master_shell_guid
 running_shell_guid
 running_element_guid
 master_element_guid
 after_step
 after_load

 * @constructor
 * @param {string} event_type
 * @param {?string} target
 * @param {ShellGameEventCallback} callback
 */
function ShellGameEventHook(event_type,target,callback) {

    /**
     * @type {?ShellGameKeeper}
     */
    this.keeper = null;

    this.current_value = null;

    /**
     * @type {?string}
     */
    this.last_digest_hash = null;

    this.guid = 'hook-'+uuid.v4();

    switch (event_type) {
        case 'on_change_input_key':
        case 'on_change_master_shell':
        case 'on_change_running_shell':
        case 'on_change_master_element':
        case 'on_change_running_element':
        case 'on_step':
        case 'on_load': {
            this.event_type = event_type;
            break;
        }
        default : {
            throw new ShellGameEventHookError("event_type not recognized: " + event_type);
        }
    }

    if (!callback) {throw new ShellGameEventHookError("need callback set " );}
    if (!_.isFunction(callback)) {throw new ShellGameEventHookError("callback needs to be a function " );}

    this.callback = callback;
    this.target = target;

    this.remove_self = function() {
        this.keeper.remove_event(this.guid);
    }



    function make_sha_256_hash(text, callme) {

        const msgUint8 = new TextEncoder().encode(text);                           // encode as (utf-8) Uint8Array
        crypto.subtle.digest('SHA-256', msgUint8)
            .then(hashBuffer => {
                const hashArray = Array.from(new Uint8Array(hashBuffer));                     // convert buffer to byte array
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
                callme(hashHex);
            })
            .catch(err => { throw new ShellGameEventHookError('make_sha_256_hash has error: '+ err) });
    }

    function safe_to_string(what) {
        if (
            _.isNull(what) ||
            _.isNaN(what) ||
            _.isString(what)
        ) {
            return what;
        }
        let ret;
        try {
            ret = JSON.stringify(what);
        } catch (e) {
            ret = what.toString();
        }
        return ret;
    }


    this.do_event_hook = function() {
        if (!this.callback) {return;}
        if (!this.keeper) {return;}

        let that = this;

        switch (this.event_type) {
            case 'on_change_input_key': {
                if (!this.keeper.is_loading) {return;} //non game keys only change when loading
                this.current_value = null;
                if (_.isObject(this.keeper.last_raw) && ( this.target in this.keeper.last_raw)) {
                    this.current_value = this.keeper.last_raw[this.target];
                }

                break;
            }

            case 'on_change_master_shell': {
                this.current_value = null;
                if (this.keeper.run.shell_lib.master_shell_guid_lookup.hasOwnProperty(this.target)) {
                    this.current_value = this.keeper.run.shell_lib.master_shell_guid_lookup[this.target];
                }

                break;

            }
            case 'on_change_running_shell':
            {
                this.current_value = null;
                //check to see if this is a master shell guid, if so , then we want to get all shells via the name
                let use_this_for_lookup = this.target;
                if (this.keeper.run.shell_lib.master_shell_guid_lookup.hasOwnProperty(this.target)) {
                    use_this_for_lookup = this.keeper.run.shell_lib.master_shell_guid_lookup[this.target].shell_name;
                }

                let looking_for_shell_array = this.keeper.run.main_shell.list_shells(use_this_for_lookup);
                if (looking_for_shell_array.length) {
                    this.current_value = looking_for_shell_array;
                }

                break;

            }

            case 'on_change_master_element':
            {
                this.current_value = null;
                if (this.keeper.run.element_lib.master_element_guid_lookup.hasOwnProperty(this.target)) {
                    this.current_value = this.keeper.run.element_lib.master_element_guid_lookup[this.target];
                }

                break;

            }

            case 'on_change_running_element':
            {
                this.current_value = null;
                //check to see if this element guid is a master element, if so, then we are going to look for all elements in the running that has this name
                //else we will just use the original lookup
                let lookup_value = this.target;
                if (this.keeper.run.element_lib.master_element_guid_lookup.hasOwnProperty(this.target)) {
                    let master_element = this.keeper.run.element_lib.master_element_guid_lookup[this.target];
                    lookup_value = master_element.element_name;
                }

                let looking_for_element_array = this.keeper.run.main_shell.list_running_elements(lookup_value);
                if (looking_for_element_array.length) {
                    this.current_value = looking_for_element_array;
                }

                break;

            }

            case 'on_step': {
                if (this.keeper.is_stepping) {
                    this.current_value = this.keeper.run.export_as_object();
                    this.callback(this);
                }
                break;
            }

            case 'on_load': {
                if (this.keeper.is_loading) {
                    this.current_value = this.keeper.run.export_as_object();
                    this.callback(this);
                }
                break;
            }

            default : {
                throw new ShellGameEventHookError("event_type not recognized: " + event_type);
            }
        } //end switch

        let current_text = safe_to_string(this.current_value);
        make_sha_256_hash(current_text, function(da_new_hash) {
            if (that.last_digest_hash !== da_new_hash) {
                that.last_digest_hash = da_new_hash;
                that.callback(that);
            }
        });


    }



}