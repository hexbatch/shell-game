

/**
 * @var {ShellGameRun}
 */
let run;

$(function($){

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
                parent_list = ' . ';
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
            run.add_active_shell(shell_name);
        })
    }


    function init_event_handlers() {
        $("#shell-game-start").click(function() {
            do_toast({title:'Staring',subtitle:'Oh Boy!',content: "initializing vars, clearing out gloms", delay:2000,type:'warning'});

           try {
               let raw = shell_game_get_object_from_editor_value();
               if (!('game' in raw)) {
                   // noinspection ExceptionCaughtLocallyJS
                   throw new ShellGameRunError("yaml does not have a game member");
               }
               run = new ShellGameRun(raw.game);
               run.init();
               console.log('run', run);
               let da_export = run.export_as_object()
               shell_game_set_editor_value_from_object(da_export,'game');
               do_test_shell_list();
           } catch (e) {
               console.error(e);
               do_toast({title:'Error',subtitle:e.name,content: e.message,delay:0,type:'error'});
           }
        });

        $("#shell-game-step").click(function() {
            do_toast({title:'Running!',subtitle:'Here we go',delay:1000,type:'success'});
            try {
                run.glom();
                run.step();
                shell_game_set_editor_value_from_object(run.export_as_object(),'game');
            } catch (e) {
                console.error(e);
                do_toast({title:'Error',subtitle:e.name,content: e.message,delay:0,type:'error'});
            }
        });
    }


});
