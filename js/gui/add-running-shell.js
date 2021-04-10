
jQuery(function ($) {


    let modal;
    let main_div = $("div.shell-game-add-running-shell");
    let select_shell_to_add = $('select.shell-game-add-running-shell-to-parent-list');

    let customAdapter = $.fn.select2.amd.require('select2/data/customAdapter');


    let select_2_insert = select_shell_to_add.select2({
        dataAdapter: customAdapter,
        data: [],
        placeholder: {
            id: '0', // the value of the option
            text: 'Select Child Shell Type'
        },
        containerCssClass: 'form-control',
        theme: 'bootstrap4',
    });

    shell_game_thing.add_event(new ShellGameEventHook(
        'on_selected_running_shell',
        null,
        function (hook) {

            let shell_selected = hook.keeper.selected_running_shell;
            let data_array = [];
            main_div.find('.shell-game-parent-name').text('');
            main_div.find('.shell-game-target-parent-shell-guid').text('');

            if (shell_selected) {
                data_array.push({id:0,text:"Select Possible Child",data: null});
                let shell_possible_master_children = hook.keeper.get_master_child_shells_of_running_shell(shell_selected.guid);

                for(let k = 0; k < shell_possible_master_children.length; k++) {
                    let shell_child = shell_possible_master_children[k];
                    data_array.push({id:shell_child.guid,text:shell_child.shell_name,data: shell_child});
                }

                let master_shell = hook.keeper.get_master_shell_by_childs_guid(shell_selected.guid);
                main_div.find('.shell-game-parent-name').text(master_shell.shell_name);
                main_div.find('.shell-game-target-parent-shell-guid').text(shell_selected.guid);
                main_div.find('input.shell-game-add-shell-this').val(shell_selected.guid)
            }


            select_2_insert.data('select2').dataAdapter.updateOptions(data_array);



        })
    );


    $("#shell-game-place-action").click(function() {

        // open modal
        if (shell_game_thing.selected_running_shell) {
            modal.open();
        } else {
            do_toast({title:'Cannot Insert Without a Selection',subtitle:'',content: 'There was an issue inserting a new shell',delay:10000,type:'warning'});
        }

    });





    // noinspection JSPotentiallyInvalidConstructorUsage,JSUnusedGlobalSymbols
    modal = new tingle.modal({
        footer: true,
        stickyFooter: false,
        closeMethods: ['overlay', 'button', 'escape'],
        closeLabel: "Close",
        cssClass: ['shell-game-insert-running-popup'],
        onOpen: function() {


        },
        onClose: function() {
            //modal.destroy();
        },
        beforeClose: function() {

            return true; // close the modal
            // return false; // nothing happens
        }
    });

    // add a button
    modal.addFooterBtn('Insert Shell', 'tingle-btn tingle-btn--default', function() {
        /**
         * @type {ShellGameSerializedShell}
         */
        let shell_to_insert;
        let parent_shell_to_insert_to_guid = main_div.find('input.shell-game-add-shell-this').val();
        if (parent_shell_to_insert_to_guid) {
            shell_to_insert = shell_game_thing.get_shell_by_guid(parent_shell_to_insert_to_guid);
        }

        if (!shell_to_insert) {
            do_toast({title:'Cannot Find the parent shell',subtitle:'',content: 'There was an issue inserting a new shell',delay:10000,type:'warning'});
        }


        let child_shell_guid = select_shell_to_add.val();
        if (!child_shell_guid || child_shell_guid==='0') {return;}
        let b_close = true;

        try {
            shell_game_thing.insert_running_shell(child_shell_guid,parent_shell_to_insert_to_guid);

        } catch (e) {
            b_close = false;
            console.error(e);
            do_toast({title:'Error Inserting Running Shell',subtitle:e.name,content: e.message,delay:0,type:'error'});
        }



        if (b_close) {
            modal.close();
        }




    });


    modal.setContent(main_div[0]);



});