ccNetViz.layout.circularHeirarchical = function(nodes, edges) {
    this.apply = function() {
		    var roots=[];

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
		   	};

		   	for (var i = 1; i < nodes.length; i++) {
		   		if(nodes[i].indegree===0 && nodes[i].outdegree === 0){
		   			orphans.push(nodes[i])
		   		}
		   	};

		   	console.log(roots);


		   	//calculate layers

		   	layers=[];
		   	layers.push(roots);
		   	currentLayer=[];
		   	length=nodes.length;
		   	j=0;
		   	iter=0;
		   	console.log(layers);
		   	while(iter<length){
		   		currentLayer=layers[j];
		   		newLayer=[];
		   		for (var i = 0; i < currentLayer.length; i++) {
		   			console.log(currentLayer);
		   			k=currentLayer[i].targetNodes;
		   			console.log("k.length:"+k.length);
		   			for (var p = 0; p < k.length; p++) {
		   				console.log(k[p].id);
		   				console.log(nodes[k[p].id]);
		   				newLayer.push(nodes[k[p].id]);
		   				iter++;
		   				if(iter>=length){
		   					break;
		   				}
		   			};
		   			if(iter>=length){
		   					break;
		   				}
		   		};
		   		layers.push(newLayer);
		   		if(iter>=length){
		   					break;
		   				}
		   		j++;
		   	}

		   	//plot the points

		   	console.log(layers);

		   	y=0.5;
		   	x=0.5;
		   	
		   	delRadius=0.5/(layers.length);
		   	radius=delRadius;
		   	n=layers[(layers.length-1)].length;
		   	deltheta=2*Math.PI/(n);


		   	for (var i = 0, n = layers.length; i < n; i++) {
		   		theta=0;
	            for (var j = 0; j < layers[i].length; j++) {
	            	var o = layers[i][j];
	            	o.x = x + radius*Math.cos(theta);
	            	o.y = y + radius*Math.sin(theta);;
	            	theta+=deltheta
	            };
	            radius+=delRadius;
	        }
    }
}

