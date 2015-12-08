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

function DeCasteljauAnimation(bezier, speed) {
    THREE.Group.call(this);
    this.baseDuration = 10; // seconds
    this.speed = speed;
    this.bezier = bezier;
    this.clock = new THREE.Clock(false);
    this.lines = []
    this.linesGroup = new THREE.Group();
    this.add(this.linesGroup);
    this.reset();
    this.frenetSerretFrame = new FrenetSerretFrame();
    this.add(this.frenetSerretFrame);
    this.t = 0;
    this.tStart = 0;
    this.parameterAdjustment = 0;
    this.play = false;
}

DeCasteljauAnimation.prototype = Object.create(THREE.Group.prototype);
DeCasteljauAnimation.prototype.constructor = DeCasteljauAnimation;

DeCasteljauAnimation.prototype.reset = function() {
    var linenum = this.linenumFromBezier();
    var self = this;
    this.lines.forEach(function(l){self.linesGroup.remove(l)});
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
        for (var j=0; j<this.bezier.points.length-i; j++) {
           geometry.vertices.push(new THREE.Vector3(0,0,0));
        } 
        material = new THREE.LineBasicMaterial( {color: currentcolor.getHex()} );
        currentcolor.add(step);
        line = new THREE.Line(geometry, material);
        this.lines.push(line);
        this.linesGroup.add(line);
    }
    this.visible = false;
}

DeCasteljauAnimation.prototype.linenumFromBezier = function(){
    return this.bezier.points.length-1;
}

DeCasteljauAnimation.prototype.speedChanged = function() {
    if (this.clock.running) {
        var tNew = this.tStart + 
            (this.speed/10) * this.clock.getElapsedTime() / this.baseDuration;
        this.parameterAdjustment = this.t-tNew;
    }
}

DeCasteljauAnimation.prototype.updateAnimation = function() {
    if (!this.clock.running) return;
    this.t = this.tStart + this.parameterAdjustment + 
        (this.speed/10) * this.clock.getElapsedTime() / this.baseDuration;
    if (this.t > 1) {
        this.stop();
        this.t = 0;
        this.start();
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
    this.lines.forEach(function(line,i) {
        geometry.forEach(function(coords,j) {
            line.geometry.vertices[j] = coords.clone();
        });
        line.geometry.verticesNeedUpdate = true;
        switch (i) {
            case self.lines.length-1: 
                derivateDirs[0] = geometry[1].clone().sub(geometry[0]);
                break;
            case self.lines.length-2: 
                derivateDirs[1] = geometry[2].clone().sub(
                    geometry[1].clone().multiplyScalar(2).add(geometry[0])
                );
                break;
        }
        geometry = self.bezier.deCasteljau(geometry, self.t, true);
    });
    if (this.lines.length > 1) {
        this.frenetSerretFrame.setDirections(derivateDirs);
    } else {
        this.visible = false;
    }
    this.frenetSerretFrame.position.copy(this.bezier.deCasteljau(geometry, this.t, false));
}

DeCasteljauAnimation.prototype.stop = function(){
    this.clock.stop();
    this.play = false;
    this.parameterAdjustment = 0;
}

DeCasteljauAnimation.prototype.start = function() {
    this.play = true;
    this.tStart = this.t;
    this.clock = new THREE.Clock(true);
    this.parameterAdjustment = 0;
    this.t = 0;
    this.clock.start();
}

