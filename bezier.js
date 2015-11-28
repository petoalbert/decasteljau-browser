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


function BezierCurve() {

	THREE.Group.call(this);
    this.init();

}

BezierCurve.prototype = Object.create(THREE.Group.prototype);

BezierCurve.prototype.init = function() {
	this.points = [];
	this.levels = [];
	this.levelGroup = new THREE.Group();
	this.levelGroup.visible = false;
	this.add(this.levelGroup);
	this.controlLine;
	this.clock = new THREE.Clock(false);
	this.duration = 0;
	this.segments = 100;
	this.curve = null;
	this.baseColor = 0x44ff33;
}

BezierCurve.prototype.reset = function() {
    var children = this.children.slice();
    var self = this;
    children.forEach(function(child,index,array) {
        self.remove(child);
    });
    this.init();
}

BezierCurve.prototype.createLevel = function (segments) {
	var baseColor = this.baseColor;
	var brightestColor = 0xffffff;
	
	var increment = Math.round((brightestColor - baseColor) / (this.points.length-2));
	var geometry = new THREE.Geometry();
	for (var i = 0; i<segments; i++) {
		geometry.vertices.push(new THREE.Vector3(0, 0, 0));
	}
	
	var material = new THREE.LineBasicMaterial({ color: brightestColor - (segments-2)*increment,
	                                             linewidth: 4 });
	var level = new THREE.Line(geometry, material);
	this.levelGroup.add(level);
	this.levels.push(level);
	
};

BezierCurve.prototype.createControlLine = function() {
	var geometry = new THREE.Geometry();
	this.points.forEach(function(point, index, array) {
		geometry.vertices.push(point.position.clone());
	});
	var material = new THREE.LineBasicMaterial({ color: this.baseColor,
	                                              linewidth: 4});
	if (this.controlLine) this.remove(this.controlLine);
	this.controlLine = new THREE.Line(geometry, material);
	this.add(this.controlLine);
};

BezierCurve.prototype.addPoint = function (controlPoint) {
	var point = new BezierControlPoint(controlPoint);
	this.add(point);
	this.points.push(point);

	if (this.points.length > 1) {
		this.createControlLine();
	}

	if (this.clock.running) {
		this.stop();
	}
	
	this.computeCurve();

};


BezierCurve.prototype.computeCurve = function () {
	var self = this;
	if (this.points.length < 2) return;

	if (this.curve) this.remove(this.curve);
	
	if (this.levels) {
		this.levels.forEach(function(level,index,array) {
			self.levelGroup.remove(level);
		});
		this.levels = [];
	}

	for (var i=0; i<this.points.length-1; i++) {
		this.createLevel(this.points.length-i);
	}
	
	var geometry = new THREE.Geometry();
	var material = new THREE.LineBasicMaterial({ color: 0xff3399, 
	                                             linewidth: 4 });

	for (var i = 0; i < 1; i += 1 / this.segments) {
		var coords = this.animate(i);
		geometry.vertices.push(coords);
	}

	this.curve = new THREE.Line(geometry, material);
	this.add(this.curve);

};

	
/* t must be in the [0,1] interval */
BezierCurve.prototype.animate = function (t) {
	var self = this;
	var points = []
	this.points.forEach(function (item, index, array) {
		points.push(item.position.clone());
	});
	this.levels.forEach(function(level,index,array) {
		points = self.setLevel(points, level, t);
	});
	return points[0];
};

BezierCurve.prototype.setLevel = function (points, level, t) {
	points.forEach(function (item, index, array) {
		level.geometry.vertices[index] = item;
	});
	level.geometry.verticesNeedUpdate = true;

	var newPoints = [];
	for (var i = 0; i < points.length - 1; i++) {
		var vector = new THREE.Vector3(0, 0, 0);
		vector.addScaledVector(points[i], 1 - t);
		vector.addScaledVector(points[i + 1], t);
		newPoints.push(vector);
	}
	return newPoints;
};

BezierCurve.prototype.update = function () {
	if (!this.clock.running) {
		return;
	}
	if (this.clock.getElapsedTime() > this.duration) {
		this.stop();
	}
	this.animate(this.clock.getElapsedTime() / this.duration)
};

BezierCurve.prototype.start = function (duration) {
	this.duration = duration;
	this.clock.elapsedTime = 0;
	this.levelGroup.visible = true;
	this.clock.start();
};

BezierCurve.prototype.stop = function () {
	this.clock.stop();
	this.levelGroup.visible = false;
};

BezierCurve.prototype.constructor = BezierCurve;


