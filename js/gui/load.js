jQuery(function($){

    $("#shell-game-load").click(function() {

       load_from_yaml();
    });

    //synchronize yaml editor after load
    shell_game_thing.add_event(new ShellGameEventHook(
        'on_load',
        null,
        function (/*hook*/) {
        //    let game = hook.keeper.serialized_game;
        //    console.log('game',game);
            do_toast({title:'Loaded',subtitle:'(its done already)',content: "Loaded YAML", delay:2000,type:'success'});
        }
    ));

});

function load_from_yaml() {
    try {
        let blank = `
        game:
  element_lib:
    blank:
      element_name: blank
      element_variables: {}
      element_gloms: { }
      element_script: null
  shell_lib:
    main:
      shell_name: main
      shell_parent_name: null
      elements:
        - element_name: blank
          element_init: new
          element_end: void
  running_shells:
    main:
      - shell_elements:
          blank:
            variables: {}
            gloms: {}
        shell_children: {}


        `;
        blank = blank.trim();

        let raw = shell_game_get_object_from_editor_value(blank);

        shell_game_thing.load(raw);

    } catch (e) {
        console.error(e);
        do_toast({title:'Error',subtitle:e.name,content: e.message,delay:0,type:'error'});
    }
}