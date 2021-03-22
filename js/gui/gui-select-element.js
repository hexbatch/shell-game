let select_for_master_elements = null;
let select_for_master_elements_data = [];


jQuery(function ($) {



    let regular_select_element = $('select#shell-game-element-list');
    let customAdapter = $.fn.select2.amd.require('select2/data/customAdapter');


    select_for_master_elements = regular_select_element.select2({
        dataAdapter: customAdapter,
        data: select_for_master_elements_data,
        placeholder: {
            id: '-1', // the value of the option
            text: 'Select an Element'
        },
        containerCssClass: 'form-control'
    });

    let element_to_edit;

    regular_select_element.on('select2:select', function (e) {

        /**
         * @var {ShellGameSerializedElement}
         */
        element_to_edit = e.params.data.data;
        if (!element_to_edit) {return;}
        shell_game_edit_element(element_to_edit.guid);

    });



    //fill in element list
    shell_game_thing.add_event(new ShellGameEventHook(
        'on_load',
        null,
        function (hook) {
            let game = hook.keeper.serialized_game;
            select_for_master_elements_data = [];

            select_for_master_elements_data.push({id:-1,text:"(choose element)",notes:"blank line", data: null});
            for(let element_name in game.element_lib) {
                if (!game.element_lib.hasOwnProperty(element_name)) {continue;}
                let element = game.element_lib[element_name];
                select_for_master_elements_data.push({id:element.guid,text:element.element_name,data: element});
            }
            select_for_master_elements.data('select2').dataAdapter.updateOptions(select_for_master_elements_data);

        }
    ));



});