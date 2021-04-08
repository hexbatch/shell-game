jQuery(function($){

    $("#shell-game-load").click(function() {

       load_from_yaml();
    });

    //synchronize yaml editor after load
    shell_game_thing.add_event(new ShellGameEventHook(
        'on_load',
        null,
        function (hook) {
            let game = hook.keeper.serialized_game;
            console.log('game',game);
            do_toast({title:'Loaded',subtitle:'(its done already)',content: "Loaded YAML", delay:2000,type:'success'});
        }
    ));

});

function load_from_yaml() {
    try {

        let raw = shell_game_get_object_from_editor_value();
        shell_game_thing.load(raw);

    } catch (e) {
        console.error(e);
        do_toast({title:'Error',subtitle:e.name,content: e.message,delay:0,type:'error'});
    }
}