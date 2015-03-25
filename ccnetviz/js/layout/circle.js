ccNetViz.layout.circle = function(nodes,edges) {
    this.apply = function() {
      console.log(edges.length);
    	cx=0.5;
       	cy=0.5;
       	r=0.5;
       	theta=0;
       	delTheta=2* Math.PI / (nodes.length+1);
        for (var i = 0, n = nodes.length; i < n; i++) {

            var o = nodes[i];
            o.x = cx+ r*Math.cos(theta);
            o.y = cy+ r*Math.sin(theta);
            theta+= delTheta;
        }
    }
}