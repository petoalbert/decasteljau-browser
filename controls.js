/* global THREE */
function Controls(scene, canvas, camera, bezier) {
    this.scene = scene;
    this.camera = camera;
    this.bezier = bezier;

    this.mousedown = false;
    this.dragdistance = 0;
    this.rayCaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.controlPointPlane = new THREE.Plane(new THREE.Vector3(0,0,1), 0);

    this.mousemove = {
        pos: new THREE.Vector2(),
        first: true
    };

    var bezier = this.bezier;
    var controls = {
        duration: 5,
        clear: function() { 
            bezier.reset()
        },
        animate: function() {
            bezier.start(this.duration);
        }
    };
    var gui = new dat.GUI();
    gui.add(controls, 'duration', 1, 15);
    gui.add(controls, 'clear');
    gui.add(controls, 'animate');
    gui.open();

    var self = this;
    self.onWheel = function( event ) {
        var delta = -(event.deltaX + event.deltaY + event.deltaZ) / 100;
        self.camera.zoom += delta;
        self.camera.updateProjectionMatrix();
    }

    self.onMouseUp = function( event ) {
        self.mousedown = false;
        if (self.dragdistance < 0.1) {
            self.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            self.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
            self.rayCaster.setFromCamera(self.mouse, self.camera);
            var intersection = self.rayCaster.ray
                .intersectPlane(self.controlPointPlane);
            self.bezier.addPoint(intersection);
        }
    }

    self.onMouseDown = function( event ) {
        self.mousedown = true;
        self.dragdistance = 0;
        self.mouse.x = (event.clientX / window.innerWidth) * 2 -1;
        self.mouse.y = - (event.clientY / window.innerHeight) * 2 +1;
        self.mousemove.first = true;
    }

    self.onMouseMove = function( event ) {

        if (!self.mousedown) return;

        var newmouse = new THREE.Vector2(
                (event.clientX / window.innerWidth) * 2 -1,
                (event.clientY / window.innerHeight) * 2 +1);

        if (self.mousemove.first) {
            self.mousemove.first = false;
            self.mousemove.pos.copy(newmouse);
            return;
        }

        var rotationAxisView = new THREE.Vector3(
                -(newmouse.y - self.mousemove.pos.y),
                -(newmouse.x - self.mousemove.pos.x),
                0);

        var length = rotationAxisView.length();

        self.dragdistance += length;

        if (self.dragdistance < 0.3) {
            return;
        }

        self.mousemove.pos.copy(newmouse);
        rotationAxisView.normalize();

        var rotation = new THREE.Matrix4();
        rotation.extractRotation(self.camera.matrix);
        rotationAxisView.applyMatrix4(rotation);

        rotation.makeRotationAxis(rotationAxisView, 300*length*Math.PI/180);
        self.camera.position.applyMatrix4(rotation);
        self.camera.applyMatrix(rotation);

        self.controlPointPlane = new THREE.Plane(
                camera.getWorldDirection(),
                0);

    }

    canvas.addEventListener("wheel", this.onWheel, false);
    canvas.addEventListener("mousedown", this.onMouseDown, false);
    canvas.addEventListener("mouseup", this.onMouseUp, false);
    canvas.addEventListener("mousemove", this.onMouseMove, false);

}
