/* global THREE */
function Controls(scene, canvas, camera, bezier, animation) {
    this.scene = scene;
    this.camera = camera;
    this.bezier = bezier;
    this.animation = animation;

    this.mousedown = false;
    this.dragdistance = 0;
    this.rayCaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.controlPointPlane = new THREE.Plane(new THREE.Vector3(0,0,1), 0);
    this.axesGroup = this.addAxes();
    scene.add(this.axesGroup);


    this.mousemove = {
        pos: new THREE.Vector2(),
        first: true
    };

    var controls = {
        clear: function() { 
            animation.stop()
            bezier.reset()
        },
        animate: function() {
            animation.start();
        }
    };
    var gui = new dat.GUI();
    var segmentsController = gui.add(bezier, 'segments', 1);
    segmentsController.onChange(val => bezier.computeCurve());
    var axesGui = gui.addFolder("Helper axes");
    axesGui.add(this.axesGroup, 'visible');
    var animationGui = gui.addFolder('Animation');
    animationGui.add(animation, 'duration', 1, 15);
    animationGui.add(controls, 'animate');
    gui.add(controls, 'clear');
    gui.open();

    var self = this;
    canvas.addEventListener("wheel", e => self.onWheel(e), false);
    canvas.addEventListener("mousedown", e => self.onMouseDown(e), false);
    canvas.addEventListener("mouseup", e => self.onMouseUp(e), false);
    canvas.addEventListener("mousemove", e => self.onMouseMove(e), false);
}

Controls.prototype.addAxes = function(){
    var axesGroup = new THREE.Group(); 
    var origin = new THREE.Vector3(0,0,0);
    var length = 6;
    arrows = [ 
    { color:0xff0000, dir:new THREE.Vector3(0,0,1) },
    { color:0x00ff00, dir:new THREE.Vector3(0,1,0) },
    { color:0x0000ff, dir:new THREE.Vector3(1,0,0) }
    ];
    arrows.forEach(params => {
        var arrow = new THREE.ArrowHelper(params.dir,
                origin,
                length,
                params.color);
        axesGroup.add(arrow);
    });
    return axesGroup;
}

Controls.prototype.onWheel = function( event ) {
    var delta = -(event.deltaX + event.deltaY + event.deltaZ) / 100;
    this.camera.zoom += delta;
    this.camera.updateProjectionMatrix();
}

Controls.prototype.onMouseUp = function( event ) {
    this.mousedown = false;
    if (this.dragdistance < 0.1) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
        this.rayCaster.setFromCamera(this.mouse, this.camera);
        var intersection = this.rayCaster.ray
            .intersectPlane(this.controlPointPlane);
        this.bezier.addPoint(intersection);
    }
}

Controls.prototype.onMouseDown = function( event ) {
    this.mousedown = true;
    this.dragdistance = 0;
    this.mouse.x = (event.clientX / window.innerWidth) * 2 -1;
    this.mouse.y = - (event.clientY / window.innerHeight) * 2 +1;
    this.mousemove.first = true;
}

Controls.prototype.onMouseMove = function( event ) {

    if (!this.mousedown) return;

    var newmouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 -1,
            (event.clientY / window.innerHeight) * 2 +1);

    if (this.mousemove.first) {
        this.mousemove.first = false;
        this.mousemove.pos.copy(newmouse);
        return;
    }

    var rotationAxisView = new THREE.Vector3(
            -(newmouse.y - this.mousemove.pos.y),
            -(newmouse.x - this.mousemove.pos.x),
            0);

    var length = rotationAxisView.length();

    this.dragdistance += length;

    if (this.dragdistance < 0.3) {
        return;
    }

    this.mousemove.pos.copy(newmouse);
    rotationAxisView.normalize();

    var rotation = new THREE.Matrix4();
    rotation.extractRotation(this.camera.matrix);
    rotationAxisView.applyMatrix4(rotation);

    rotation.makeRotationAxis(rotationAxisView, 300*length*Math.PI/180);
    this.camera.position.applyMatrix4(rotation);
    this.camera.applyMatrix(rotation);

    this.controlPointPlane = new THREE.Plane(
            camera.getWorldDirection(),
            0);

}

