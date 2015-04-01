ccNetViz.quadtree = function(edges) {
    var d, xs, ys, i, n, x1_, y1_, x2_, y2_;

    console.log(edges);
    //range define

    x2_ = y2_ = -(x1_ = y1_ = Infinity);
    xs = [], ys = [];
    txs=[],tys=[];
    n = edges.length;

    //define range on the basis of coordinates

    for (i = 0; i < n; ++i) {
        d = edges[i].source;
        if (d.x < x1_) x1_ = d.x;
        if (d.y < y1_) y1_ = d.y;
        if (d.x > x2_) x2_ = d.x;
        if (d.y > y2_) y2_ = d.y;
        xs.push(d.x);
        ys.push(d.y);
    }
    for (i = 0; i < n; ++i) {
        d = edges[i].target;
        if (d.x < x1_) x1_ = d.x;
        if (d.y < y1_) y1_ = d.y;
        if (d.x > x2_) x2_ = d.x;
        if (d.y > y2_) y2_ = d.y;
        txs.push(d.x);
        tys.push(d.y);
    }
    //calculate distance between min and max for x and y

    var dx = x2_ - x1_;
    var dy = y2_ - y1_;

    //make a square

    dx > dy ? y2_ = y1_ + dx : x2_ = x1_ + dy;

    //create a leaf node

    function create() {
        return {
            leaf: true,
            nodes: [],
            points: [],
            sx: null,
            sy: null,
            tx: null,
            ty: null
        };
    }

    //check if node is there in the quadrant
    //take a square
    //along its diagonal lie (x1,y1) and (x2,y2)
    //find the center of diagonal (sx,sy)
    //now we have four squares
    //top-left top-right bottom-left bottom-right
    //node(parent) has nodes(children) array


    function visit(f, node, x1, y1, x2, y2) {
        if (!f(node, x1, y1, x2, y2)) {
            var sx = (x1 + x2) * 0.5;
            var sy = (y1 + y2) * 0.5;
            var children = node.nodes;

            if (children[0]) visit(f, children[0], x1, y1, sx, sy);
            if (children[1]) visit(f, children[1], sx, y1, x2, sy);
            if (children[2]) visit(f, children[2], x1, sy, sx, y2);
            if (children[3]) visit(f, children[3], sx, sy, x2, y2);
        }
    }

    //start inserting
    //if n is a leaf and not an internal node
    //get nx and ny
    //n is a set of edges

    function insert(n, d, sx, sy, tx, ty, x1, y1, x2, y2, p) {
        //its a leaf
        //n is the square area
        //d is the element to be put in the area
        if (n.leaf) {
            var nx = n.sx;
            var ny = n.sy;
            var ntx = 0;
            var nty = 0;
            //nx is null only in case of root(i think)
            if (nx !== null) {
                if (nx === sx && ny === sy) {
                    //nx equals x and ny equals y means that square boundary
                    insertChild(n, d, sx, sy, tx, ty, x1, y1, x2, y2,p);
                }
                else {
                    var nPoint = n.points;
                    n.sx = n.sy = n.point = null;
                    insertChild(n, nPoint, nx, ny, ntx, nty, x1, y1, x2, y2,p);
                    insertChild(n, d, sx, sy, tx, ty, x1, y1, x2, y2,p);
                }
            } else {
                //root case
                n.sx = sx, n.sy = sy, n.tx = tx, n.ty = ty, n.points.push(d);
            }
        } else {
        //its an iternal node
            insertChild(n, d, sx, sy, tx, ty, x1, y1, x2, y2,p);
        }
    }

    //start inserting children

    function insertChild(n, d, sx, sy, tx, ty, x1, y1, x2, y2,p) {
    //find the midpoint of diagonal
        n.points.push(d);
        var xm = (x1 + x2) * 0.5;
        var ym = (y1 + y2) * 0.5;
    //check if point is in the right quadrants(0 or 1)
        var right = sx >= xm && tx >=xm;
    //check if point is in the lower quadrants (0 or 1)
        var below = sy >= ym && tx >=xm;
    //generates quad tree quadrant value
        var i = below << 1 | right;
    //not an internal node
        n.leaf = false;

        n = n.nodes[i] || (n.nodes[i] = create());

        right ? x1 = xm : x2 = xm;
        below ? y1 = ym : y2 = ym;
        insert(n, d, sx, sy, tx, ty, x1, y1, x2, y2,p);
    }


    //create the root nodes
    //Note: the root node is a leaf node.

    var root = create();
    root.visit = function(f)  {return visit(f, root, x1_, y1_, x2_, y2_);};
    root.find = function(x, y)  {return findNode(root, x, y, x1_, y1_, x2_, y2_);};

    //inserting children in the roots;

    for (i = 0; i < n; i++) {
            insert(root, edges[i], xs[i], ys[i], txs[i], tys[i], x1_, y1_, x2_, y2_, i);
        }

    --i;

    xs = ys = edges = d = null;

    return root;
}; 