/**
 * @var {Editor}
 */
let shell_game_editor;
const SHELL_GAME_STORAGE_KEY = 'hexbatch-shell-game-version-1';
const SHELL_GAME_STORAGE_BACKUP_KEY = 'hexbatch-shell-game-backup-version-1';

jQuery(function ($){

    let modal;
    let editing_div = $("div.shell-game-yaml-outer-holder");

    shell_game_editor = ace.edit("shell-game-editor");
    shell_game_editor.setTheme("ace/theme/monokai");
    shell_game_editor.session.setMode("ace/mode/yaml");
    shell_game_editor_setup_save($);


    //set up popup box
    // noinspection JSPotentiallyInvalidConstructorUsage,JSUnusedGlobalSymbols
    modal = new tingle.modal({
        footer: true,
        stickyFooter: false,
        closeMethods: ['overlay', 'button', 'escape'],
        closeLabel: "Close",
        cssClass: ['shell-game-element-popup'],
        onOpen: function() {

        },
        onClose: function() {
            //do not destroy this
        },
        beforeClose: function() {
            return true; // close the modal
            // return false; // nothing happens
        }
    });

    // add a button
    modal.addFooterBtn('Load', 'tingle-btn tingle-btn--default', function() {

        load_from_yaml();
        modal.close();


    });


    modal.addFooterBtn('Close Without Loading', 'tingle-btn tingle-btn--pull-right', function() {

        modal.close();


    });



    modal.setContent(editing_div[0]);

    $('button#shell-game-yaml-editor').click(function() {
        // open modal
        shell_game_editor.renderer.updateFull();
        modal.open();
    }) ;

});


/**
 * @return {string}
 */
function shell_game_get_editor_value() {
    let v =  shell_game_editor.getValue();
    localStorage.setItem(SHELL_GAME_STORAGE_BACKUP_KEY,v);
    return v;
}

function shell_game_set_editor_value_from_object(thing_which_is_object,key_to_replace) {
    let new_thing;
    if (thing_which_is_object === '') {thing_which_is_object = {};}

    if (key_to_replace) {
        new_thing = shell_game_get_object_from_editor_value();
        new_thing[key_to_replace] = thing_which_is_object;

    } else {
        new_thing = thing_which_is_object;
    }
    try {
        let yaml = jsyaml.dump(new_thing, {skipInvalid: true});
        shell_game_editor.setValue(yaml,1);
    } catch (e) {
        throw new YamlConvertError(e.name + ': <br>' + e.message + '<b> Cannot Set Yaml In Editor</b>');
    }
}

/**
 * @param {string} [alternate_yaml]
 * @return {ShellGameRawInput}
 */
function shell_game_get_object_from_editor_value(alternate_yaml) {
    /**
     * @type {object} yaml_parsed
     */
    let yaml_parsed ;
    let yaml_string = shell_game_get_editor_value();
    if (!yaml_string.trim() && alternate_yaml) {
        shell_game_editor.setValue(alternate_yaml,1);
        shell_game_editor.renderer.updateFull();
        return shell_game_get_object_from_editor_value();
    }
    try {
        yaml_parsed = jsyaml.load(yaml_string, 'utf8');
        console.debug('yaml read is',yaml_parsed);
    } catch(e) {
        throw new YamlParseError(e.name + ': <br>' + e.message + '<b> Cannot parse Yaml</b>');
    }
    return yaml_parsed;
}

function shell_game_editor_setup_save($) {

    let init_data = localStorage.getItem(SHELL_GAME_STORAGE_KEY);
    if (!init_data) {init_data = '';}
    shell_game_editor.setValue(init_data,1);

    let saveText = function () {
        let data = shell_game_editor.getValue();
        if (!data) {data = '';}
        localStorage.setItem(SHELL_GAME_STORAGE_KEY,data);
    };
    let autoSave = function() {
        saveText();
        setTimeout(autoSave, 3000);
    };
    autoSave();

    $("#shell-game-editor").on("keydown", function (b) {

        if (b.ctrlKey || b.metaKey) {
            switch (String.fromCharCode(b.which).toLowerCase()) {
                case 's':
                    b.preventDefault();
                    saveText();
                    break;
                case 'f':

                    break;
                case 'g':

                    break;
            }
        }

    });
}

jQuery(function(){
    //synchronize yaml editor after refresh
    shell_game_thing.add_event(new ShellGameEventHook(
        'on_refresh',
        null,
        function (hook) {
            let out = hook.current_value;
            shell_game_set_editor_value_from_object(out);
        }
    ));
});