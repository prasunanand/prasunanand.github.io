function relMouseCoords(e){var x;
var y;
if (e.pageX || e.pageY) { 
  x = e.pageX;
  y = e.pageY;
}
else { 
  x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft; 
  y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop; 
} 
x -= gCanvasElement.offsetLeft;
y -= gCanvasElement.offsetTop;

console.log(x + " " + y) ;
}

relMouseCoords();