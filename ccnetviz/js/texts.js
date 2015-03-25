ccNetViz.texts = function(gl) {
    var size = 1024;

    var canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    canvas.style.width = canvas.style.height = size + 'px';
    canvas.style.display = "none";
    document.body.appendChild(canvas);

    var context = canvas.getContext('2d');
    context.fillStyle = "white";
    context.textAlign = "left";
    context.textBaseline = "top";

    var rendered, texts;
    var x, y, height;

    this.texture = gl.createTexture();

    this.clear = function()  {
        rendered = {};
        context.clearRect(0, 0, size, size);
        height = x = y = 0;
    };

    this.setFont = function(font)  {
        rendered[font] = texts = rendered[font] || {};
        context.font = font;
        x = 0;
        y += height;
        height = +/(\d+)px/.exec(font)[1] + 1;
    };

    this.get = function(text)  {
        var result = texts[text];
        if (!result) {
            var width = context.measureText(text).width;
            if (x + width > size) {
                x = 0;
                y += height;
            }
            context.fillText(text, x, y);
            texts[text] = result = {
                width: width,
                height: height,
                left: x / size,
                right: (x + width) / size,
                top: y / size,
                bottom: (y + height) / size
            };
            x += width;
        }
        return result;
    };

    this.bind = function()  {
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }.bind(this);
}