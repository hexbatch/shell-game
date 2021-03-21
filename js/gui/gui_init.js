

function init_shell_game_gui($) {

    setup_select2($);
    shell_game_editor_init($);



    function setup_select2($) {
        $.fn.select2.amd.define('select2/data/customAdapter', ['select2/data/array', 'select2/utils'],
            function (ArrayAdapter, Utils) {
                function CustomDataAdapter($element, options) {
                    CustomDataAdapter.__super__.constructor.call(this, $element, options);
                }

                Utils.Extend(CustomDataAdapter, ArrayAdapter);
                CustomDataAdapter.prototype.updateOptions = function (data) {
                    this.$element.find('option').remove();
                    this.addOptions(this.convertToOptions(data));
                }
                return CustomDataAdapter;
            }
        );

        let regular_select_element = $('select#shell-game-element-list');

        let customAdapter = $.fn.select2.amd.require('select2/data/customAdapter');


        select_for_master_shells = regular_select_element.select2({
            dataAdapter: customAdapter,
            data: select_for_master_shells_data,
            placeholder: {
                id: '-1', // the value of the option
                text: 'Select an Element'
            },
            containerCssClass: ''
        });

        regular_select_element.on('select2:select', function (e) {
            let data = e.params.data;
            console.log('selected',data);
        });


        select_for_master_shells.data('select2').dataAdapter.updateOptions(select_for_master_shells_data);
    }
}