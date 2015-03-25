ccNetViz.layout.heirarchical = function(nodes, edges) {
    this.apply = function() {
		    var roots=[];
		    var orphans=[];

		   	//calculate indegree and outdegree;
		   	//insert target nodes in the nodes;
		   	//indegree start from 0 and iterate +1 ; if node found mindepth==indegree.
		   	//Allocate roots.Remove nodes from unhandled nodes.
		   	//initialise the layer
		   	//for each root; find the children. using its target.
		   	//push the children in a new layer
		   	//start ploting



		   	//calculating indegree, outdegree and target nodes


		   	for (var i = 0; i < edges.length; i++) {
		   		var ini = 0;
		   		var out = 0;
		   		ini = edges[i].target.id;
		   		out=edges[i].source.id;

		   		ini=parseInt(ini);
		   		nodes[ini].indegree++;
		   		nodes[out].targetNodes.push(nodes[ini]);
		   		
		   		
		   		out=parseInt(out);
		   		nodes[out].outdegree++;
		   	};

		   	//find the roots
		   	console.log(roots);

		   	mindepth=nodes[0].indegree;
		   	for (var i = 1; i < nodes.length; i++) {
		   		if(nodes[i].indegree===0 && nodes[i].outdegree > 0){
		   			roots.push(nodes[i])
		   		}
		   		if(nodes[i].indegree===0 && nodes[i].outdegree === 0){
		   			orphans.push(nodes[i])
		   		}
		   	};

		   	console.log(orphans);


		   	//calculate layers

		   	layers=[];
		   	handledNodes=[];
		   	for (var i = 0; i < roots.length; i++) {
		   		handledNodes.push(roots[i].id);
		   	};

		   	console.log(handledNodes);

		   	layers.push(roots);
		   	currentLayer=[];
		   	length=nodes.length-10;
		   	j=0;
		   	iter=0;
		   	console.log(layers);
		   	t=1;
		   	while(2){
		   		currentLayer=layers[j];
		   		newLayer=[];
		   		for (var i = 0; i < currentLayer.length; i++) {
		   			k=currentLayer[i].targetNodes;
		   			for (var p = 0; p < k.length; p++) {
		   				a=k[p].id;
		   				if(handledNodes.indexOf(a) === -1){
		   					handledNodes.push(a);
		   					b=nodes[a];
		   					console.log(b);
		   					newLayer.push(b);
		   				}
		   			};
		   			console.log(handledNodes.length);
		   			if(handledNodes.length===length){break;}
		   			console.log(newLayer);
		   		};
		   		console.log('ho');
		   		if(handledNodes.length===length){break;}
		   		layers.push(newLayer);
		   		j++;
		   	}

		   	//plot the points

		   	console.log(layers);


		   	y=1;
		   	dely=1/(layers.length-1);

		   	for (var i = 0, n = layers.length; i < n; i++) {
		   		delx=1/(layers[i].length + 2);
		   		x=0;
	            for (var j = 0; j < layers[i].length; j++) {
	            	x+=delx;
	            	var o = layers[i][j];
	            	o.x = x;
	            	o.y = y;
	            };
	            y-=dely;
	        }
	        c=handledNodes.sort()
	        console.log(c);
	        console.log(handledNodes.length);
    }
}

