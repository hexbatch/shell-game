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
                        <td>
                          <input type="text" class="form-control" name="shell_game_edit_element_var_name[]" value="${da_var.variable_name}">      
                        </td>
                        <td>
                          <input type="text" class="form-control" name="shell_game_edit_element_var_init_value[]" value="${da_var.variable_initial_value}">      
                        </td>
                        <td>
                            <i class="fas fa-trash text-danger shell-game-edit-element-delete-var shell-game-action-link"></i>
                        </td>
                    </tr>`;
        return row_html;
    }


    /**
     * @param {?string} element_guid
     * @param {ShellGameSerializedGlom} da_glom
     */
    function make_glom_tr(element_guid,da_glom) {

        /**
         *
         * @type {ShellGameGlomReference[]}
         */
        let refs = [];
        let refs_lines = [];
        let refs_cell = '';
        if (element_guid) {
            refs = shell_game_thing.get_glom_template_targets(element_guid,da_glom.glom_reference_name);
            for (let i = 0; i < refs.length; i++) {
                let a_ref = refs[i];
                let line = `
                    <div class="shell-game-edit-element-glom-trace">
                    <span data-shell_guid="${a_ref.target_shell.guid}">Shell ${a_ref.target_shell}</span>
                    <span data-element_guid="${a_ref.target_element.guid}">Element ${a_ref.target_element.element_name}</span>
                    <span >Variable ${a_ref.variable_target_name}</span>
                    </div>
                `;
                refs_lines.push(line.trim());
            }
            let lines_now = refs_lines.join("\n");
            refs_cell = `<td colspan="3">${lines_now}\n</td>`;
        }
        let row_html =
            `
                    <tr>
                        <td>
                          <input type="text" class="form-control" name="shell_game_edit_element_glom_ref[]" value="${da_glom.glom_reference_name}">      
                        </td>
                        <td>
                          <input type="text" class="form-control" name="shell_game_edit_element_glom_target[]" value="${da_glom.glom_target_name}">      
                        </td>
                        <td>
                            <i class="fas fa-trash text-danger shell-game-edit-element-delete-glom shell-game-action-link"></i>
                        </td>
                        ${refs_cell}
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
        let element_to_edit = shell_game_thing.get_element_by_guid(element_guid);
        editing_div.find('input.shell-game-edit-element-name').val(element_to_edit.element_name);

        editing_div.find('input.shell-game-edit-element-this').val(element_to_edit.guid);
        editing_div.find('span.shell-game-edit-element-guid').text(element_to_edit.guid);

        table_body_var.html('');
        for(let i in element_to_edit.element_variables) {
            if (!element_to_edit.element_variables.hasOwnProperty(i)) {continue;}
            let da_var = element_to_edit.element_variables[i];
            let row_html = make_var_tr(da_var);
            table_body_var.append(row_html);
        }


        table_body_glom.html('');
        for(let i in element_to_edit.element_gloms) {
            if (!element_to_edit.element_gloms.hasOwnProperty(i)) {continue;}
            let da_glom = element_to_edit.element_gloms[i];
            let row_html = make_glom_tr(element_to_edit.guid,da_glom);
            table_body_glom.append(row_html);
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
        cssClass: ['shell-game-element-popup'],
        onOpen: function() {
            if (!js_editor) {
                js_editor = ace.edit("shell-game-edit-element-script");
                js_editor.setTheme("ace/theme/gob");
                js_editor.session.setMode("ace/mode/javascript");
            }
            let element_guid = editing_div.find('input.shell-game-edit-element-this').val();
            let element_to_edit = shell_game_thing.get_element_by_guid(element_guid);
            js_editor.setValue(element_to_edit.element_script,1);

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
    modal.addFooterBtn('Edit', 'tingle-btn tingle-btn--default', function() {
        // here goes some logic
        modal.close();
    });

    // add another button
    modal.addFooterBtn('Delete', 'tingle-btn tingle-btn--danger tingle-btn--pull-right', function() {
        // here goes some logic
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

    $('body').on('click','i.shell-game-edit-element-delete-var',function() {
       let row = $(this).closest('tr');
       row.remove();
    });

    $('body').on('click','i.shell-game-edit-element-delete-glom',function() {
        let row = $(this).closest('tr');
        row.remove();
    });

});