
let shell_game_tokenfield;

let select_elements = null;
let element_data = [];

/**
 * @var {ShellGameRun}
 */
let run;

$(function($){

    setup_select2($)
    init_event_handlers();
    shell_game_editor_init($);

    function do_test_shell_list() {
        let sel = $('select#shell-game-master-list');
        sel.html('');
        sel.append($('<option>', {
                value: null,
                text: '(choose)'
            })
        );
        let shell_list = run.shell_lib.export_lib_as_parent_list();
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
            sel.append($('<option>', {
                    value: thing.shell_name,
                    text: `${thing.shell_name} ${parent_list}`
                })
            );
        }

        $('button#shell-game-add').click(function() {
            let shell_name = sel.val();
            if (!shell_name) {return;}
            try {
                run.add_active_shell(shell_name);
                shell_game_set_editor_value_from_object(run.export_as_object(), 'game');
            } catch (e) {
                console.error(e);
                do_toast({title:'Error',subtitle:e.name,content: e.message,delay:0,type:'error'});
            }
        });


    }


    function init_event_handlers() {
        $("#shell-game-start").click(function() {


           try {
               let raw = shell_game_get_object_from_editor_value();
               if (!('game' in raw)) {
                   // noinspection ExceptionCaughtLocallyJS
                   throw new ShellGameRunError("yaml does not have a game member");
               }

               if ('tags' in raw) {
                   if (_.isArray(raw.tags) && on_tags) {
                       on_tags(raw.tags);
                   }
               }

               run = new ShellGameRun(raw.game);
               console.debug('run', run);
               let da_export = run.export_as_object()
               shell_game_set_editor_value_from_object(da_export,'game');
               do_toast({title:'Checked',subtitle:'(its done already)',content: "Read in and then Replaced the YAML", delay:2000,type:'warning'});
               do_test_shell_list();
           } catch (e) {
               console.error(e);
               do_toast({title:'Error',subtitle:e.name,content: e.message,delay:0,type:'error'});
           }
        });

        $("#shell-game-step").click(function() {

            try {
                if (!run) {
                    // noinspection ExceptionCaughtLocallyJS
                    throw new ShellGameRunError("Please Load From Yaml First");
                }
                run.glom();
                run.step();
                shell_game_set_editor_value_from_object(run.export_as_object(),'game');
                do_toast({title:'Stepped!',subtitle:'Here we go',delay:1000,type:'success'});
            } catch (e) {
                console.error(e);
                do_toast({title:'Error',subtitle:e.name,content: e.message,delay:10000,type:'error'});
            }
        });

        /**
         * @param {string[]} tags
         */
        function on_tags(tags) {
            let my_tag_array = [];
            for(let i = 0; i < tags.length; i++) {
                let node = {
                  id: i,
                  name: tags[i],
                  custom: null
                };
                my_tag_array.push(node);
            }
            shell_game_tokenfield.setItems(my_tag_array);
        }

        shell_game_tokenfield = new Tokenfield({
            el: document.querySelector('.shell-game-text-tagger'),
            newItems: true,
            multiple: true,
            filterSetItems: false,
            delimiters: [',',';',' '],
            placeholder: 'Enter Tags',
            addItemOnBlur: true
        });


        shell_game_tokenfield.on('addedToken' ,(a/*,token_info*/) => {
            let items = a.getItems();
            let tag_name_array = [];
            for(let i = 0; i < items.length; i++) {
                tag_name_array.push(items[i].name);
            }
            shell_game_set_editor_value_from_object(tag_name_array,'tags');
            console.log(tag_name_array);
        });




        shell_game_tokenfield.on("removedToken", (a/*,token_info*/) => {
            let items = a.getItems();
            let tag_name_array = [];
            for(let i = 0; i < items.length; i++) {
                tag_name_array.push(items[i].name);
            }
            shell_game_set_editor_value_from_object(tag_name_array,'tags');
            console.log(tag_name_array);
        });


    }


});

function setup_select2($) {
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

    let regular_select_element = $('select#shell-game-element-list');

    let customAdapter = $.fn.select2.amd.require('select2/data/customAdapter');


    select_elements = regular_select_element.select2({
        dataAdapter: customAdapter,
        data: element_data,
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

    element_data.push({id:-1,text:" ",notes:"blank line"});
    element_data.push({id:1,text:"dummy element",upper:false});
    element_data.push({id:2,text:"dummy element 2",upper:false});

    select_elements.data('select2').dataAdapter.updateOptions(element_data);
}
