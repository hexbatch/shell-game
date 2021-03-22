let shell_game_tokenfield;

jQuery(function (){

    /**
     *
     * @param {string[]} tags
     */
    function on_tags_updated_callback(tags) {

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

    //update tags display in gui
    shell_game_thing.add_event(new ShellGameEventHook(
        'on_change_input_key',
        'tags',
        function (hook) {
            on_tags_updated_callback(hook.current_value);
        }
    ));

    shell_game_thing.add_event(new ShellGameEventHook(
        'on_load',
        null,
        function (hook) {
            if ('tags' in hook.keeper.last_raw) {
                let tags = hook.keeper.last_raw.tags;
                on_tags_updated_callback(tags);
            }

        }
    ));

    shell_game_tokenfield = new Tokenfield({
        el: document.querySelector('.shell-game-text-tagger'),
        newItems: true,
        multiple: true,
        filterSetItems: false,
        delimiters: [',',';',' '],
        placeholder: 'Enter Tags',
        addItemOnBlur: true
    });

    function on_tag_editor_change(a) {
        let items = a.getItems();
        let tag_name_array = [];
        for(let i = 0; i < items.length; i++) {
            tag_name_array.push(items[i].name);
        }

        shell_game_thing.add_top_key('tags',tag_name_array,true);

    }


    shell_game_tokenfield.on('addedToken' ,(a/*,token_info*/) => {
       on_tag_editor_change(a);
    });




    shell_game_tokenfield.on("removedToken", (a/*,token_info*/) => {
       on_tag_editor_change(a);
    });
});