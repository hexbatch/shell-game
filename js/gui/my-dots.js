jQuery(function (){

    /**
     *
     * @type {ShellGameSerializedRunningShell}
     */
    let selected_shell = null;

    shell_game_thing.add_event(new ShellGameEventHook(
        'on_selected_running_shell',
        null,
        function (hook) {
             selected_shell = hook.keeper.selected_running_shell;
        })
    );


    /**
     *
     * @type {object} dot_viewer
     */
    let dot_viewer = null;

    /**
     * @type {Object}
     */
    let dot_nodes = null;




    //draw dots after each refresh
    shell_game_thing.add_event(new ShellGameEventHook(
        'on_refresh',
        null,
        function (hook) {
            try {
                let game = hook.keeper.serialized_game;
                let top_level_shell_names = Object.keys(game.running_shells);
                if (top_level_shell_names.length === 0) {
                    throw new Error("No main shell, cannot build dots");
                }
                let main_shell_name = top_level_shell_names[0];
                /**
                 *
                 * @type {ShellGameSerializedRunningShell}
                 */
                let main_shell = game.running_shells[main_shell_name][0];
                let da_dot_words = main_shell.to_dot(main_shell_name,1,selected_shell);



                /**
                 *
                 * @type {ShellGameSerializedRunningShellElement[]}
                 */
                let elements = [];

                /**
                 *
                 * @param {ShellGameSerializedRunningShell} running_shell
                 */
                function find_and_add_elements(running_shell) {
                    for(let element_name in running_shell.shell_elements) {
                        if (!running_shell.shell_elements.hasOwnProperty(element_name)) {continue;}
                        let el = running_shell.shell_elements[element_name];
                        elements.push(el);
                    }
                    for(let child_shell_name in running_shell.shell_children) {
                        if (!running_shell.shell_children.hasOwnProperty(child_shell_name)) {continue;}
                        let child_array_of_shells = running_shell.shell_children[child_shell_name];
                        for(let child_shell_index = 0; child_shell_index < child_array_of_shells.length; child_shell_index++) {
                            let child_shell = child_array_of_shells[child_shell_index];
                            find_and_add_elements(child_shell);
                        }
                    }
                }

                find_and_add_elements(main_shell);

                /**
                 *
                 * @type {string[]}
                 */
                let da_connects_array = [];
                //"b-good-37b51e83-ca21-4819-adf1-f46ab49fbb67":"element-master-37b51e83-ca21-4819-adf1-f46ab49fbb67" -> Christmas:howdy [label=special];
                //"start-element-guid":"glom_name" -> "end-element-guid":"glom_target"

                for(let el_index =0 ; el_index < elements.length; el_index++) {
                    let el = elements[el_index];
                    let what = shell_game_thing.get_glom_targets(el.guid,null);
                    for(let i  = 0; i < what.length; i++) {
                        let hm = what[i];
                        let glom_name = hm.glom_reference_name;
                        let glom_target = hm.variable_target_name;
                        let starting_element = hm.starting_running_element;
                        let target_element = hm.target_running_element;
                        let connect = `"${starting_element.guid}":"${glom_name}" -> "${target_element.guid}":"${glom_target}"`;
                        da_connects_array.push(connect);
                    } //each live target
                } //each element

                let da_connects = da_connects_array.join("\t\n");


                //figure out the colors
                let colors_to_map_for_shells = {};
                let colors_to_map_for_elements = {};
                if ('colors' in shell_game_thing.last_raw) {
                    for(let target_guid in  hook.keeper.last_raw.colors ) {
                        if (!hook.keeper.last_raw.colors.hasOwnProperty(target_guid)) { continue;}
                        let da_shell = hook.keeper.get_shell_or_null_by_guid(target_guid);
                        if (da_shell) {
                            let da_color = hook.keeper.last_raw.colors[target_guid];
                            let da_key = `[[${da_shell.shell_name}::shell-color]]`;
                            colors_to_map_for_shells[da_key] = da_color;
                        }

                        let da_element = hook.keeper.get_element_or_null_by_guid(target_guid);
                        if (da_element) {
                            let da_color = hook.keeper.last_raw.colors[target_guid];
                            let da_key = `[[${da_element.element_name}::element-color]]`;
                            colors_to_map_for_elements[da_key] = da_color;
                        }
                    }
                }

                for(let element_color_key in colors_to_map_for_elements) {
                    if (!colors_to_map_for_elements.hasOwnProperty(element_color_key)) {continue;}
                    da_dot_words = da_dot_words.replaceAll(element_color_key,colors_to_map_for_elements[element_color_key]);
                }

                for(let shell_color_key in colors_to_map_for_shells) {
                    if (!colors_to_map_for_shells.hasOwnProperty(shell_color_key)) {continue;}
                    da_dot_words = da_dot_words.replaceAll(shell_color_key,colors_to_map_for_shells[shell_color_key]);
                }

                //remove leftover colors that were not defined
                let regex_shell_colors = /\[\[\w+::shell-color]]/g;
                da_dot_words = da_dot_words.replaceAll(regex_shell_colors,DEFAULT_SHELL_COLOR);

                let regex_element_colors = /\[\[\w+::element-color]]/g;
                da_dot_words = da_dot_words.replaceAll(regex_element_colors,DEFAULT_ELEMENT_COLOR);
                let all_dots = `digraph G {\n` +
                     `\tgraph [fontsize=10 fontname="Verdana" compound=true];\n` +
                     `\tnode [shape=record fontsize=10 fontname="Verdana"];\n` +
                     `\t${da_dot_words}\n` +
                     `\t${da_connects}\n` +
                     `}`
               // console.debug(all_dots);

                if (dot_viewer) {
                 //   dot_viewer.destroy();
                    if (! _.isEmpty(dot_nodes)) {
                        dot_nodes.on("click", null);
                        dot_nodes.on("dblclick", null);
                    }


                }
                dot_viewer = d3.select("#graph").graphviz({
                    fit: true
                }).renderDot( all_dots,() => {
                    dot_nodes = d3.selectAll(".node");

                    dot_nodes.on("click", my_node_click_handler);

                });


                function my_node_click_handler() {
                    let event = d3.event;
                    event.preventDefault();

                    let running_element_guid = jQuery(this).find('title').text().replace(/\u00A0/g, ' ');


                    /**
                     *
                     * @param {ShellGameSerializedRunningShell} running_shell
                     * @return {ShellGameSerializedRunningShell}
                     */
                    function find_parent_shell(running_shell) {
                        for(let element_name in running_shell.shell_elements) {
                            if (!running_shell.shell_elements.hasOwnProperty(element_name)) {continue;}
                            let el = running_shell.shell_elements[element_name];
                            if (el.guid === running_element_guid) {
                                return running_shell;
                            }
                        }

                        for(let child_shell_name in running_shell.shell_children) {
                            if (!running_shell.shell_children.hasOwnProperty(child_shell_name)) {continue;}
                            let child_array_of_shells = running_shell.shell_children[child_shell_name];
                            for(let child_shell_index = 0; child_shell_index < child_array_of_shells.length; child_shell_index++) {
                                let child_shell = child_array_of_shells[child_shell_index];
                                let what =  find_parent_shell(child_shell);
                                if (what) {return what;}
                            }
                        }
                        return null;
                    }

                    if (running_element_guid) {
                        let parent_shell = find_parent_shell(main_shell);
                        if (parent_shell && hook.keeper.selected_running_shell && parent_shell.guid === hook.keeper.selected_running_shell.guid) {
                            hook.keeper.refresh(null);
                        } else {
                            hook.keeper.refresh(parent_shell);
                        }

                    }


                }





            } catch (e) {
                console.error(e);
                do_toast({title:'Error',subtitle:e.name,content: e.message,delay:10000,type:'error'});
            }
        }
    ));

});

