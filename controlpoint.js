/* global THREE */

function BezierControlPoint(coords, radius) {
    var geometry = new THREE.SphereGeometry(radius,30,30);
    var material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    THREE.Mesh.call(this, geometry, material);
    if (coords) {
        this.position.copy(coords);
    }
    this.radius = radius;
    this.isEdited = false;
    this.isSelected = false;
}

BezierControlPoint.prototype = Object.create(THREE.Mesh.prototype);
BezierControlPoint.prototype.constructor = BezierControlPoint;

BezierControlPoint.prototype.select = function() {
    this.geometry = new THREE.SphereGeometry(this.radius*2.5,30,30);
    this.isSelected = true;
}

BezierControlPoint.prototype.unselect = function() {
    this.geometry = new THREE.SphereGeometry(this.radius,30,30);
}

BezierControlPoint.prototype.edit = function() {
    this.material = new THREE.MeshBasicMaterial({ color: 0xaaff66 });
    this.isEdited = true;
}

BezierControlPoint.prototype.finishEditing = function() {
    this.material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    this.isEdited = false;
}
