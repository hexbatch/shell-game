let shell_game_edit_element;

jQuery(function ($) {



    let js_editor;
    let modal;
    let editing_div = $("div.shell-game-element-editor");
    let table_body_var = editing_div.find('table.shell-game-edit-element-variables tbody');
    let table_body_glom = editing_div.find('table.shell-game-edit-element-gloms tbody');

    /**
     *
     * @param {ShellGameSerializedVariable} da_var
     */
    function make_var_tr(da_var) {
        let row_html =
            `
            <tr>
                <td colspan="3">
                     <div class="input-group input-group-sm">
                        <input type="text" class="form-control" name="shell_game_edit_element_var_name[]" value="${da_var.variable_name}">
                        <input type="text" class="form-control" name="shell_game_edit_element_var_init_value[]" value="${da_var.variable_initial_value}">
                        <div class="input-group-append">
                            <button class="btn btn-sm  shell-game-edit-element-delete-var " >
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
     * @param {?string} element_guid
     * @param {ShellGameSerializedGlom} da_glom
     */
    function make_glom_tr(element_guid,da_glom) {

        /**
         *
         * @type {ShellGameGlomLibraryReference[]}
         */
        let refs = [];
        let refs_lines = [];
        let refs_cell = '';
        if (element_guid) {
            refs = shell_game_thing.get_glom_template_targets(element_guid,da_glom.glom_reference_name);
            for (let i = 0; i < refs.length; i++) {
                let a_ref = refs[i];
                let line = `
                    <div class="border rounded lighten m-1 shell-game-edit-element-glom-trace">
                         <small><span 
                            class="rounded shell-name-blurb"
                            data-shell_guid="${a_ref.starting_shell.guid}"
                            data-element_guid="${a_ref.starting_element.guid}"
                        >
                             ${a_ref.starting_shell.shell_name}
                             <span><i class="fas fa-angle-double-right"></i></span> 
                             <span class="font-weight-bold">|</span>
                        </span></small>
                        
                        
                        
                        <small><span 
                            class="rounded var-name-blurb"
                            data-variable_name="${a_ref.variable_target_name.guid}"
                        >
                            <span data-shell_guid="${a_ref.target_shell.guid}"
                                  class ="shell-game-action-link shell-game-shell-link" 
                            >
                                ${a_ref.target_shell.shell_name}
                            </span>
                            <span><i class="fas fa-angle-double-right"></i></span> 
                            <span 
                                data-element_guid="${a_ref.target_element.guid}"
                                class="p-1 pl-2 mr-1 rounded shell-game-action-link shell-game-element-link"
                            >
                                ${a_ref.target_element.element_name}
                            </span>
                            <i class="far fa-dot-circle shell-game-action-link shell-game-shell-link "
                                       data-shell_guid="${a_ref.target_shell.guid}" 
                            ></i>
                        </span></small>
                        
                    
                    </div>
                `;
                refs_lines.push(line.trim());
            }
            let lines_now = refs_lines.join("\n");
            refs_cell = `${lines_now}\n`;
        }
        let row_html =
            `
                    <tr>
                        <td colspan="3">
                            <div class="input-group input-group-sm">
                                <input type="text" class="form-control" name="shell_game_edit_element_glom_ref[]" value="${da_glom.glom_reference_name}"> 
                                <input type="text" class="form-control" name="shell_game_edit_element_glom_target[]" value="${da_glom.glom_target_name}"> 
                                <div class="input-group-append">
                                    <button class="btn btn-sm  shell-game-edit-element-delete-glom " >
                                        <i class="fas fa-trash text-muted"></i>
                                    </button>
                                </div>
                            </div> <!-- /.input-group -->
                            ${refs_cell}
                        </td>
                    </tr>`;
        row_html = row_html.trim();
        return row_html;
    }

    /**
     *
     * @param {string} element_guid
     */
    shell_game_edit_element = function(element_guid) {
        // set content
        if (element_guid === undefined || !element_guid || element_guid==="0") {return;}
        let element_to_edit;
        if (element_guid === 'new') {
            element_to_edit = null;
            editing_div.find('input.shell-game-edit-element-name').val('');
            editing_div.find('input.shell-game-edit-element-this').val('');
            editing_div.find('.shell-game-edit-element-guid').text('').hide();
            editing_div.find('input.shell-game-edit-element-color').val(DEFAULT_ELEMENT_COLOR);
            table_body_var.html('');
            table_body_glom.html('');
            if (js_editor) {
                js_editor.setValue('', 1);
            }

        } else {
            element_to_edit = shell_game_thing.get_element_by_guid(element_guid);
            editing_div.find('input.shell-game-edit-element-name').val(element_to_edit.element_name);

            editing_div.find('input.shell-game-edit-element-this').val(element_to_edit.guid);
            editing_div.find('.shell-game-edit-element-guid').text(element_to_edit.guid).show();

            let color = null;
            if ('colors' in shell_game_thing.last_raw) {
                if (shell_game_thing.last_raw.colors.hasOwnProperty(element_guid)) {
                    color = shell_game_thing.last_raw.colors[element_guid];
                    editing_div.find('input.shell-game-edit-element-color').val(color);
                }
            }
            if (!color) {
                editing_div.find('input.shell-game-edit-element-color').val(DEFAULT_ELEMENT_COLOR)
            }

            table_body_var.html('');
            for (let i in element_to_edit.element_variables) {
                if (!element_to_edit.element_variables.hasOwnProperty(i)) {
                    continue;
                }
                let da_var = element_to_edit.element_variables[i];
                let row_html = make_var_tr(da_var);
                table_body_var.append(row_html);
            }


            table_body_glom.html('');
            for (let i in element_to_edit.element_gloms) {
                if (!element_to_edit.element_gloms.hasOwnProperty(i)) {
                    continue;
                }
                let da_glom = element_to_edit.element_gloms[i];
                let row_html = make_glom_tr(element_to_edit.guid, da_glom);
                table_body_glom.append(row_html);
            }

            /*
            colorize
             */
            table_body_glom.find('.shell-game-element-link').each(function () {
                let link_color = null;
                let link_guid = $(this).data('element_guid');
                if ('colors' in shell_game_thing.last_raw) {
                    if (shell_game_thing.last_raw.colors.hasOwnProperty(link_guid)) {
                        link_color = shell_game_thing.last_raw.colors[link_guid];
                    }
                }

                if (link_color) {
                    $(this).css('background-color', link_color)
                }
            });
        }


        // open modal
        modal.open();
    }//end main function for editing shells


    // noinspection JSPotentiallyInvalidConstructorUsage,JSUnusedGlobalSymbols
    modal = new tingle.modal({
        footer: true,
        stickyFooter: false,
        closeMethods: ['overlay', 'button', 'escape'],
        closeLabel: "Close",
        cssClass: ['shell-game-element-popup'],
        onOpen: function() {
            if (!js_editor) {
                js_editor = ace.edit("shell-game-edit-element-script");
                js_editor.setTheme("ace/theme/gob");
                js_editor.session.setMode("ace/mode/javascript");
            }
            let element_guid = editing_div.find('input.shell-game-edit-element-this').val();





            //set history
            let history = $('div.shell-game-element-history');
            let last_item = history.find('div.shell-game-current-element').detach();
            last_item.removeClass('shell-game-current-element');
            last_item.addClass('shell-game-element-link');

            if (element_guid) { //it can be a new element
                let element_to_edit = shell_game_thing.get_element_by_guid(element_guid);
                js_editor.setValue(element_to_edit.element_script, 1);




                //any with same guid as that being added will be removed also
                history.find(`div[data-element_guid="${element_to_edit.guid}"]`).remove();


                let new_menu_item = $(
                    `<div class="dropdown-item shell-game-current-element shell-game-action-link " data-element_guid="${element_to_edit.guid}"> ${element_to_edit.element_name}</div>`
                );
                if ('colors' in shell_game_thing.last_raw) {
                    if (shell_game_thing.last_raw.colors.hasOwnProperty(element_guid)) {
                        let color = shell_game_thing.last_raw.colors[element_guid];
                        new_menu_item.css('background-color', color)
                    }
                }

                let count_history = history.find('div.shell-game-action-link').length;
                const MAX_HISTORY_LENGTH = 20;
                if (count_history > MAX_HISTORY_LENGTH) {
                    let number_to_trim = count_history - MAX_HISTORY_LENGTH;
                    history.find(`div.shell-game-action-link:nth-last-child(-n+${number_to_trim})`).remove();
                }

                history.append(new_menu_item);

            } else {
                let last_item_guid = last_item.data('element_guid');
                if (last_item_guid) {
                    history.find(`div[data-element_guid="${last_item_guid}"]`).remove();
                }
            }
            history.prepend(last_item);



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
    modal.addFooterBtn('Update Element', 'tingle-btn tingle-btn--default', function() {
        let element_to_update
        let updating_element_guid = editing_div.find('input.shell-game-edit-element-this').val();
        if (updating_element_guid) {
            element_to_update = shell_game_thing.get_element_by_guid(updating_element_guid);
        } else {
            element_to_update = new ShellGameSerializedElement();
        }

        element_to_update.element_name = editing_div.find('input.shell-game-edit-element-name').val();

        element_to_update.element_script = js_editor.getValue();


        element_to_update.element_variables = {};
        table_body_var.find('tr').each(function(){
            let tr = $(this);
            let name = tr.find("input[name='shell_game_edit_element_var_name[]']").val().trim();
            let init_value = tr.find("input[name='shell_game_edit_element_var_init_value[]']").val();
            if (!init_value) {init_value = null;}
            if (!_.isNaN(parseFloat(init_value))) {init_value = parseFloat(init_value);}
            if (name) {
                let node = new ShellGameSerializedVariable();
                node.variable_initial_value = init_value;
                node.variable_name = name;
                element_to_update.element_variables[name] = node;
            }

        });

        element_to_update.element_gloms = {};
        table_body_glom.find('tr').each(function(){
            let tr = $(this);
            let ref = tr.find("input[name='shell_game_edit_element_glom_ref[]']").val().trim();
            let target = tr.find("input[name='shell_game_edit_element_glom_target[]']").val().trim();

            if (ref && target) {
                let node = new ShellGameSerializedGlom();
                node.glom_reference_name = ref;
                node.glom_target_name = target;
                element_to_update.element_gloms[ref] = node;
            }

        });

        //colors
        let element_color = editing_div.find('input.shell-game-edit-element-color').val();
        if (!element_color || element_color === '#000000' ||  element_color === '#000') {
            element_color = '#dddddd'
        }
        if (updating_element_guid) {
            let colors;
            if (!('colors' in shell_game_thing.last_raw)) {
                colors = {};
            } else {
                colors = shell_game_thing.last_raw.colors;
            }

            editing_div.find(`div[data-element_guid="${element_to_update.guid}"]`).css('background-color', element_color);
            colors[updating_element_guid] = element_color;

            shell_game_thing.add_top_key('colors', colors, false);//it gets refreshed when the element is saved right after this

            shell_game_thing.edit_element(element_to_update);
        } else {
            shell_game_thing.add_element(element_to_update,element_color);
        }

        modal.close();




    });

    // add another button
    modal.addFooterBtn('Delete Element', 'tingle-btn tingle-btn--danger tingle-btn--pull-right', function() {
        let element_to_update
        let updating_element_guid = editing_div.find('input.shell-game-edit-element-this').val();
        if (updating_element_guid) {
            element_to_update = shell_game_thing.get_element_by_guid(updating_element_guid);
        } else {
            element_to_update = new ShellGameSerializedElement();
        }

        if (element_to_update.guid) {
            shell_game_thing.delete_element(element_to_update.guid);
        }
        modal.close();
    });

    modal.setContent(editing_div[0]);

    $('#shell-game-edit-new-element-glom').click(function(){
        let da_glom = new ShellGameSerializedGlom();
        let row_html = make_glom_tr(null,da_glom);
        table_body_glom.append(row_html);
    });

    $('#shell-game-edit-new-element-variable').click(function(){
        let da_var = new ShellGameSerializedVariable();
        let row_html = make_var_tr(da_var);
        table_body_var.append(row_html);
    });

    $('body').on('click','.shell-game-edit-element-delete-var',function() {
       let row = $(this).closest('tr');
       row.remove();
    });

    $('body').on('click','.shell-game-edit-element-delete-glom',function() {
        let row = $(this).closest('tr');
        row.remove();
    });

    $('body').on('click','.shell-game-element-link',function() {
        let element_guid = $(this).data('element_guid');
        shell_game_edit_element(element_guid);
    });


});