ccNetViz.layout.grid = function(nodes,edges) {
    this.apply = function() {
       	cols=Math.floor(Math.sqrt(nodes.length));
        rows=Math.floor(nodes.length/cols)+1;
        
        y=0.99;
        delta=0.99/rows;

        var i = 0;
        var nodNo=0
        while(i < rows) {
            x=0.05
            for (var j = 1; j <= cols; j++) {
                if(nodNo===nodes.length){
                    return 0;
                }
                var o = nodes[nodNo];
                o.x = x;
                o.y= y;
                //console.log(nodNo,o.x,o.y);
                nodNo++;
                x+=delta;
            };
            y-=delta;
            i+=1;
        }
    }
}
