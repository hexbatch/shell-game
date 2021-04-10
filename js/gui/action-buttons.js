jQuery(function ($){
    $("#shell-game-step-action").click(function() {

        try {
            shell_game_thing.step();

        } catch (e) {
            console.error(e);
            do_toast({title:'Error Popped',subtitle:e.name,content: e.message,delay:10000,type:'error'});
        }
    });

    //synchronize yaml editor after step
    shell_game_thing.add_event(new ShellGameEventHook(
        'on_step',
        null,
        function (/*hook*/) {
            //let game = hook.keeper.serialized_game;
          //  console.log('game',game);
            do_toast({title:'Stepped!',subtitle:'Here we go',delay:1000,type:'success'});
        }
    ));


    $("#shell-game-pop-action").click(function() {

        try {
            if (shell_game_thing.selected_running_shell) {
                shell_game_thing.pop_shell(shell_game_thing.selected_running_shell.guid);
                do_toast({title:'Popped',subtitle:`shell ${shell_game_thing.selected_running_shell.guid} was poppled`,
                    delay:1000,type:'success'});
            }

        } catch (e) {
            console.error(e);
            do_toast({title:'Error Popping',subtitle:e.name,content: e.message,delay:10000,type:'error'});
        }
    });

    $("#shell-game-edit-running-element-action").click(function() {

        try {
            if (shell_game_thing.selected_running_element) {
                shell_game_edit_running_element(shell_game_thing.selected_running_element.guid)
            }

        } catch (e) {
            console.error(e);
            do_toast({title:'Error Editing Running Element',subtitle:e.name,content: e.message,delay:10000,type:'error'});
        }
    });


});