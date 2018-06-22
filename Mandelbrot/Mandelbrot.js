var vshader_src =
    'attribute vec4 a_Position;\n\
    attribute vec2 a_PlotCorners;\n\
    varying vec2 v_PlotPosition;\
    void main() {\n\
      gl_Position = a_Position;\n\
      v_PlotPosition = a_PlotCorners;\n\
    }';

var fshader_src =
    '#define maxIter (100)\n' +
    '\n' +
    'precision highp float;\n' +
    '\n' +
    'uniform vec4 minColor;\n' +
    'uniform vec4 maxColor;\n' +
    'uniform vec2 center;\n' +
    'uniform float zoomScale;\n' +
    '\n' +
    'varying vec2 v_PlotPosition;\n' +
    '\n' +
    'void main() {\n' +
    '\n' +
    '    vec2 z, c;\n' +
    '\n' +
    '    c.x = (v_PlotPosition.x - center.x) / zoomScale;\n' +
    '    c.y = (v_PlotPosition.y - center.y) / zoomScale;\n' +
    '\n' +
    '    int i = 0;\n' +
    '    z = vec2(0, 0);\n' +
    '    for(int j = 0; j < maxIter; j++){\n' +
    '        float x = (z.x * z.x - z.y * z.y) + c.x;\n' +
    '        float y = (z.y * z.x + z.x * z.y) + c.y;\n' +
    '\n' +
    '        if((x*x + y*y) > 100.0){\n' +
    '            i = j;\n' +
    '            break;\n' +
    '        }\n' +
    '        i = j + 1;\n' +
    '        z.x = x;\n' +
    '        z.y = y;\n' +
    '    }\n' +
    '\n' +
    '    if(i == maxIter)\n' +
    '        gl_FragColor = vec4(0, 0, 0, 1);\n' +
    '    else\n' +
    '        gl_FragColor = (1.0 - float(i) / float(maxIter - 1)) * minColor + (float(i) / float(maxIter - 1)) * maxColor;\n' +
    '}\n';
const rect_vshader =
    'attribute vec4 a_Position;\n\
    attribute float a_PointSize;\n\
    uniform vec4 u_Translation;\
    void main() {\n\
    gl_Position = a_Position + u_Translation;\n\
    gl_PointSize = a_PointSize;\n\
    }';
const rect_fshader =
    'precision mediump float;\n\
    uniform vec4 u_FragColor;\n\
    void main() {\n\
    gl_FragColor = u_FragColor;\n\
    }';


class Rectangle2D {
    constructor(botLeftX, botLeftY, width, height) {
        this.cornerX = botLeftX;
        this.cornerY = botLeftY;
        this.width = width;
        this.height = height;
        this.corners = new Float32Array(8);
        this.corners[0] = this.cornerX + this.width;
        this.corners[1] = this.cornerY + this.height;
        this.corners[2] = this.cornerX;
        this.corners[3] = this.cornerY + this.height;
        this.corners[4] = this.cornerX + this.width;
        this.corners[5] = this.cornerY;
        this.corners[6] = this.cornerX;
        this.corners[7] = this.cornerY;

        this.refreshCorners = function () {
            this.corners[0] = this.cornerX + this.width;
            this.corners[1] = this.cornerY + this.height;
            this.corners[2] = this.cornerX;
            this.corners[3] = this.cornerY + this.height;
            this.corners[4] = this.cornerX + this.width;
            this.corners[5] = this.cornerY;
            this.corners[6] = this.cornerX;
            this.corners[7] = this.cornerY;
        }
    }

}

let gl;
let mandelProgram, rectProgram;
let cornersRect = new Rectangle2D(-2.2, -1.2, 2.9, 2.4);
let tempRect = new Rectangle2D(-2.2, -1.2, 2.9, 2.4);
let finalRect = new Rectangle2D(-2.2, -1.2, 2.9, 2.4);
let firstPoint = new Float32Array([0.0, 0.0]);
let mouseDownInCanvas = false;
const ratio = 2.9 / 2.4;

function main() {
    var canvas = document.getElementById("webgl");
    gl = getWebGLContext(canvas, true);
    if (!gl) {
        alert("Failed at getWebGLContext");
        return;
    }

    mandelProgram = createProgram(gl, vshader_src, fshader_src);
    rectProgram = createProgram(gl, rect_vshader, rect_fshader);

    canvas.addEventListener('mousemove',
        function (ev) {
            if (!mouseDownInCanvas)
                return;
            let rect = canvas.getBoundingClientRect();
            let X = ev.clientX - rect.left;
            let Y = ev.clientY - rect.top;
            findRect([cornersRect.cornerX + cornersRect.width * X / canvas.width,
                cornersRect.cornerY + cornersRect.height * (1.0 - Y / canvas.height)]);
            // console.log([cornersRect.cornerX + cornersRect.width * X / canvas.width,
            //     cornersRect.cornerY + cornersRect.height * Y / canvas.height]);
            // console.log([X, Y]);
        });
    canvas.addEventListener('mousedown',
        function (ev) {
            let rect = canvas.getBoundingClientRect();
            let X = ev.clientX - rect.left;
            let Y = ev.clientY - rect.top;
            mouseDownInCanvas = true;
            firstPoint[0] = cornersRect.cornerX + cornersRect.width * X / canvas.width;
            firstPoint[1] = cornersRect.cornerY + cornersRect.height * (1.0 - Y / canvas.height);
            // console.log(firstPoint);
        });
    canvas.addEventListener("mouseup",
        function (ev) {
            cornersRect = new Rectangle2D(finalRect.cornerX, finalRect.cornerY, finalRect.width, finalRect.height);
            mouseDownInCanvas = false;
            // console.log(finalRect);
            // console.log(cornersRect);
        });
    canvas.addEventListener("mouseout",
        function (ev) {
            mouseDownInCanvas = false;
        });
    drawPicture();
}

