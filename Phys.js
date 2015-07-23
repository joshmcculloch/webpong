/**
 * Created by josh on 23/07/15.
 */
(function(exports){

    function Vec2d(x, y) {
        this.x = x;
        this.y = y;
    }
    exports.Vec2d = Vec2d;

    Vec2d.prototype.dot = function (v) {
        return this.x * v.x + this.y * v.y;
    };

    Vec2d.prototype.clone = function () {
        return new Vec2d(this.x, this.y);
    };

    Vec2d.prototype.add = function (p) {
        return new Vec2d(this.x + p.x, this.y + p.y);
    };

    Vec2d.prototype.sub = function (v) {
        return new Vec2d(this.x - v.x, this.y- v.y);
    };

    Vec2d.prototype.scale = function (s) {
        return new Vec2d(this.x * s, this.y * s);
    };

    Vec2d.prototype.magnitude = function () {
        return Math.sqrt(this.x*this.x + this.y*this.y);
    };

    Vec2d.prototype.normalised = function () {
        return this.clone().scale(1/this.magnitude());
    };

    Vec2d.prototype.reflect = function (normal) {
        var n = normal.normalised();
        return this.sub(n.scale(2* this.dot(n)));
    };

    function Line(p1, p2) {
        this.a = p1;
        this.b = p2;
    }
    exports.Line = Line;

    Line.prototype.closestPoint = function (p) {
        var a2b = this.b.sub(this.a);
        var a2p  = p.sub(this.a);

        var a2pDota2b = a2p.dot(a2b);
        var t = a2pDota2b / a2b.magnitude();

        if (t < 0) {
            return this.a.clone();
        } else if (t > a2b.magnitude()) {
            return this.b.clone();
        } else {
            return this.a.add(a2b.normalised().scale(t));
        }
    }

    function ConvexHull (points) {
        this.lines = [];
        for(var p=0; p<(points.length-1); p++) {
            this.lines.push(new Line(
                    new Vec2d(points[p].x, points[p].y),
                    new Vec2d(points[p+1].x, points[p+1].y)
            ));
        }
        this.lines.push(new Line(
                new Vec2d(points[points.length-1].x, points[points.length-1].y),
                new Vec2d(points[0].x, points[0].y)
        ));
    }
    exports.ConvexHull = ConvexHull;

    function Circle(p, r) {
        this.p = p;
        this.r = r;
    }
    exports.Circle = Circle;

    Circle.prototype.intersects = function (ch) {
        var closestPoint = new Vec2d(0,0);
        var distance = 999999;
        for(var l=0; l<ch.lines.length; l++) {
            var intersect = ch.lines[l].closestPoint(this.p);
            var d = intersect.sub(this.p).magnitude();
            if (d < distance) {
                distance = d;
                closestPoint = intersect;
            }
        }
        return {
            intersets: distance <= this.r,
            distance: t,
            point: closestPoint
        };

    };

})(typeof exports === 'undefined'? this['Phys']={}: exports);