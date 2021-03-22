let select_for_master_shells = null;
let select_for_master_shells_data = [];

jQuery(function ($) {
    $.fn.select2.amd.define('select2/data/customAdapter', ['select2/data/array', 'select2/utils'],
        function (ArrayAdapter, Utils) {
            function CustomDataAdapter($element, options) {
                CustomDataAdapter.__super__.constructor.call(this, $element, options);
            }

            Utils.Extend(CustomDataAdapter, ArrayAdapter);
            CustomDataAdapter.prototype.updateOptions = function (data) {
                this.$element.find('option').remove();
                this.addOptions(this.convertToOptions(data));
            }
            return CustomDataAdapter;
        }
    );


    let regular_select_element = $('select#shell-game-master-list');

    let customAdapter = $.fn.select2.amd.require('select2/data/customAdapter');


    select_for_master_shells = regular_select_element.select2({
        dataAdapter: customAdapter,
        data: select_for_master_shells_data,
        placeholder: {
            id: '-1', // the value of the option
            text: 'Select an Element'
        },
        containerCssClass: ''
    });

    regular_select_element.on('select2:select', function (e) {
        let data = e.params.data;
        console.log('selected',data);
    });


    select_for_master_shells.data('select2').dataAdapter.updateOptions(select_for_master_shells_data);


    //fill in shell list
    shell_game_thing.add_event(new ShellGameEventHook(
        'on_load',
        null,
        function (hook) {
            let game = hook.keeper.serialized_game;


            regular_select_element.html('');
            regular_select_element.append($('<option>', {
                    value: null,
                    text: '(choose)'
                })
            );

            /**
             *
             * @type {Object.<string, ShellGameSerializedShell>}
             */
            let shell_lookup = {};

            for(let shell_name in game.shell_lib) {
                if (!game.shell_lib.hasOwnProperty(shell_name)) {
                    continue;
                }
                let shell = game.shell_lib[shell_name];
                shell_lookup[shell.shell_name] = shell;
            }

            let shell_list = [];
            for(let shell_name in game.shell_lib) {
                if (!game.shell_lib.hasOwnProperty(shell_name)) {continue;}
                let shell = game.shell_lib[shell_name];
                let par_name = shell.shell_parent_name;
                let node = {shell_name: shell.shell_name, parents: [],shell_guid: shell.guid};
                while(par_name) {
                    node.parents.push(par_name);
                    let my_par = shell_lookup[par_name];
                    par_name = my_par.shell_parent_name;
                }
                shell_list.push(node);
            }

            for(let i = 0; i < shell_list.length; i++) {
                let thing = shell_list[i];
                let parent_list;
                if (thing.parents.length > 1) {
                    parent_list =  thing.parents.join('->');
                } else if (thing.parents.length === 1) {
                    parent_list = ' -> ' + thing.parents[0];
                } else {
                    continue;
                }
                regular_select_element.append($('<option>', {
                        value: thing.shell_guid,
                        text: `${thing.shell_name} ${parent_list}`
                    })
                );
            }
        }
    ));


    $('button#shell-game-add').click(function() {
        let shell_guid = regular_select_element.val();
        if (!shell_guid) {return;}
        try {
            shell_game_thing.add_shell(shell_guid);
            shell_game_thing.refresh();

        } catch (e) {
            console.error(e);
            do_toast({title:'Error',subtitle:e.name,content: e.message,delay:0,type:'error'});
        }
    });


});