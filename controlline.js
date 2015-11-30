/* global THREE */

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
