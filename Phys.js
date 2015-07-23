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

    Vec2d.prototype.mul = function (p) {
        return new Vec2d(this.x * p.x, this.y * p.y);
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

    function Transform (trans, scale, rot) {
        this.trans = trans;
        this.scale = scale;
        this.rot = rot;
        this.cos = Math.cos(rot);
        this.sin = Math.sin(rot);
        this.nsin = -Math.sin(rot);
    }
    exports.Transform = Transform;

    Transform.prototype.transformPoint = function (p) {
        //Apply scale
        p = p.mul(this.scale);

        //Apply Rotation
        p = new Vec2d(
            p.x * this.cos + p.y * this.nsin,
            p.x * this.sin + p.y * this.cos
        );

        //Apply translation
        return p.add(this.trans);
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
    };

    function ConvexHull (points) {
        this.originalPoints = points
        this.points = points;
        this.lines = [];
        this.transform = new Transform(0,1,0);
        this.updatePoints();
        this.updateLines();
    }
    exports.ConvexHull = ConvexHull;

    ConvexHull.prototype.setTransform = function (transform) {
        this.transform = transform;
        this.updatePoints();
        this.updateLines();
    };

    ConvexHull.prototype.updatePoints = function () {
        this.points = [];
        for(var p=0; p<(this.originalPoints.length); p++) {
            this.points.push(this.transform.transformPoint(this.originalPoints[p]));
        }
    };

    ConvexHull.prototype.updateLines = function () {
        for(var p=0; p<(this.points.length-1); p++) {
            this.lines.push(new Line(
                this.points[p].clone(),
                this.points[p+1].clone()
            ));
        }
        this.lines.push(new Line(
            this.points[this.points.length-1].clone(),
            this.points[0].clone()
        ));
    };

    ConvexHull.prototype.render = function (context) {
        context.beginPath();
        context.moveTo(this.points[this.points.length-1].x, this.points[this.points.length-1].y);
        for(var p=0; p<(this.points.length); p++) {
            context.lineTo(this.points[p].x, this.points[p].y);
        }
        context.stroke();
    };

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
            intersects: distance < this.r,
            distance: distance,
            overlap: closestPoint.sub(this.p).scale(1-distance/this.r),
            point: closestPoint
        };

    };

})(typeof exports === 'undefined'? this['Phys']={}: exports);