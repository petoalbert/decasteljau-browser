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
    var t = this.clock.getElapsedTime() / this.duration;
    if (t > 1) {
        this.visible = false;
        this.stop();
    } else {
        this.update(t);
    }
}

DeCasteljauAnimation.prototype.update = function(t) {
    var self = this;
    if (this.linenumFromBezier() != this.lines.length) {
        this.reset();
    }
    this.visible = true;
    var geometry = this.bezier.points.map(function(p){return p.position});
    for (var i=0; i<this.lines.length; i++) {
        geometry = this.bezier.deCasteljau(geometry, t, true);
        geometry.forEach(function(coords,j) {
            self.lines[i].geometry.vertices[j] = coords.clone();
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

