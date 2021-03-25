let select_for_master_shells = null;
let select_for_master_shells_data = [];

jQuery(function ($) {



    let regular_select_element = $('select#shell-game-edit-shell-master-list');

    let customAdapter = $.fn.select2.amd.require('select2/data/customAdapter');


    select_for_master_shells = regular_select_element.select2({
        dataAdapter: customAdapter,
        data: select_for_master_shells_data,
        placeholder: {
            id: '0', // the value of the option
            text: 'Select Shell To Edit'
        },
        containerCssClass: 'form-control'
    });

    /**
     * @type {ShellGameSerializedShell}
     */
    let shell_to_edit;

    regular_select_element.on('select2:select', function (e) {

        try {

            shell_to_edit = e.params.data.data;
            if (!shell_to_edit) {
                return;
            }
            if ('make_new' in shell_to_edit) {
                shell_game_edit_shell('new');
            } else {
                shell_game_edit_shell(shell_to_edit.guid);
            }
        } catch (e) {
            console.error(e);
            do_toast({title:'Error For Editing Shell',subtitle:e.name,content: e.message,delay:0,type:'error'});
        }


    });



    //fill in element list
    shell_game_thing.add_event(new ShellGameEventHook(
        'on_refresh',
        null,
        function (hook) {
            let game = hook.keeper.serialized_game;
            select_for_master_shells_data = [];

            select_for_master_shells_data.push({id:"new",text:" *** New Shell *** ",notes:"For New", data: {make_new: true}});
            for(let shell_name in game.shell_lib) {
                if (!game.shell_lib.hasOwnProperty(shell_name)) {continue;}
                let shell = game.shell_lib[shell_name];
                select_for_master_shells_data.push({id:shell.guid,text:shell.shell_name,data: shell});
            }
            select_for_master_shells.data('select2').dataAdapter.updateOptions(select_for_master_shells_data);

        }
    ));
    


    $("#shell-game-edit-selected-shell").click(function() {
        let shell_guid = regular_select_element.val();
        if (!shell_guid) {return;}
        try {
            shell_game_edit_shell(shell_guid);


        } catch (e) {
            console.error(e);
            do_toast({title:'Error For Editing Shell',subtitle:e.name,content: e.message,delay:0,type:'error'});
        }
    });



});