jQuery(function ($){
    $("#shell-game-step").click(function() {

        try {
            shell_game_thing.step();

        } catch (e) {
            console.error(e);
            do_toast({title:'Error',subtitle:e.name,content: e.message,delay:10000,type:'error'});
        }
    });

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

});