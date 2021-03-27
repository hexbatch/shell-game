let shell_game_edit_shell;

jQuery(function ($) {

    const EMPTY_ELEMENT_NAME_VALUE = '---';

    let modal;
    let editing_div = $("div.shell-game-shell-editor");
    let select_parent = $('select.shell-game-edit-shell-parent-list');
    let table_body_components = editing_div.find('table.shell-game-edit-shell-components tbody');

    let element_name_list = [];
    let customAdapter = $.fn.select2.amd.require('select2/data/customAdapter');


    let select_2_parent = select_parent.select2({
        dataAdapter: customAdapter,
        data: [],
        placeholder: {
            id: '0', // the value of the option
            text: 'Select Parent'
        },
        containerCssClass: 'form-control',
        theme: 'bootstrap4',
    });
    
    let running_rows = 0;


    /**
     *
     * @param {ShellGameSerializedShellElement} da_el
     */
    function make_component_tr(da_el) {
        let row_html =
            `
            <tr>
                <td colspan="3">
                     <div class="input-group input-group-sm">
                        <select class="form-control shell-game-shell-edit-component" name="shell_game_edit_shell_component_name_${running_rows}" data-element_name="${da_el.element_name}"></select>
                        <select class="form-control shell-game-shell-edit-init" name="shell_game_shell_edit_init_${running_rows}" data-element_init="${da_el.element_init}"></select>
                        <select class="form-control shell-game-shell-edit-end" name="shell_game_shell_edit_end__${running_rows}" data-element_end="${da_el.element_end}"></select>
                        <div class="input-group-append">
                            <button class="btn btn-sm  shell-game-edit-shell-delete-component " >
                                <i class="fas fa-trash text-muted"></i>
                            </button>
                        </div>
                    </div> <!-- /.input-group -->
                </td>
                
            </tr>
            `;
        return row_html;
    }


    /**
     *
     * @param {jQuery} parent
     */
    function kill_select_twos(parent) {
        parent.find('select').each(function(){
            let sel = $(this);
            if (sel.hasClass("select2-hidden-accessible")) {
                sel.select2('destroy');
            } else {
                console.warn('not a select2',sel);
            }
        });
    }


    /**
     *
     * @param {jQuery} parent
     */
    function make_select_twos_inside_dom(parent) {

        function make_select_two_with_data(sel,data) {

            let fake_data = [];

            let da_thing_i_made = sel.select2({
                dataAdapter: customAdapter,
                data: fake_data,
                containerCssClass: 'form-control',
                theme: 'bootstrap4',
            });


            for(let i = 0; i < data.length; i++) {
                let name = data[i];
                fake_data.push({id:name,text:name});
            }
            da_thing_i_made.data('select2').dataAdapter.updateOptions(fake_data);
            return da_thing_i_made;
        }


        //initialize the select boxes
        parent.find('select.shell-game-shell-edit-component').each(function() {
            let sel = $(this);
            let element_name = sel.data('element_name');
            make_select_two_with_data(sel,element_name_list);
            sel.val(element_name);
        });

        parent.find('select.shell-game-shell-edit-init').each(function() {
            let sel = $(this);
            let element_init = sel.data('element_init');
            make_select_two_with_data(sel,SHELL_GAME_COMPONENT_INIT_STATE);
            sel.val(element_init);
        });

        parent.find('select.shell-game-shell-edit-end').each(function() {
            let sel = $(this);
            let element_end = sel.data('element_end');
            make_select_two_with_data(sel,SHELL_GAME_COMPONENT_END_STATE);
            sel.val(element_end);
        });


    }

    /**
     *
     * @param {string} shell_guid
     */
    shell_game_edit_shell = function(shell_guid) {
        // set content
        if (shell_guid === undefined || !shell_guid || shell_guid==="0") {return;}

        /**
         * @type {ShellGameSerializedShell}
         */
        let shell_to_edit;


        kill_select_twos(table_body_components);

        if (shell_guid === 'new') {
            shell_to_edit = null;
            editing_div.find('input.shell-game-edit-shell-name').val('');
            editing_div.find('input.shell-game-edit-shell-this').val('');
            editing_div.find('.shell-game-edit-shell-guid').text('').hide();
            editing_div.find('input.shell-game-edit-shell-color').val(DEFAULT_SHELL_COLOR);
            select_parent.val('');
            table_body_components.html('');


        } else {
            shell_to_edit = shell_game_thing.get_shell_by_guid(shell_guid);
            editing_div.find('input.shell-game-edit-shell-name').val(shell_to_edit.shell_name);
            editing_div.find('input.shell-game-edit-shell-this').val(shell_to_edit.guid);
            editing_div.find('.shell-game-edit-shell-guid').text(shell_to_edit.guid).show();
            let parent_shell = null;
            if (shell_to_edit.shell_parent_name && shell_game_thing.serialized_game.shell_lib.hasOwnProperty(shell_to_edit.shell_parent_name)) {
                parent_shell = shell_game_thing.serialized_game.shell_lib[shell_to_edit.shell_parent_name];
                select_parent.val(parent_shell.guid);
            }
            

            let color = null;
            if ('colors' in shell_game_thing.last_raw) {
                if (shell_game_thing.last_raw.colors.hasOwnProperty(shell_guid)) {
                    color = shell_game_thing.last_raw.colors[shell_guid];
                    editing_div.find('input.shell-game-edit-shell-color').val(color);
                }
            }
            if (!color) {
                editing_div.find('input.shell-game-edit-shell-color').val(DEFAULT_SHELL_COLOR)
            }

            table_body_components.html('');
            for (let i = 0; i <  shell_to_edit.elements.length; i++) {
                let da_el = shell_to_edit.elements[i];
                let row_html = make_component_tr(da_el);
                table_body_components.append(row_html);
            }


           make_select_twos_inside_dom(table_body_components);


        }


        // open modal
        modal.open();
    }


    // noinspection JSPotentiallyInvalidConstructorUsage,JSUnusedGlobalSymbols
    modal = new tingle.modal({
        footer: true,
        stickyFooter: false,
        closeMethods: ['overlay', 'button', 'escape'],
        closeLabel: "Close",
        cssClass: ['shell-game-shell-popup'],
        onOpen: function() {

            let found_shell_guid = editing_div.find('input.shell-game-edit-shell-this').val();

            //set history
            let history = $('div.shell-game-shell-history');
            let last_item = history.find('div.shell-game-current-shell').detach();
            last_item.removeClass('shell-game-current-shell');
            last_item.addClass('shell-game-shell-link');


            if (found_shell_guid) { //it can be a new element
                let shell_to_edit = shell_game_thing.get_shell_by_guid(found_shell_guid);
                //any with same guid as that being added will be removed also
                history.find(`div[data-shell_guid="${shell_to_edit.guid}"]`).remove();

                let count_history = history.find('div.shell-game-action-link').length;
                const MAX_HISTORY_LENGTH = 20;
                if (count_history > MAX_HISTORY_LENGTH) {
                    let number_to_trim = count_history - MAX_HISTORY_LENGTH;
                    history.find(`div.shell-game-action-link:nth-last-child(-n+${number_to_trim})`).remove();
                }

                let new_menu_item = $(
                    `<div class="dropdown-item shell-game-current-shell shell-game-action-link " data-shell_guid="${shell_to_edit.guid}"> ${shell_to_edit.shell_name}</div>`
                );

                if ('colors' in shell_game_thing.last_raw) {
                    if (shell_game_thing.last_raw.colors.hasOwnProperty(shell_to_edit.guid)) {
                        let color = shell_game_thing.last_raw.colors[shell_to_edit.guid];
                        new_menu_item.css('background-color', color)
                    }
                }


                history.append(new_menu_item);
            } else {
                let last_item_guid = last_item.data('shell_guid');
                if (last_item_guid) {
                    history.find(`div[data-shell_guid="${last_item_guid}"]`).remove();
                }
            }
            history.prepend(last_item);


        },
        onClose: function() {
            console.log('modal closed');
            //modal.destroy();
        },
        beforeClose: function() {
            // here's goes some logic
            // e.g. save content before closing the modal
            return true; // close the modal
            // return false; // nothing happens
        }
    });

    // add a button
    modal.addFooterBtn('Update Shell', 'tingle-btn tingle-btn--default', function() {
        /**
         * @type {ShellGameSerializedShell}
         */
        let shell_to_update;
        let updating_element_guid = editing_div.find('input.shell-game-edit-shell-this').val();
        if (updating_element_guid) {
            shell_to_update = shell_game_thing.get_shell_by_guid(updating_element_guid);
        } else {
            shell_to_update = new ShellGameSerializedShell();
        }

        shell_to_update.shell_name = editing_div.find('input.shell-game-edit-shell-name').val();

        let parent_guid = select_parent.val();
        if (!parent_guid) {return;}

        let parent_shell =  shell_game_thing.get_shell_by_guid(parent_guid);
        shell_to_update.shell_parent_name = parent_shell.shell_name;



        shell_to_update.elements = [];
        let element_memory = {};
        table_body_components.find('tr').each(function(){

            let tr = $(this);
            let element_name = tr.find("select.shell-game-shell-edit-component").val().trim();
            if (!element_name) {return;}
            if (element_name === EMPTY_ELEMENT_NAME_VALUE) {return;}
            if (element_memory.hasOwnProperty(element_name)) {
                throw new Error("Cannot have two identically named elements");
            }
            let init_policy = tr.find("select.shell-game-shell-edit-init").val();
            if (!SHELL_GAME_COMPONENT_INIT_STATE.includes(init_policy)) {init_policy = SHELL_GAME_COMPONENT_INIT_STATE[0];}

            let end_policy = tr.find("select.shell-game-shell-edit-end").val();
            if (!SHELL_GAME_COMPONENT_END_STATE.includes(end_policy)) { end_policy = SHELL_GAME_COMPONENT_END_STATE[0];}
            let node = new ShellGameSerializedShellElement();
            node.element_name = element_name;
            node.element_init = init_policy;
            node.element_end = end_policy;
            shell_to_update.elements.push(node);
            element_memory[element_name] = node;

        });


        //colors
        let shell_color = editing_div.find('input.shell-game-edit-shell-color').val();
        if (!shell_color || shell_color === '#000000' ||  shell_color === '#000') {
            shell_color = '#dddddd'
        }
        if (updating_element_guid) {
            let colors;
            if (!('colors' in shell_game_thing.last_raw)) {
                colors = {};
            } else {
                colors = shell_game_thing.last_raw.colors;
            }

            editing_div.find(`div[data-shell_guid="${shell_to_update.guid}"]`).css('background-color', shell_color);
            colors[updating_element_guid] = shell_color;

            shell_game_thing.add_top_key('colors', colors, false);//it gets refreshed when the element is saved right after this

            shell_game_thing.edit_shell(shell_to_update);
        } else {
            shell_game_thing.add_shell(shell_to_update,shell_color);
        }

        modal.close();




    });

    // add another button
    modal.addFooterBtn('Delete Shell', 'tingle-btn tingle-btn--danger tingle-btn--pull-right', function() {
        let shell_to_update
        let updating_shell_guid = editing_div.find('input.shell-game-edit-shell-this').val();
        if (updating_shell_guid) {
            shell_to_update = shell_game_thing.get_shell_by_guid(updating_shell_guid);
        } else {
            shell_game_edit_shell('new');//blank out form
        }

        if (shell_to_update.guid) {
            shell_game_thing.delete_shell(shell_to_update.guid);
        }
        modal.close();
    });

    modal.setContent(editing_div[0]);



    shell_game_thing.add_event(new ShellGameEventHook(
        'on_refresh',
        null,
        function (hook) {
            let game = hook.keeper.serialized_game;
            let data_array = [];

            for(let shell_name in game.shell_lib) {
                if (!game.shell_lib.hasOwnProperty(shell_name)) {continue;}
                let shell = game.shell_lib[shell_name];
                data_array.push({id:shell.guid,text:shell.shell_name,data: shell});
            }
            select_2_parent.data('select2').dataAdapter.updateOptions(data_array);

            element_name_list = [EMPTY_ELEMENT_NAME_VALUE];
            for(let element_name in game.element_lib) {
                if (!game.element_lib.hasOwnProperty(element_name)) {continue;}
                element_name_list.push(element_name);
            }
            element_name_list.sort();

        }
    ));



    $('#shell-game-edit-new-shell-component').click(function(){
        let da_var = new ShellGameSerializedShellElement();
        let row_html = make_component_tr(da_var);
        let live_shit = $(row_html);
        make_select_twos_inside_dom(live_shit);
        table_body_components.append(live_shit);
    });

    $('body').on('click','.shell-game-edit-shell-delete-component',function() {
       let row = $(this).closest('tr');
       kill_select_twos(row);
       row.remove();
    });



    $('body').on('click','.shell-game-shell-link',function() {
        let shell_guid = $(this).data('shell_guid');
        shell_game_edit_shell(shell_guid);
    });


});