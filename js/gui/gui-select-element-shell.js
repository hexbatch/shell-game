let select_for_master_all = null;
let select_for_master_all_data = [];



jQuery(function ($) {



    let regular_select_element = $('select#shell-game-element-list');
    let customAdapter = $.fn.select2.amd.require('select2/data/customAdapter');


    select_for_master_all = regular_select_element.select2({
        dataAdapter: customAdapter,
        data: select_for_master_all_data,
        placeholder: {
            id: '0', // the value of the option
            text: 'Edit Shells and Elements'
        },
        containerCssClass: 'form-control',
        theme: 'bootstrap4',
    });

    let what_to_edit = null;

    function process_what_to_edit(teddy_bear) {
        if (!teddy_bear) {return;}

        if (! 'type' in teddy_bear) {
            throw new Error("Select data does not have a type!");
        }

        if (! 'info' in teddy_bear) {
            throw new Error("Select data does not have a type!");
        }

        switch (teddy_bear.type) {
            case 'shell': {

                if ('make_new' in teddy_bear.info) {
                    shell_game_edit_shell('new');
                } else {
                    shell_game_edit_shell(teddy_bear.info.guid);
                }
                break;
            }
            case 'element': {

                if ('make_new' in teddy_bear.info) {
                    shell_game_edit_element('new');
                } else {
                    shell_game_edit_element(teddy_bear.info.guid);
                }

                break;
            }
            default: {
                throw new Error("Select data does not have a type I recognize! (shell|element) got " + teddy_bear.type);
            }
        }
    }

    regular_select_element.on('select2:select', function (e) {

        try {
            /**
             * @var {ShellGameSerializedElement}
             */
            what_to_edit = e.params.data.data;
            if (!what_to_edit) {
                return;
            }

            process_what_to_edit(what_to_edit);

        } catch (e) {
            console.error(e);
            do_toast({title:'Error For Editing Element',subtitle:e.name,content: e.message,delay:0,type:'error'});
        }


    });



    //fill in element list
    shell_game_thing.add_event(new ShellGameEventHook(
        'on_refresh',
        null,
        function (hook) {
            let game = hook.keeper.serialized_game;
            select_for_master_all_data = [];

            let group = {
                text: "Elements",
                children: []
            }

            group.children.push({id:"new",text:" *** New Element *** ",notes:"For New", data: { type: 'element', info: {make_new: true}}});
            for(let element_name in game.element_lib) {
                if (!game.element_lib.hasOwnProperty(element_name)) {continue;}
                let element = game.element_lib[element_name];
                group.children.push({id:element.guid,text:element.element_name,data: { type: 'element', info:element }});
            }
            select_for_master_all_data.push(group);

            group = {
                text: "Shells",
                children: []
            }

            group.children.push({id:"new",text:" *** New Shell *** ",notes:"For New", data: { type: 'shell', info: {make_new: true}}});

            for(let shell_name in game.shell_lib) {
                if (!game.shell_lib.hasOwnProperty(shell_name)) {continue;}
                let shell = game.shell_lib[shell_name];
                group.children.push({id:shell.guid,text:shell.shell_name,data: { type: 'shell', info:shell }});
            }
            select_for_master_all_data.push(group);


            select_for_master_all.data('select2').dataAdapter.updateOptions(select_for_master_all_data);

        }
    ));

    $("#shell-game-edit-selected-any").click(function() {

        try {

            process_what_to_edit(what_to_edit);

        } catch (e) {
            console.error(e);
            do_toast({title:'Error For Editing Element',subtitle:e.name,content: e.message,delay:0,type:'error'});
        }
    });



});