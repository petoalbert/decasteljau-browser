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
                this.points.map(p => p.position));
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
	var self = this;
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
	for (var t = 0; t < 1; t += 1 / this.segments) {
		geometry.vertices.push(
                this.deCasteljau(this.points.map(p => p.position),t)
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

function DeCasteljauAnimation(bezier, duration) {
    THREE.Group.call(this);
    this.duration = duration;
    this.bezier = bezier;
    this.clock = new THREE.Clock(false);
    this.lines = []
    this.reset();
}

DeCasteljauAnimation.prototype = Object.create(THREE.Group.prototype);
DeCasteljauAnimation.prototype.constructor = DeCasteljauAnimation;

DeCasteljauAnimation.prototype.reset = function() {
    var linenum = this.linenumFromBezier();
    this.lines.forEach((l,i,a) => this.remove(l));
    this.lines = []
    var currentcolor = new THREE.Color(0x44ff33);
    var step = new THREE.Color(1-currentcolor.r,
                               1-currentcolor.g,
                               1-currentcolor.b).multiplyScalar(1/linenum);
    for (var i=0; i<linenum; i++) {
        geometry = new THREE.Geometry();
        for (var j=0; j<bezier.points.length-i-1; j++) {
           geometry.vertices.push(new THREE.Vector3(0,0,0));
        } 
        material = new THREE.LineBasicMaterial( {color: currentcolor.getHex()} );
        currentcolor.add(step);
        line = new THREE.Line(geometry, material);
        this.lines.push(line);
        this.add(line);
    }
    this.visible = false;
}

DeCasteljauAnimation.prototype.linenumFromBezier = function(){
    return bezier.points.length-2;
}

DeCasteljauAnimation.prototype.updateAnimation = function() {
    if (!this.clock.running) return;
    var t = this.clock.getElapsedTime() / this.duration;
    if (t > 1) {
        this.visible = false;
        this.stop();
    } else {
        this.update(t);
    }
}

DeCasteljauAnimation.prototype.update = function(t) {
    if (this.linenumFromBezier() != this.lines.length) {
        this.reset();
    }
    this.visible = true;
    var geometry = this.bezier.points.map((p,i,a) => p.position);
    for (var i=0; i<this.lines.length; i++) {
        geometry = this.bezier.deCasteljau(geometry, t, true);
        geometry.forEach((coords,j,a) => {
            this.lines[i].geometry.vertices[j] = coords.clone();
        });
        this.lines[i].geometry.verticesNeedUpdate = true;
    }
}

DeCasteljauAnimation.prototype.stop = function(){
    this.clock.stop();
    this.visible = false;
}

DeCasteljauAnimation.prototype.start = function(duration) {
    this.clock = new THREE.Clock(true);
    this.clock.start();
}

