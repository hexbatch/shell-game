
jQuery(function (){

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
});