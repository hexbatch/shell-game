class FlowDot {

    /**
     *
     * @type {object} dot_viewer
     */
    static dot_viewer = null;


    /**
     *
     * @param {SymFlow} flow
     * @return {string}
     */
    static convert_to_dot(flow) {
        /*
        `digraph  {
     node [style="filled"]
     a [fillcolor="yellow" shape="star"]
     b [fillcolor="yellow" shape="star"]
     c [fillcolor="yellow" shape="star"]
     a -> b
     a -> c
     b -> c
   }`,
         */

       let  ret = '';
       ret += `digraph  {`;
       ret += `\nlabel = "${flow.flow_name}"`;
        ret += `\nrankdir=LR;`;
       ret += `\nnode [style="filled"]`;


       let trans = []; //holds the edges
        let init = []; //holds the names of the initial

        /**
         *
         * @type {SymState[]}
         */
        let ut = [];

        /**
         *
         * @type {SymState[]}
         */
        let ut_destinations = [];


       //put in each of the states as found in the array
        for(let i = 0; i < flow.states.length; i++) {
            let state = flow.states[i];
            let name = state.state_name.replace('"','&quot;');
            if (state.state_type === 'initial') { init.push(`"${name}"`);}
            if (state.state_type === 'initial' || state.state_type === 'normal') {
                ut_destinations.push(state);
            }
            let display = FlowState.get_state_display_properties(state,state.da_flag);
            if (display.type_name === 'ut') { ut.push(state);}
            let shape = display.shape;
            let color = display.color;
            let font_color = display.font_color;

            let frame_color = display.border_color;
            let frame_width = display.border_width;
            ret += `\n "${name}" [fillcolor="${color}" fontcolor="${font_color}" color="${frame_color}" penwidth=${frame_width} shape="${shape}" ]`;
            for (let j = 0; j < state.transitions.length; j++) {
                let rabbit = state.transitions[j];
                if (rabbit.state_to_transition_id) {
                    if (FlowState.state_grid_lookup.hasOwnProperty(rabbit.state_to_transition_id)) {
                        let trans_state = FlowState.state_grid_lookup[rabbit.state_to_transition_id];
                        let trans_name = trans_state.state_name.replace('"','&quot;');
                        let props = FlowDot.get_edge_display_properties(state,trans_state);
                        let thing =  `"${name}" -> "${trans_name}" [ color="${props.color}" penwidth="${props.width}" style="${props.style}"]`;
                        trans.push(thing);
                    }

                }
            }
        }

        //go through each transition
        for(let i = 0; i < trans.length; i++) {
            ret += `\n ${trans[i]}`;
        }

        let ut_names = [];
        //add the ut stuff to the
        for(let i = 0; i < ut.length; i++) {
            let source = ut[i];
            let source_name = source.state_name.replace('"','&quot;');
            ut_names.push(`"${source_name}"`);
            for(let k = 0; k < ut_destinations.length; k++) {
                let destination = ut_destinations[k];
                let destination_name = destination.state_name.replace('"','&quot;');
                let props = FlowDot.get_edge_display_properties(source,destination);
                ret += `"${destination_name}" -> "${source_name}" [ color="${props.color}" penwidth="${props.width}" style="${props.style}"]`;
            }
        }

        //{ rank=same; b, c, d }
        if (init.length) {
            ret += `\n{ rank=same; ${init.join(', ')} }`;
        }

        if (ut_names.length) {
            ret += `\n{ rank=same; ${ut_names.join(', ')} }`;
        }

        ret += `\n}`

        return ret;

    }

    /**
     *
     * @type {Object}
     */
    static nodes = null;

    /**
     *
     * @type {Object}
     */
    static edges = null;
    /**
     *
     * @param {SymFlow} flow
     */
    static render_dot(flow) {

        let dot = FlowDot.convert_to_dot(flow);

        let selectedEdge ;
        let selectedEdgeFill;
        let selectedEdgeStroke;

        function my_node_click_handler() {
            var event = d3.event;
            event.preventDefault();
            unSelectEdge();
            let title = jQuery(this).find('title').text().replace(/\u00A0/g, ' ');
            if (title) {
                let state = FlowState.get_state_from_name(title);
                FlowState.set_state(state,true,true);
            }
        }

        function my_node_double_click_handler() {
            var event = d3.event;
            event.preventDefault();
            event.stopPropagation();
            unSelectEdge();
            let title = jQuery(this).find('title').text().replace(/\u00A0/g, ' ');
            if (title) {
                let state = FlowState.get_state_from_name(title);
                FlowState.show_new_edit_dialog(state);
            }
        }

        function my_edge_click_handler() {
            var event = d3.event;
            event.preventDefault();
            event.stopPropagation();
            selectEdge(d3.select(this));
            let title = jQuery(this).find('title').text().replace(/\u00A0/g, ' ');
            if (title) {
                let state_names = title.split('->');
                if (state_names.length === 2) {
                    let source = state_names[0];
                    let destination = state_names[1];
                    let see = FlowSee.get_see_from_names(source,destination);
                    let source_state = FlowState.get_state_from_name(source);
                    FlowState.set_state(source_state,true,true);
                    FlowSee.set_see(see,true);
                }
            }
        }

        function my_edge_double_click_handler() {
            var event = d3.event;
            event.preventDefault();
            event.stopPropagation();
            let title = jQuery(this).find('title').text().replace(/\u00A0/g, ' ');
            if (title) {
                let state_names = title.split('->');
                if (state_names.length === 2) {
                    let source = state_names[0];
                    let destination = state_names[1];
                    let see = FlowSee.get_see_from_names(source,destination);
                    let source_state = FlowState.get_state_from_name(source);
                    FlowState.set_state(source_state,true,true);
                    FlowSee.show_new_edit_dialog(see);
                }
            }
        }

        function selectEdge(edge) {
            unSelectEdge();
            selectedEdge = edge;
            selectedEdgeFill = selectedEdge.selectAll('polygon').attr("fill");
            selectedEdgeStroke = selectedEdge.selectAll('polygon').attr("stroke");
            selectedEdge.selectAll('path, polygon').attr("stroke", "red");
            selectedEdge.selectAll('polygon').attr("fill", "red");
        }

        function unSelectEdge() {
            selectedEdge.selectAll('path, polygon').attr("stroke", selectedEdgeStroke);
            selectedEdge.selectAll('polygon').attr("fill", selectedEdgeFill);
            selectedEdge = d3.select(null);
        }


        if (FlowDot.dot_viewer) {
            FlowDot.dot_viewer.destroy();
            if (! _.isEmpty(FlowDot.nodes)) {
                FlowDot.nodes.on("click mousedown", null);
                FlowDot.nodes.on("dblclick", null);
            }
            if (! _.isEmpty(FlowDot.edges)) {
                FlowDot.edges.on("click mousedown", null);
                FlowDot.edges.on("dblclick", null);
            }

        }


        FlowDot.dot_viewer = d3.select("div.f-dot-area").graphviz().renderDot(dot,() => {
            FlowDot.nodes = d3.selectAll(".node");
            FlowDot.edges = d3.selectAll(".edge");
            selectedEdge = d3.select(null);

            FlowDot.nodes.on("click mousedown", my_node_click_handler);
            FlowDot.nodes.on("dblclick", my_node_double_click_handler);
            FlowDot.edges.on("click mousedown", my_edge_click_handler);
            FlowDot.edges.on("dblclick", my_edge_double_click_handler);


        }).zoom(false);
    }

    /**
     *
     * @param {SymState} state_from
     * @param {SymState} state_to
     * @return {EdgeDisplayProperty}
     */
    static get_edge_display_properties(state_from,state_to) {
        let from_type = FlowState.get_state_display_properties(state_from).type_name;
        let to_type = FlowState.get_state_display_properties(state_to).type_name;
        /**
         * @var {EdgeDisplayProperty} ret
         */
        let ret;

        ret = {color: 'pink',width: '1.0', style: 'solid'};

        switch(from_type) {

            case 'initial' : {
                switch (to_type) {
                    case 'normal': {
                        ret =  {color: 'green', width: '1.0', style: 'solid'};
                        break;
                    }
                    case 'final' : {
                        ret = {color: 'darkred',width: '1.0', style: 'solid'}
                        break;
                    }
                }
                break;
            }
            case 'normal' : {
                switch (to_type) {
                    case 'normal': {
                        ret = {color: 'blue',width: '1.0', style: 'solid'}
                        break;
                    }
                    case 'final' : {
                        ret = {color: 'darkred',width: '1.0', style: 'solid'}
                        break;
                    }
                }
                break;
            }
            case 'ut': {
                switch (to_type) {
                    case 'initial': {
                        ret = {color: 'gainsboro',width: '0.5', style: 'dashed'}
                        break;
                    }

                    case 'normal': {
                        ret = {color: 'gainsboro',width: '0.5', style: 'dashed'}
                        break;
                    }
                }
                break;
            }
        }
        if (state_to.da_flag === 'selected') {
            if (state_from.da_flag === 'previous') {
                let width = parseFloat(ret.width.toString());
                width *=2;
                ret.width = width.toString();
                ret.style = 'bold';
            }

        }

        return ret;
    }
}