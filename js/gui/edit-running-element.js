let shell_game_edit_running_element;

jQuery(function ($) {



    let modal;
    let editing_div = $("div.shell-game-running-element-editor");
    let table_body_var = editing_div.find('table.shell-game-running-element-values tbody');

    /**
     *
     * @param {string} var_name
     * @param {string} var_value
     */
    function make_var_tr(var_name,var_value) {
        let row_html =
            `
            <tr>
                <td colspan="2">
                     <div class="input-group input-group-sm">
                        <input type="text" readonly class="form-control" name="shell_game_edit_element_var_name[]" value="${var_name}">
                        <input type="text" class="form-control" name="shell_game_edit_element_var_running_value[]" value="${var_value}">
                    </div> <!-- /.input-group -->
                </td>
                
            </tr>
            `;
        return row_html;
    }



    /**
     *
     * @param {string} element_guid
     */
    shell_game_edit_running_element = function(element_guid) {
        // set content
        if (element_guid === undefined || !element_guid || element_guid==="0") {return;}
        let running_element_to_edit;

        running_element_to_edit = shell_game_thing.get_running_element_or_null_by_guid(element_guid);
        if (!running_element_to_edit) {return;}
        let master_element = shell_game_thing.get_master_element_by_guid(running_element_to_edit.guid);

        editing_div.find('input.shell-game-edit-element-name').val(master_element.element_name);

        editing_div.find('input.shell-game-edit-running-element-this').val(running_element_to_edit.guid);
        editing_div.find('.shell-game-edit-element-guid').text(running_element_to_edit.guid).show();



        table_body_var.html('');
        for (let variable_name in running_element_to_edit.variables) {
            if (!running_element_to_edit.variables.hasOwnProperty(variable_name)) {
                continue;
            }
            let variable_value = running_element_to_edit.variables[variable_name];
            let row_html = make_var_tr(variable_name,variable_value);
            table_body_var.append(row_html);
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
        cssClass: ['shell-game-running-element-popup'],
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


    modal.addFooterBtn('Edit Element', 'tingle-btn tingle-btn--pull-right', function() {
        let guid = editing_div.find('input.shell-game-edit-running-element-this').val();
        modal.close();
        shell_game_edit_element(guid);
    });

    // add a button
    modal.addFooterBtn('Update Variables', 'tingle-btn tingle-btn--default', function() {
        let element_to_update
        let updating_element_guid = editing_div.find('input.shell-game-edit-running-element-this').val();
        let b_close = true;
        try {
            if (!updating_element_guid) {
                throw new Error("GUID missing for the element to update");
            }

            element_to_update = shell_game_thing.get_running_element_or_null_by_guid(updating_element_guid);
            if (!element_to_update) {
                throw new Error(`Cannot find running element of guid: ${updating_element_guid}`);
            }

            table_body_var.find('tr').each(function(){
                let tr = $(this);
                let name = tr.find("input[name='shell_game_edit_element_var_name[]']").val().trim();
                let value = tr.find("input[name='shell_game_edit_element_var_running_value[]']").val();
                if (!value) {value = null;}
                if (!_.isNaN(parseFloat(value))) {value = parseFloat(value);}
                if (name) {
                    if (element_to_update.variables.hasOwnProperty(name)) {
                        element_to_update.variables[name] = value;
                    }
                }

            });
            shell_game_thing.update_running_element(element_to_update);



        } catch (e) {
            console.error(e);
            do_toast({title:'Error For Editing Running Element',subtitle:e.name,content: e.message,delay:0,type:'error'});
            b_close = false;
        }



        if (b_close) {
            modal.close();
        }




    });



    modal.setContent(editing_div[0]);


});