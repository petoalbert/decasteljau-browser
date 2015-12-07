/* global THREE */

function BezierControlPoint(coords) {
    var geometry = new THREE.SphereGeometry(0.25,30,30);
    var material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    THREE.Mesh.call(this, geometry, material);
    if (coords) {
        this.position.copy(coords);
    }
    this.isEdited = false;
    this.isSelected = false;
}

BezierControlPoint.prototype = Object.create(THREE.Mesh.prototype);
BezierControlPoint.prototype.constructor = BezierControlPoint;

BezierControlPoint.prototype.setScale = function(s) {
    if (this.isSelected) {
        this.scale.copy(new THREE.Vector3(2*s,2*s,2*s));
    } else {
        this.scale.copy(new THREE.Vector3(s,s,s));
    }
    this.updateMatrix();
}

BezierControlPoint.prototype.select = function() {
    this.scale.multiplyScalar(2);
    this.updateMatrix();
    this.isSelected = true;
}

BezierControlPoint.prototype.unselect = function() {
    this.scale.multiplyScalar(1/2);
    this.updateMatrix();
    this.isSelected = false;
}

BezierControlPoint.prototype.edit = function() {
    this.material.color = new THREE.Color(0xaaff66);
    this.material.needsUpdate = true; 
    this.isEdited = true;
}

BezierControlPoint.prototype.finishEditing = function() {
    this.material.color = new THREE.Color(0xffff00);
    this.material.needsUpdate = true;
    this.isEdited = false;
}
