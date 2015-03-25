
ccNetViz.layout.tree = function(nodes, edges) {
    this.apply = function() {

    	var g = new dagre.graphlib.Graph();
    	g.setGraph({});
    	g.setDefaultEdgeLabel(function() { return {}; });
    	for (var i = 0; i < nodes.length; i++) {
    		g.setNode(i, { label: i,  width: 1, height: 1});
    	};
    	for (var i = 0; i < edges.length; i++) {
    		g.setEdge(edges[i].source, edges[i].target);
    	};
    	console.log(g);
    	dagre.layout(g);

    	for (var i = 0, n = nodes.length; i < n; i++) {
            var o = nodes[i];
            o.x = g._nodes[i].x/1200;
            o.y = g._nodes[i].y/10;
            console.log(o.x, o.y);
        }
    }
}
