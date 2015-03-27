var Y=X=pageX=pageY=difY=difX=0;

function getCoordinates(event) {

	var canvas = document.getElementById('br');
	var width = canvas.width;
	var height = canvas.height;

	if (event.pageX) {

		pageX = event.pageX;
		pageY = event.pageY;

		difX=pageX-X;
		difY=pageY-Y;


		x=difX/width;
		y=1-difY/height;

		console.log(x+" "+y);

		a=ccNetViz.quadtree(graphs[0].nodes,graphs[0].edges);
		console.log(a.find(x,y));
	}
}