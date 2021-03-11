

/**
 * @var {ShellGameRun}
 */
let run;

$(function($){

    init_event_handlers();
    shell_game_editor_init($);


    function init_event_handlers() {
        $("#shell-game-start").click(function() {
            do_toast({title:'Started!',subtitle:'Oh Boy!',delay:2000,type:'warning'});

           try {
               let raw = shell_game_get_object_from_editor_value();
               run = new ShellGameRun(raw);
               console.log('run', run);
           } catch (e) {
               console.error(e);
               do_toast({title:'Error',subtitle:e.name,content: e.message,delay:0,type:'error'});
           }
        });

        $("#shell-game-step").click(function() {
            do_toast({title:'Running!',subtitle:'Here we go',delay:1000,type:'success'});
            try {
                let next_thing = run.step();
                shell_game_set_editor_value_from_object(next_thing,'elements');
            } catch (e) {
                console.error(e);
                do_toast({title:'Error',subtitle:e.name,content: e.message,delay:0,type:'error'});
            }
        });
    }


});
