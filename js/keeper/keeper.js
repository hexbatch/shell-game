
/**
 * @constructor
 */
function ShellGameKeeper() {

    /**
     *
     * @type {?ShellGameRawInput}
     */
    this.last_raw = null;

    /**
     * @var {ShellGameRun}
     */
    this.run = null;

    /**
     *
     * @type {boolean}
     */
    this.is_loading = false;

    /**
     *
     * @type {boolean}
     */
    this.is_stepping = false;


    /**
     * @type {Object.<string, ShellGameEventHook>}
     */
    this.event_hooks = {};



    /**
     * @param {ShellGameRawInput} raw
     */
    this.load = function(raw) {
        this.is_loading = true;
        this.last_raw = raw;
        this.run = new ShellGameRun(this.last_raw.game);

        for(let event_hook_guid in this.event_hooks) {
            if (!this.event_hooks.hasOwnProperty(event_hook_guid)) {continue;}
            this.event_hooks[event_hook_guid].do_event_hook(this);
        }

        this.is_loading = false;
    }

    this.step = function() {
        if (!this.run) {
            // noinspection ExceptionCaughtLocallyJS
            throw new ShellGameKeeperError("Please Load First");
        }
        this.is_stepping = true;
        this.run.glom();
        this.run.step();

        for(let event_hook_guid in this.event_hooks) {
            if (!this.event_hooks.hasOwnProperty(event_hook_guid)) {continue;}
            this.event_hooks[event_hook_guid].do_event_hook(this);
        }

        this.is_stepping = false;
    }

    /**
     * @param {ShellGameEventHook} hook
     *
     */
    this.add_event = function(hook) {
        hook.keeper = this;
        this.event_hooks[hook.guid] = hook;
    }

    /**
     *
     * @param {string} hook_guid
     */
    this.remove_event = function(hook_guid) {
        delete this.event_hooks[hook_guid];
    }

    /**
     * @param {string} element_search , either the master element guid or the running element guid
     * @param {string} glom_reference , the name of the reference for the glom in this element(s), if set to null, or missing, then will get info for all the gloms in the element(s)
     * @return {ShellGameGlomReference[]}
     *
     */
    this.get_glom_targets = function(element_search,glom_reference) {
        /*
            get array of found elements (allowing master names like in the reference)
            for each element, get its shell via the shell gui
            and then for each glom in that element, find the first match
            return the array of glom references with the: starting element, the starting element shell, the target element, the target element shell, glom reference name, and variable target name
         */
    }


    /**
     * @param {string} element_search , either the master element guid or the running element guid
     * @param {string} glom_reference , the name of the reference for the glom in this element(s), if set to null, or missing, then will get info for all the gloms in the element(s)
     * @return {ShellGameGlomReference[]}
     *
     */
    this.get_glom_template_targets = function(element_search,glom_reference) {
        /*
            get array of found elements (allowing master names like in the reference)
            for each element, get its name, then get a list of all the shells that has the element name in their templates
            and then for each glom in that master element, and for each shell, find the nearest target name and get that other target master element
            return the array of glom references with the: starting element, the starting element shell, target element, the target element shell, glom reference name, and the variable target name
         */
    }


}

