/* global THREE */

function FrenetSerretFrame() {
    THREE.Group.call(this);
    var origin = new THREE.Vector3(0,0,0);
    var length = 4;
    this.xArrow = new THREE.ArrowHelper(
            new THREE.Vector3(1,0,0),
            origin,
            length,
            0xff0000);
    this.yArrow = new THREE.ArrowHelper(
            new THREE.Vector3(0,1,0),
            origin,
            length,
            0x00ff00);
    this.zArrow = new THREE.ArrowHelper(
            new THREE.Vector3(0,0,1),
            origin,
            length,
            0x0000ff);
    this.add(this.xArrow);
    this.add(this.yArrow);
    this.add(this.zArrow);

}

FrenetSerretFrame.prototype = Object.create(THREE.Group.prototype);
FrenetSerretFrame.prototype.constructor = FrenetSerretFrame;

FrenetSerretFrame.prototype.setDirections = function(derivateDirs) {
    var tangent = derivateDirs[0].clone().normalize();
    var binormal = derivateDirs[0].clone().cross(derivateDirs[1]).normalize();
    var normal = binormal.clone().cross(tangent).normalize();
    this.xArrow.setDirection(tangent);
    this.yArrow.setDirection(normal);
    this.zArrow.setDirection(binormal);
}

function DeCasteljauAnimation(bezier, duration) {
    THREE.Group.call(this);
    this.duration = duration;
    this.remainingDuration = duration;
    this.bezier = bezier;
    this.clock = new THREE.Clock(false);
    this.lines = []
    this.reset();
    this.frenetSerretFrame = new FrenetSerretFrame();
    this.frenetSerretFrame.visible = false;
    this.add(this.frenetSerretFrame);
    this.t = 0;
    this.tStart = 0;
}

DeCasteljauAnimation.prototype = Object.create(THREE.Group.prototype);
DeCasteljauAnimation.prototype.constructor = DeCasteljauAnimation;

DeCasteljauAnimation.prototype.reset = function() {
    var linenum = this.linenumFromBezier();
    var self = this;
    this.lines.forEach(function(l){self.remove(l)});
    this.lines = []
    var currentcolor = new THREE.Color(0x44ff33);
    var step = new THREE.Color(1-currentcolor.r,
                               1-currentcolor.g,
                               1-currentcolor.b).multiplyScalar(1/linenum);
    var geometry;
    var material;                           
    var line;                           
    for (var i=0; i<linenum; i++) {
        geometry = new THREE.Geometry();
        for (var j=0; j<this.bezier.points.length-i-1; j++) {
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
    return this.bezier.points.length-2;
}

DeCasteljauAnimation.prototype.updateAnimation = function() {
    if (!this.clock.running) return;
    this.t = this.tStart + this.clock.getElapsedTime() / this.duration;
    if (this.t > 1) {
        this.visible = false;
        this.stop();
    } else {
        this.update();
    }
}

DeCasteljauAnimation.prototype.update = function() {

    var self = this;
    var derivateDirs = [];
    if (this.linenumFromBezier() != this.lines.length) {
        this.reset();
    }
    this.visible = true;
    var geometry = this.bezier.points.map(function(p){return p.position});
    for (var i=0; i<this.lines.length; i++) {
        geometry = this.bezier.deCasteljau(geometry, this.t, true);
        geometry.forEach(function(coords,j) {
            self.lines[i].geometry.vertices[j] = coords.clone();
        });
        this.lines[i].geometry.verticesNeedUpdate = true;
        switch (i) {
            case this.lines.length-1: 
                derivateDirs[0] = geometry[1].clone().sub(geometry[0]);
                break;
            case this.lines.length-2: 
                derivateDirs[1] = geometry[2].clone().sub(
                    geometry[1].clone().multiplyScalar(2).add(geometry[0])
                );
                break;
        }
    }
    if (this.lines.length > 1) {
        this.frenetSerretFrame.visible = true;
        this.frenetSerretFrame.setDirections(derivateDirs);
    } else {
        this.frenetSerretFrame.visible = false;
    }
    this.frenetSerretFrame.position.copy(this.bezier.deCasteljau(geometry, this.t, false));
}

DeCasteljauAnimation.prototype.stop = function(){
    this.clock.stop();
    this.visible = false;
}

DeCasteljauAnimation.prototype.start = function() {
    this.tStart = this.t;
    this.clock = new THREE.Clock(true);
    this.clock.start();
}

