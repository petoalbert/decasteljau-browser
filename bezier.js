/* global THREE */

function BezierControlPoint(coords) {
    var geometry = new THREE.SphereGeometry(0.2,30,30);
    var material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    THREE.Mesh.call(this, geometry, material);
    if (coords) {
        this.position.copy(coords);
    }
}

BezierControlPoint.prototype = Object.create(THREE.Mesh.prototype);
BezierControlPoint.prototype.constructor = BezierControlPoint;

function BezierControlLine(points) {
	var geometry = new THREE.Geometry();
    points.forEach(function(point, index, array) {
		geometry.vertices.push(point);
	});
	var material = new THREE.LineBasicMaterial({ color: 0x44ff33});
    THREE.Line.call(this, geometry, material);
}

BezierControlLine.prototype = Object.create(THREE.Line.prototype);
BezierControlLine.prototype.constructor = BezierControlLine;

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

BezierCurve.prototype.setControlLine = function(controlLine) {
    if (this.controlLine) {
        this.remove(this.controlLine);
    }
    this.controlLine = controlLine;
    this.add(controlLine);
}

BezierCurve.prototype.addPoint = function (controlPoint) {
	var point = new BezierControlPoint(controlPoint);
	this.add(point);
	this.points.push(point);

	if (this.points.length > 1) {
        this.setControlLine(new BezierControlLine(
                    this.points.map(p => p.position)));
	}

	this.computeCurve();

};


BezierCurve.prototype.computeCurve = function () {
	var self = this;
	if (this.points.length < 2) return;

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
    var basecolor = 0x44ff33;
    var colorstep = Math.floor((0xffffff - basecolor) / (linenum-1));
    console.log("Colorstep: " + colorstep);
    var x = colorstep + basecolor;
    console.log("Sum: " + x);
    this.lines.forEach((l,i,a) => this.remove(l));
    this.lines = []
    for (var i=0; i<linenum; i++) {
        geometry = new THREE.Geometry();
        for (var j=0; j<bezier.points.length-i; j++) {
           geometry.vertices.push(new THREE.Vector3(0,0,0));
        } 
        var xcolor = basecolor + i*colorstep;
        console.log("Color[" + i + "] = " + xcolor);
        material = new THREE.LineBasicMaterial( {color: xcolor} );
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
        geometry.forEach((coords,j,a) => {
            this.lines[i].geometry.vertices[j] = coords;
        });
        this.lines[i].geometry.verticesNeedUpdate = true;
        geometry = this.bezier.deCasteljau(geometry, t, true);
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

