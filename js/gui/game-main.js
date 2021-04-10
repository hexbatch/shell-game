
const DEFAULT_ELEMENT_COLOR = '#eeeeee';
const DEFAULT_SHELL_COLOR = '#99bdff'

jQuery(function(){

    shell_game_thing = new ShellGameKeeper();

    $('#shell-game-inspect-with').click(function() {
       let thing = $('#shell-game-inspect-box').val();
       let things = thing.split(/\s+/);
       let thing1 = things[0];
       let thing2 = null;
       if (things.length > 1) {thing2 = things[1];}
       let what = shell_game_thing.get_glom_targets(thing1,thing2);
        console.debug('inspected',thing1,thing2);
       for(let i  = 0; i < what.length; i++) {
           let hm = what[i];
           console.debug('Glom Ref Name',hm.glom_reference_name);
           console.debug('Variable Target Name',hm.variable_target_name);
           console.debug('Starting Shell',hm.starting_running_shell);
           console.debug('Starting Element',hm.starting_running_element);
           console.debug('Target Shell',hm.target_running_shell);
           console.debug('Target Element',hm.target_running_element);

       }

    });

    $.fn.select2.amd.define('select2/data/customAdapter', ['select2/data/array', 'select2/utils'],
        function (ArrayAdapter, Utils) {
            function CustomDataAdapter($element, options) {
                CustomDataAdapter.__super__.constructor.call(this, $element, options);
            }

            Utils.Extend(CustomDataAdapter, ArrayAdapter);
            CustomDataAdapter.prototype.updateOptions = function (data) {
                // noinspection JSUnresolvedVariable
                this.$element.find('option').remove();
                // noinspection JSUnresolvedFunction
                this.addOptions(this.convertToOptions(data));
            }
            return CustomDataAdapter;
        }
    );

    script_error_callback = function(what) {
        do_toast({title:'Element Script Error',subtitle:'',content: what,delay:10000,type:'warning'});
    }

});


