
let shell_game_tokenfield;
let select_for_master_shells = null;
let select_for_master_shells_data = [];



jQuery(function($){

    init_shell_game_gui($)
    init_event_handlers();

    let sel = $('select#shell-game-master-list');

    shell_game_thing = new ShellGameKeeper();


    //add a one time start up message
    shell_game_thing.add_event(new ShellGameEventHook(
        'on_pre',
        null,
        function (hook) {
            let message = 'Copywrite Will Woodlief';
            shell_game_thing.add_top_key('start_up',message,false);
            hook.remove_self();
        }
    ));


    //add a timestamp
    shell_game_thing.add_event(new ShellGameEventHook(
        'on_pre',
        null,
        function (/*hook*/) {
            //let out = hook.current_value;
            shell_game_thing.add_top_key('touch',{ when: Date.now(), rand : Math.random()},false);
        }
    ));

    //synchronize yaml editor after refresh
    shell_game_thing.add_event(new ShellGameEventHook(
        'on_refresh',
        null,
        function (hook) {
            let out = hook.current_value;
            shell_game_set_editor_value_from_object(out);
        }
    ));

    //synchronize yaml editor after load
    shell_game_thing.add_event(new ShellGameEventHook(
       'on_load',
       null,
       function (hook) {
           let game = hook.keeper.serialized_game;
           console.log('game',game);
           do_toast({title:'Loaded',subtitle:'(its done already)',content: "Read in and then Replaced the YAML", delay:2000,type:'warning'});
       }
    ));

    //synchronize yaml editor after step
    shell_game_thing.add_event(new ShellGameEventHook(
        'on_step',
        null,
        function (hook) {
            let game = hook.keeper.serialized_game;
            console.log('game',game);
            do_toast({title:'Stepped!',subtitle:'Here we go',delay:1000,type:'success'});
        }
    ));


    //update tags display in gui
    shell_game_thing.add_event(new ShellGameEventHook(
        'on_change_input_key',
        null,
        function (hook) {
            let tags = hook.current_value;

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
    ));


    //fill in shell list
    shell_game_thing.add_event(new ShellGameEventHook(
        'on_load',
        null,
        function (hook) {
            let game = hook.keeper.serialized_game;


            sel.html('');
            sel.append($('<option>', {
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
                sel.append($('<option>', {
                        value: thing.shell_guid,
                        text: `${thing.shell_name} ${parent_list}`
                    })
                );
            }
        }
    ));






    function init_event_handlers() {
        $("#shell-game-load").click(function() {

           try {

               let raw = shell_game_get_object_from_editor_value();
               shell_game_thing.load(raw);

           } catch (e) {
               console.error(e);
               do_toast({title:'Error',subtitle:e.name,content: e.message,delay:0,type:'error'});
           }
        });

        $("#shell-game-step").click(function() {

            try {
                shell_game_thing.step();

            } catch (e) {
                console.error(e);
                do_toast({title:'Error',subtitle:e.name,content: e.message,delay:10000,type:'error'});
            }
        });

        $('button#shell-game-add').click(function() {
            let shell_guid = sel.val();
            if (!shell_guid) {return;}
            try {
                shell_game_thing.add_shell(shell_guid);

            } catch (e) {
                console.error(e);
                do_toast({title:'Error',subtitle:e.name,content: e.message,delay:0,type:'error'});
            }
        });



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


