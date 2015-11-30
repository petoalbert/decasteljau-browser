/* global THREE */
/* global BezierControlPoint */
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
    this.elementUnderMouse = null;
    this.editedElement = null;


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
    this.currentObject = gui.addFolder('Current object');
    gui.open();
    this.gui = gui;

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
    this.draggedElement = false;
    this.mousedown = false;
    var mouse = new THREE.Vector2(0,0);
    if (!this.elementUnderMouse && this.dragdistance < 0.1) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
        this.rayCaster.setFromCamera(mouse, this.camera);
        var intersection = this.rayCaster.ray
            .intersectPlane(this.controlPointPlane);
        var newElement = this.bezier.addPoint(intersection);

        newElement.select();
        if (this.elementUnderMouse) this.elementUnderMouse.unselect();
        this.elementUnderMouse = newElement;
    }
}

Controls.prototype.onMouseDown = function( event ) {
    this.mousedown = true;
    this.dragdistance = 0;
    this.mousemove.first = true;
    if (this.elementUnderMouse && this.elementUnderMouse != this.editedElement) {
        this.draggedelement = true;
        if (this.editedElement) {
            this.editedElement.finishEditing();
            this.currentObject.remove(this.currentX);
            this.currentObject.remove(this.currentY);
            this.currentObject.remove(this.currentZ);
            this.currentObject.remove(this.removeCurrent);
            this.currentObject.close();
        }
        this.editedElement = this.elementUnderMouse;
        this.editedElement.modify();
        this.currentX = this.currentObject.add(this.editedElement.position, "x");
        this.currentX.onChange(v => this.bezier.computeCurve());
        this.currentY = this.currentObject.add(this.editedElement.position, "y");
        this.currentY.onChange(v => this.bezier.computeCurve());
        this.currentZ = this.currentObject.add(this.editedElement.position, "z");
        this.currentZ.onChange(v => this.bezier.computeCurve());
        var controls = {
            remove: () => {
                this.bezier.removePoint(this.editedElement);
                this.currentObject.remove(this.currentX);
                this.currentObject.remove(this.currentY);
                this.currentObject.remove(this.currentZ);
                this.currentObject.remove(this.removeCurrent);
                this.currentObject.close();
                this.editedElement = null;
            }
        }
        this.removeCurrent = this.currentObject.add(controls, "remove");
        this.currentObject.open();
    }
}


Controls.prototype.onMouseMove = function( event ) {
    if (!this.draggedElement) {
        this.selectElements( event );
    }
    if (this.mousedown) {
        if (this.elementUnderMouse && this.elementUnderMouse == this.editedElement) {
            this.draggedElement = true;
        }
        if (this.draggedElement) {
            this.moveElement( event );
        } else {
            this.rotateCamera( event );
        }
    }
}

Controls.prototype.moveElement = function( event ) {
    var mouse = new THREE.Vector2(0,0);
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    this.rayCaster.setFromCamera(mouse, this.camera);
    var intersection = this.rayCaster.ray
        .intersectPlane(this.controlPointPlane);
    this.editedElement.position.copy(intersection);
    this.bezier.computeCurve();
    
}

Controls.prototype.selectElements = function (event ) {

    var mouse = new THREE.Vector2(0,0);
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    this.rayCaster.setFromCamera( mouse, this.camera );
    var intersects = this.rayCaster.intersectObjects( this.bezier.children );

    var controlPoints = intersects.filter((intersection,index,array) => {
        return BezierControlPoint.prototype.isPrototypeOf(intersection.object);
    });
    if (controlPoints.length > 0) {
        var newElement = controlPoints.sort((a,b) => {
            return a.distance - b.distance;
        })[0].object;

        if (this.elementUnderMouse != newElement) {
            if (this.elementUnderMouse) this.elementUnderMouse.unselect();
            newElement.select();
        }
        this.elementUnderMouse = newElement; 
    } else {
        if (this.elementUnderMouse) {
            this.elementUnderMouse.unselect();
            this.elementUnderMouse = null;
        }
    }


}

Controls.prototype.rotateCamera = function ( event ) {

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

