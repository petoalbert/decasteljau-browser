/* global THREE */
/* global BezierControlPoint */
function Controls(scene, canvas, camera, bezier, animation) {
    this.scene = scene;
    this.camera = camera;
    this.bezier = bezier;
    this.animation = animation;

    this.mousedown = false;
    this.mousemovedistance = 0;
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

    var self=this;
    var controls = {
        clear: function() { 
            animation.stop();
            self.finishEdit();
            bezier.reset();
        },
        animate: function() {
            animation.start();
        }
    };

    this.gui = new dat.GUI();
    var segmentsController = this.gui.add(bezier, 'segments', 1);
    segmentsController.onChange(function(){bezier.computeCurve()});
    var appearanceGUI = this.gui.addFolder("Appearance");
    var pointAppearanceGUI = appearanceGUI.addFolder("Control points");
    var cpScale = pointAppearanceGUI.add(bezier.pointAppearance, "scale");
    cpScale.min(0.01);
    cpScale.onChange(function(){bezier.scalePoints()});
    var axesGui = appearanceGUI.addFolder("Helper axes");
    axesGui.add(this.axesGroup, 'visible');
    var animationGui = this.gui.addFolder('Animation');
    animationGui.add(animation, 'duration', 1, 15);
    /*
     * dat.gui does not handle manually setting the step size well, but it can 
     * determine a good step size based on the initial value 
     */
    animation.t = 0.33;
    var parameterSlider = animationGui.add(animation, 't', 0, 1).listen();
    animation.t = 0;
    parameterSlider.onChange(function(v){
        animation.stop();
        animation.t = v;
        animation.update();
    });
    animationGui.add(controls, 'animate');
    var frenetSerretGUI = animationGui.addFolder('Frenet-Serret frame');
    frenetSerretGUI.add(animation.frenetSerretFrame, 'visible').listen();
    var helperLinesGUI = animationGui.addFolder('Helper lines');
    helperLinesGUI.add(animation.linesGroup, 'visible').listen();
    this.gui.add(controls, 'clear');
    this.controlPointGUI = this.gui.addFolder('Control point');
    this.gui.open();

    var self = this;
    canvas.addEventListener("wheel", function(e){self.onWheel(e)}, false);
    canvas.addEventListener("mousedown", 
                            function(e){self.onMouseDown(e)},false);
    canvas.addEventListener("mouseup", function(e){self.onMouseUp(e)}, false);
    canvas.addEventListener("mousemove", 
                            function(e){self.onMouseMove(e)}, false);
}

Controls.prototype.addAxes = function(){
    var axesGroup = new THREE.Group(); 
    var origin = new THREE.Vector3(0,0,0);
    var length = 6;
    var arrows = [ 
    { color:0xff0000, dir:new THREE.Vector3(0,0,1) },
    { color:0x00ff00, dir:new THREE.Vector3(0,1,0) },
    { color:0x0000ff, dir:new THREE.Vector3(1,0,0) }
    ];
    arrows.forEach(function(params) {
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
    if (!this.elementUnderMouse && this.mousemovedistance < 0.1) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
        this.rayCaster.setFromCamera(mouse, this.camera);
        var intersection = this.rayCaster.ray
            .intersectPlane(this.controlPointPlane);
        var newElement = this.bezier.addPoint(
                intersection.applyQuaternion(
                    this.scene.quaternion.clone().inverse()
                )
        );
        this.animation.update();

        newElement.select();
        if (this.elementUnderMouse) this.elementUnderMouse.unselect();
        this.elementUnderMouse = newElement;
    }
}

Controls.prototype.finishEdit = function() {
    if (this.editedElement) {
        this.editedElement.finishEditing();
        // Assume that controls are either removed together or none of them
        // is removed.
        if (this.currentX) {
            this.controlPointGUI.remove(this.currentX);
            this.controlPointGUI.remove(this.currentY);
            this.controlPointGUI.remove(this.currentZ);
            this.controlPointGUI.remove(this.removeCurrent);
            this.currentX = null;
            this.currentY = null;
            this.currentZ = null;
            this.removeCurrent = null;
        }
        this.controlPointGUI.close();
    }
}

Controls.prototype.editControlPoint = function(cp) {
    var self = this;
    this.finishEdit();
    this.editedElement = cp;
    this.editedElement.edit();
    this.currentX = this.controlPointGUI.add(this.editedElement.position, "x");
    this.currentX.step(0.1);
    this.currentX.onChange(function(){
        self.bezier.computeCurve();
        self.animation.update()
    });
    this.currentY = this.controlPointGUI.add(this.editedElement.position, "y");
    this.currentY.step(0.1);    
    this.currentY.onChange(function(){
        self.bezier.computeCurve();
        self.animation.update()
    });
    this.currentZ = this.controlPointGUI.add(this.editedElement.position, "z");
    this.currentZ.step(0.1);    
    this.currentZ.onChange(function(){
        self.bezier.computeCurve();
        self.animation.update()
    });
    var controls = {
        remove: function() {
            self.finishEdit();
            self.bezier.removePoint(self.editedElement);
            self.animation.update();
            self.editedElement = null;
        }
    }
    this.removeCurrent = this.controlPointGUI.add(controls, "remove");
    this.controlPointGUI.open();
}

Controls.prototype.onMouseDown = function( event ) {
    this.mousedown = true;
    this.mousemovedistance = 0;
    this.mousemove.first = true;
    if (this.elementUnderMouse && this.elementUnderMouse != this.editedElement) {
        this.draggedelement = true;
        this.editControlPoint(this.elementUnderMouse);
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
            this.rotateSceneWithMouse( event );
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
    this.editedElement.position.copy(intersection.applyQuaternion(
        this.scene.quaternion.clone().inverse()
    ));
    for (var i in this.controlPointGUI.__controllers) {
        this.controlPointGUI.__controllers[i].updateDisplay();
    }
    this.bezier.computeCurve();
    this.animation.update();
    
}

Controls.prototype.selectElements = function (event ) {

    var mouse = new THREE.Vector2(0,0);
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    this.rayCaster.setFromCamera( mouse, this.camera );
    var intersects = this.rayCaster.intersectObjects( this.bezier.children );

    var controlPoints = intersects.filter(function(intersection) {
        return BezierControlPoint.prototype.isPrototypeOf(intersection.object);
    });
    if (controlPoints.length > 0) {
        var newElement = controlPoints.sort(function(a,b) {
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

Controls.prototype.rotateSceneWithMouse = function ( event ) {

    var newmouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 -1,
            (event.clientY / window.innerHeight) * 2 +1);

    if (this.mousemove.first) {
        this.mousemove.first = false;
        this.mousemove.pos.copy(newmouse);
        return;
    }

    var rotationAxisView = new THREE.Vector3(
            (newmouse.y - this.mousemove.pos.y),
            (newmouse.x - this.mousemove.pos.x),
            0);

    var length = rotationAxisView.length();

    this.mousemovedistance += length;

    if (this.mousemovedistance < 0.3) {
        return;
    }

    this.mousemove.pos.copy(newmouse);
    rotationAxisView.normalize();

    rotationAxisView.applyQuaternion(this.scene.quaternion.clone().inverse());
    this.scene.rotateOnAxis(rotationAxisView, 300*length*Math.PI/180);
}

