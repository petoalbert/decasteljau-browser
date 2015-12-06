/* global BezierControlPoint */
/* global BezierControlLine */
/* global THREE */

function BezierCurve() {

	THREE.Group.call(this);
    this.init();

}

BezierCurve.prototype = Object.create(THREE.Group.prototype);
BezierCurve.prototype.constructor = BezierCurve;

BezierCurve.prototype.init = function() {
	this.points = [];
	this.controlLine;
	this.segments = 100;
	this.curve = null;
}

BezierCurve.prototype.reset = function() {
    var children = this.children.slice();
    var self = this;
    children.forEach(function(child,index,array) {
        self.remove(child);
    });
    this.init();
}

BezierCurve.prototype.createControlLine = function() {
    if (this.controlLine) {
        this.remove(this.controlLine);
    }
    if (this.points.length > 1) {
        this.controlLine = new BezierControlLine(
                this.points.map(function(p) {return p.position}));
        this.add(this.controlLine);
    }
}

BezierCurve.prototype.addPoint = function (controlPoint) {
	var point = new BezierControlPoint(controlPoint);
	this.add(point);
	this.points.push(point);

	this.computeCurve();
    return point;
};

BezierCurve.prototype.removePoint = function (controlPoint) {
    this.points.splice(this.points.indexOf(controlPoint),1);
    this.remove(controlPoint);

    this.computeCurve();
}


BezierCurve.prototype.computeCurve = function () {
    this.createControlLine();
	if (this.points.length < 2) {
        if (this.curve) {
            this.remove(this.curve);
            this.curve = null;
            return;
        }
    }

	if (this.curve) this.remove(this.curve);
	
	var geometry = new THREE.Geometry();
	var material = new THREE.LineBasicMaterial({ color: 0xff3399 });
	for (var i = 0; i <= this.segments; i += 1) {
        var t = i/this.segments;
		geometry.vertices.push(
                this.deCasteljau(this.points.map(function(p){
                    return p.position}),t)
        );
	}

	this.curve = new THREE.Line(geometry, material);
	this.add(this.curve);
};


BezierCurve.prototype.deCasteljau = function (points, t, dontRecurse) {
    if (points.length == 1) {
        return points[0];
    }
	var newPoints = [];
	for (var i = 0; i < points.length - 1; i++) {
		var vector = new THREE.Vector3(0, 0, 0);
		vector.addScaledVector(points[i], 1 - t);
		vector.addScaledVector(points[i + 1], t);
		newPoints.push(vector);
	}
    if (!dontRecurse) {
	    return this.deCasteljau(newPoints, t);
    } else {
        return newPoints;
    }
};
