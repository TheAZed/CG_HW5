
const CYLINDER_POINT_COUNT = 20;

let gl;
let tree;
let canvas;

function drawTest() {
    canvas = document.getElementById("webgl");
    gl = getWebGLContext(canvas, true);
    if (!gl) {
        alert("Failed at getWebGLContext");
        return;
    }
    tree = new FractalTree([0.164, 0.349, 0.149], [0.0, 0.0, 0.0], [0.0, 1.0, 0.0], 1.0, 0, 4, 5, 60 ,0.75, 0.035);
    // let model = new Matrix4();
    // model.setRotate(Date.now() / 10, 0, 1, 0);
    // let view = new Matrix4();
    // view.setTranslate(0, -1, -5);
    // let projection = new Matrix4();
    // projection.setPerspective(55, canvas.width / canvas.height, 0.1, 100);
    //
    // gl.clearColor(0.8, 0.8, 0.8, 1.0);
    // gl.clear(gl.COLOR_BUFFER_BIT);
    //
    // tree.draw(gl, model, view, projection);
    drawLoop();
}

function drawLoop() {
    let model = new Matrix4();
    model.setRotate(Date.now() / 10, 0, 1, 0);
    let view = new Matrix4();
    view.setTranslate(0, -1, -5);
    let projection = new Matrix4();
    projection.setPerspective(55, canvas.width / canvas.height, 0.1, 100);

    gl.clearColor(0.8, 0.8, 0.8, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    tree.draw(gl, model, view, projection);
    requestAnimationFrame(drawLoop);
}

class FractalTree{
    constructor(treeColor, startPosition, direction, length, currentIndex, maxIndex, branchCount, outDegree, lengthShrinkMultiplicand, thickness) {
        this.vertexShader =
            'precision mediump float;\n' +
            'attribute vec3 a_Position;\n' +
            'uniform float u_PointSize;\n' +
            '\n' +
            'uniform mat4 u_Model;\n' +
            'uniform mat4 u_View;\n' +
            'uniform mat4 u_Projection;\n' +
            '        \n' +
            'varying vec2 v_TexCoord;\n' +
            '        \n' +
            'void main() {\n' +
            '    gl_Position = u_Projection * u_View * u_Model * vec4(a_Position, 1.0);\n' +
            '    gl_PointSize = u_PointSize;\n' +
            '}';
        this.fragmentShader =
            'precision mediump float;\n' +
            'uniform vec4 u_Color;\n' +
            '\n' +
            'void main() {\n' +
            '    gl_FragColor = u_Color;\n' +
            '}\n';
        this.treeColor = treeColor;
        this.startPosition = new Vector3(startPosition);
        this.direction = new Vector3(direction).normalize();
        this.length = length;
        this.currentIndex = currentIndex;
        this.maxIndex = maxIndex;
        this.branchCount = branchCount;
        this.outDegree = outDegree;
        this.thickness = thickness;
        this.drawProgram = 0;
        this.childBranches = [];
        this.perpendicularVector = null;
        this.otherPrependicularVector = null;
        if(direction[1] !== direction[2] || direction[2] !== direction[3] || direction[1] !== direction[3]) {
            this.perpendicularVector = new Vector3([direction[1] - direction[2], direction[2] - direction[0], direction[0] - direction[1]]).normalize();
        }
        else {
            this.perpendicularVector = new Vector3([direction[1] + direction[2], direction[2] - direction[0], -direction[0] - direction[1]]).normalize();
        }
        let a = [0, direction[0], direction[1], direction[2]];
        let b = [0, this.perpendicularVector.elements[0], this.perpendicularVector.elements[1], this.perpendicularVector.elements[2]];
        this.otherPrependicularVector = new Vector3([ a[2] * b[3] - a[3] * b[2], a[3] * b[1] - a[1] * b[3], a[1] * b[2] - a[2] * b[1]]).normalize();
        let perpendicularRotationMatrix = new Matrix4().setRotate(outDegree, this.perpendicularVector.elements[0], this.perpendicularVector.elements[1], this.perpendicularVector.elements[2]);
        let parallelRotationMatrix = new Matrix4().setRotate(360.0 / branchCount, this.direction.elements[0], this.direction.elements[1], this.direction.elements[2]);
        if(currentIndex < maxIndex){
            let finalPoint = [startPosition[0] + this.direction.elements[0] * length, startPosition[1] + this.direction.elements[1] * length, startPosition[2] + this.direction.elements[2] * length];
            let bentDirection = perpendicularRotationMatrix.multiplyVector4(new Vector4([this.direction.elements[0], this.direction.elements[1], this.direction.elements[2], 1.0]));
            for (let i = 0; i < branchCount; i++){
                bentDirection = parallelRotationMatrix.multiplyVector4(bentDirection);
                let tempArray = new Vector3([bentDirection.elements[0], bentDirection.elements[1], bentDirection.elements[2]]).normalize().elements;
                bentDirection = new Vector4([tempArray[0], tempArray[1], tempArray[2], 1.0]);
                let elements = new Float32Array(bentDirection.elements);
                this.childBranches[i] = new FractalTree(treeColor, finalPoint, elements, length * lengthShrinkMultiplicand, currentIndex + 1, maxIndex, branchCount, outDegree, lengthShrinkMultiplicand, thickness);
            }
        }
    }

    getVertexData(){
        let finalPoint = [this.startPosition.elements[0] + this.direction.elements[0] * this.length,
            this.startPosition.elements[1] + this.direction.elements[1] * this.length,
            this.startPosition.elements[2] + this.direction.elements[2] * this.length];
        let startPoint = [this.startPosition.elements[0], this.startPosition.elements[1], this.startPosition.elements[2]];
        let thickHorizontalVector = [this.perpendicularVector.elements[0], this.perpendicularVector.elements[1], this.perpendicularVector.elements[2]];
        let thickVerticalVector = [this.otherPrependicularVector.elements[0], this.otherPrependicularVector.elements[1], this.otherPrependicularVector.elements[2]];
        // let vertices =[
        //     startPoint[0] + (thickHorizontalVector[0] + thickVerticalVector[0]) * this.thickness * (1 - (this.currentIndex * 2) / (2 * this.maxIndex + 1)),
        //     startPoint[1] + (thickHorizontalVector[1] + thickVerticalVector[1]) * this.thickness * (1 - (this.currentIndex * 2) / (2 * this.maxIndex + 1)),
        //     startPoint[2] + (thickHorizontalVector[2] + thickVerticalVector[2]) * this.thickness * (1 - (this.currentIndex * 2) / (2 * this.maxIndex + 1)),
        //
        //     finalPoint[0] + this.thickness * (1 - (this.currentIndex * 2 + 1) / (2 * this.maxIndex + 1)) * (thickHorizontalVector[0] + thickVerticalVector[0]),
        //     finalPoint[1] + this.thickness * (1 - (this.currentIndex * 2 + 1) / (2 * this.maxIndex + 1)) * (thickHorizontalVector[1] + thickVerticalVector[1]),
        //     finalPoint[2] + this.thickness * (1 - (this.currentIndex * 2 + 1) / (2 * this.maxIndex + 1)) * (thickHorizontalVector[2] + thickVerticalVector[2]),
        //
        //     startPoint[0] + (thickHorizontalVector[0] - thickVerticalVector[0]) * this.thickness * (1 - (this.currentIndex * 2) / (2 * this.maxIndex + 1)),
        //     startPoint[1] + (thickHorizontalVector[1] - thickVerticalVector[1]) * this.thickness * (1 - (this.currentIndex * 2) / (2 * this.maxIndex + 1)),
        //     startPoint[2] + (thickHorizontalVector[2] - thickVerticalVector[2]) * this.thickness * (1 - (this.currentIndex * 2) / (2 * this.maxIndex + 1)),
        //
        //     finalPoint[0] + this.thickness * (1 - (this.currentIndex * 2 + 1) / (2 * this.maxIndex + 1)) * (thickHorizontalVector[0] - thickVerticalVector[0]),
        //     finalPoint[1] + this.thickness * (1 - (this.currentIndex * 2 + 1) / (2 * this.maxIndex + 1)) * (thickHorizontalVector[1] - thickVerticalVector[1]),
        //     finalPoint[2] + this.thickness * (1 - (this.currentIndex * 2 + 1) / (2 * this.maxIndex + 1)) * (thickHorizontalVector[2] - thickVerticalVector[2]),
        //
        //     startPoint[0] + (- thickHorizontalVector[0] - thickVerticalVector[0]) * this.thickness * (1 - (this.currentIndex * 2) / (2 * this.maxIndex + 1)),
        //     startPoint[1] + (- thickHorizontalVector[1] - thickVerticalVector[1]) * this.thickness * (1 - (this.currentIndex * 2) / (2 * this.maxIndex + 1)),
        //     startPoint[2] + (- thickHorizontalVector[2] - thickVerticalVector[2]) * this.thickness * (1 - (this.currentIndex * 2) / (2 * this.maxIndex + 1)),
        //
        //     finalPoint[0] + this.thickness * (1 - (this.currentIndex * 2 + 1) / (2 * this.maxIndex + 1)) * (- thickHorizontalVector[0] - thickVerticalVector[0]),
        //     finalPoint[1] + this.thickness * (1 - (this.currentIndex * 2 + 1) / (2 * this.maxIndex + 1)) * (- thickHorizontalVector[1] - thickVerticalVector[1]),
        //     finalPoint[2] + this.thickness * (1 - (this.currentIndex * 2 + 1) / (2 * this.maxIndex + 1)) * (- thickHorizontalVector[2] - thickVerticalVector[2]),
        //
        //     startPoint[0] + (- thickHorizontalVector[0] + thickVerticalVector[0]) * this.thickness * (1 - (this.currentIndex * 2) / (2 * this.maxIndex + 1)),
        //     startPoint[1] + (- thickHorizontalVector[1] + thickVerticalVector[1]) * this.thickness * (1 - (this.currentIndex * 2) / (2 * this.maxIndex + 1)),
        //     startPoint[2] + (- thickHorizontalVector[2] + thickVerticalVector[2]) * this.thickness * (1 - (this.currentIndex * 2) / (2 * this.maxIndex + 1)),
        //
        //     finalPoint[0] + this.thickness * (1 - (this.currentIndex * 2 + 1) / (2 * this.maxIndex + 1)) * (- thickHorizontalVector[0] + thickVerticalVector[0]),
        //     finalPoint[1] + this.thickness * (1 - (this.currentIndex * 2 + 1) / (2 * this.maxIndex + 1)) * (- thickHorizontalVector[1] + thickVerticalVector[1]),
        //     finalPoint[2] + this.thickness * (1 - (this.currentIndex * 2 + 1) / (2 * this.maxIndex + 1)) * (- thickHorizontalVector[2] + thickVerticalVector[2]),
        //
        //     startPoint[0] + (thickHorizontalVector[0] + thickVerticalVector[0]) * this.thickness * (1 - (this.currentIndex * 2) / (2 * this.maxIndex + 1)),
        //     startPoint[1] + (thickHorizontalVector[1] + thickVerticalVector[1]) * this.thickness * (1 - (this.currentIndex * 2) / (2 * this.maxIndex + 1)),
        //     startPoint[2] + (thickHorizontalVector[2] + thickVerticalVector[2]) * this.thickness * (1 - (this.currentIndex * 2) / (2 * this.maxIndex + 1)),
        //
        //     finalPoint[0] + this.thickness * (1 - (this.currentIndex * 2 + 1) / (2 * this.maxIndex + 1)) * (thickHorizontalVector[0] + thickVerticalVector[0]),
        //     finalPoint[1] + this.thickness * (1 - (this.currentIndex * 2 + 1) / (2 * this.maxIndex + 1)) * (thickHorizontalVector[1] + thickVerticalVector[1]),
        //     finalPoint[2] + this.thickness * (1 - (this.currentIndex * 2 + 1) / (2 * this.maxIndex + 1)) * (thickHorizontalVector[2] + thickVerticalVector[2]),
        //
        // ];
        let vertices = [];
        for(let i = 0; i <= CYLINDER_POINT_COUNT; i++){
            vertices[i * 6] = startPoint[0] + (Math.sin(i * Math.PI / 8) * thickHorizontalVector[0] + Math.cos(i * Math.PI / 8) * thickVerticalVector[0]) * this.thickness * (1 - (this.currentIndex * 2) / (2 * this.maxIndex + 1));
            vertices[i * 6 + 1] = startPoint[1] + (Math.sin(i * Math.PI / 8) * thickHorizontalVector[1] + Math.cos(i * Math.PI / 8) * thickVerticalVector[1]) * this.thickness * (1 - (this.currentIndex * 2) / (2 * this.maxIndex + 1));
            vertices[i * 6 + 2] = startPoint[2] + (Math.sin(i * Math.PI / 8) * thickHorizontalVector[2] + Math.cos(i * Math.PI / 8) * thickVerticalVector[2]) * this.thickness * (1 - (this.currentIndex * 2) / (2 * this.maxIndex + 1));

            vertices[i * 6 + 3] = finalPoint[0] + this.thickness * (1 - (this.currentIndex * 2 + 1) / (2 * this.maxIndex + 1)) * (Math.sin(i * Math.PI / 8) * thickHorizontalVector[0] + Math.cos(i * Math.PI / 8) * thickVerticalVector[0]);
            vertices[i * 6 + 4] = finalPoint[1] + this.thickness * (1 - (this.currentIndex * 2 + 1) / (2 * this.maxIndex + 1)) * (Math.sin(i * Math.PI / 8) * thickHorizontalVector[1] + Math.cos(i * Math.PI / 8) * thickVerticalVector[1]);
            vertices[i * 6 + 5] = finalPoint[2] + this.thickness * (1 - (this.currentIndex * 2 + 1) / (2 * this.maxIndex + 1)) * (Math.sin(i * Math.PI / 8) * thickHorizontalVector[2] + Math.cos(i * Math.PI / 8) * thickVerticalVector[2]);
        }
        if(this.currentIndex < this.maxIndex){
            for (let i = 0; i < this.branchCount; i++){
                let data = this.childBranches[i].getVertexData();
                for(let j = 0; j < data.length; j++) {
                    vertices.push(data[j]);
                }
            }
        }
        return new Float32Array(vertices);
    }

    draw(gl, modelMatrix, viewMatrix, projectionMatrix){
        this.drawProgram = createProgram(gl, this.vertexShader, this.fragmentShader);
        gl.useProgram(this.drawProgram);
        gl.enable(gl.DEPTH_TEST);
        let vertices = this.getVertexData();
        let FSIZE = vertices.BYTES_PER_ELEMENT;
        let verticesBuffer = gl.createBuffer();


        gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        let a_Position = gl.getAttribLocation(this.drawProgram, 'a_Position');
        let u_PointSize = gl.getUniformLocation(this.drawProgram, 'u_PointSize');
        let u_Color = gl.getUniformLocation(this.drawProgram, 'u_Color');

        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
        gl.uniform1f(u_PointSize, 5);
        gl.uniform4f(u_Color, this.treeColor[0], this.treeColor[1], this.treeColor[2], 1.0); //Dark Green

        let u_Model = gl.getUniformLocation(this.drawProgram, 'u_Model');
        let u_View = gl.getUniformLocation(this.drawProgram, 'u_View');
        let u_Projection = gl.getUniformLocation(this.drawProgram, 'u_Projection');

        gl.uniformMatrix4fv(u_Model, false, modelMatrix.elements);
        gl.uniformMatrix4fv(u_View, false, viewMatrix.elements);
        gl.uniformMatrix4fv(u_Projection, false, projectionMatrix.elements);
        // console.log(vertices.length);
        for(let i = 0 ; i < vertices.length / (6 * (CYLINDER_POINT_COUNT + 1)) ; i++) {
            gl.drawArrays(gl.TRIANGLE_STRIP, i * 2 * (CYLINDER_POINT_COUNT + 1), 2 * (CYLINDER_POINT_COUNT + 1));
        }

        gl.disableVertexAttribArray(a_Position);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.deleteBuffer(verticesBuffer);
        // console.log(vertices);
    }
}