function findRect(xy) {
    tempRect.cornerX = Math.min(xy[0], firstPoint[0]);
    tempRect.cornerY = Math.min(xy[1], firstPoint[1]);
    tempRect.width = Math.abs(xy[0] - firstPoint[0]);
    tempRect.height = Math.abs(xy[1] - firstPoint[1]);
    finalRect.cornerX = tempRect.cornerX;
    finalRect.cornerY = tempRect.cornerY;
    finalRect.width = Math.min(tempRect.width, tempRect.height * ratio);
    finalRect.height = Math.min(tempRect.height, tempRect.width / ratio);
    tempRect.refreshCorners();
    finalRect.refreshCorners();
}

function drawPicture() {
    gl.useProgram(mandelProgram);
    let corners = cornersRect.corners;
    var vertices = new Float32Array([
        1.0, 1.0, corners[0], corners[1],
        -1.0, 1.0, corners[2], corners[3],
        1.0, -1.0, corners[4], corners[5],
        -1.0, -1.0, corners[6], corners[7]
    ]);


    var FSIZE = vertices.BYTES_PER_ELEMENT;
    var n = 4;

    // let vertices = new Float32Array( 4 * n);

    var vertexTexCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexTexCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    var a_Position = gl.getAttribLocation(mandelProgram, 'a_Position');
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 4, 0);
    gl.enableVertexAttribArray(a_Position);

    var a_PlotCorners = gl.getAttribLocation(mandelProgram, 'a_PlotCorners');
    gl.vertexAttribPointer(a_PlotCorners, 2, gl.FLOAT, false, FSIZE * 4, FSIZE * 2);
    gl.enableVertexAttribArray(a_PlotCorners);

    let center = gl.getUniformLocation(mandelProgram, 'center');
    gl.uniform2f(center, 0.0, 0.0);

    let zoomScale = gl.getUniformLocation(mandelProgram, 'zoomScale');
    gl.uniform1f(zoomScale, 1.0);

    let maxColor = gl.getUniformLocation(mandelProgram, 'maxColor');
    gl.uniform4f(maxColor, 0.949, 0.905, 0.250, 1.0);

    let minColor = gl.getUniformLocation(mandelProgram, 'minColor');
    gl.uniform4f(minColor, 0.043, 0.011, 0.211, 1.0);


    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
    gl.disableVertexAttribArray(a_Position);
    gl.disableVertexAttribArray(a_PlotCorners);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.deleteBuffer(vertexTexCoordBuffer);

    drawRect();

    requestAnimationFrame(drawPicture);
}

function drawRect() {
    if(!mouseDownInCanvas) {
        return;
    }
    gl.useProgram(rectProgram);

    let vertices = new Float32Array([
        (finalRect.corners[0] - cornersRect.cornerX - cornersRect.width / 2) / cornersRect.width * 2,
        (finalRect.corners[1] - cornersRect.cornerY - cornersRect.height / 2) / cornersRect.height * 2,
        (finalRect.corners[2] - cornersRect.cornerX - cornersRect.width / 2) / cornersRect.width * 2,
        (finalRect.corners[3] - cornersRect.cornerY - cornersRect.height / 2) / cornersRect.height * 2,
        (finalRect.corners[6] - cornersRect.cornerX - cornersRect.width / 2) / cornersRect.width * 2,
        (finalRect.corners[7] - cornersRect.cornerY - cornersRect.height / 2) / cornersRect.height * 2,
        (finalRect.corners[4] - cornersRect.cornerX - cornersRect.width / 2) / cornersRect.width * 2,
        (finalRect.corners[5] - cornersRect.cornerY - cornersRect.height / 2) / cornersRect.height * 2
    ]);
    console.log(vertices);

    let FSIZE = vertices.BYTES_PER_ELEMENT;

    let verticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    let a_Position = gl.getAttribLocation(rectProgram, 'a_Position');
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, true, FSIZE * 2, 0);
    gl.enableVertexAttribArray(a_Position);

    let a_PointSize = gl.getAttribLocation(rectProgram, 'a_PointSize');
    gl.vertexAttrib1f(a_PointSize, 2);

    let u_Translation = gl.getUniformLocation(rectProgram, 'u_Translation');
    gl.uniform4f(u_Translation, 0.0, 0.0, 0.0, 0.0);

    let u_FragColor = gl.getUniformLocation(rectProgram, 'u_FragColor');
    gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0); //White Lines

    gl.drawArrays(gl.LINE_LOOP, 0, 4);
    gl.disableVertexAttribArray(a_Position);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.deleteBuffer(verticesBuffer);
}

