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
    'precision mediump float;\n' +
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

let gl;
let corners = new Float32Array([
    0.7, 1.2,
    -2.2,  1.2,
    0.7, -1.2,
    -2.2, -1.2
]);
let verticesData = new Float32Array([
    1.0, 1.0,
    -1.0, 1.0,
    1.0, -1.0,
    -1.0, -1.0
]);


function main() {
    var canvas = document.getElementById("webgl");
    gl = getWebGLContext(canvas, true);
    if (!gl) {
        alert("Failed at getWebGLContext");
        return;
    }

    if (!initShaders(gl, vshader_src, fshader_src)) {
        alert("Failed at initShaders");
        return;
    }

    var n = initVertexBuffers();
    // initTextures(gl, n);
}

function initVertexBuffers() {
    // 頂点座標、テクスチャ座標
    var vertices = new Float32Array([
        1.0, 1.0, 0.7, 1.2,
        -1.0, 1.0, -2.2,  1.2,
        1.0, -1.0, 0.7, -1.2,
        -1.0, -1.0, -2.2, -1.2
    ]);

    // 左右反転
//    var vertices = new Float32Array([
//            0.5, 0.5, 0.0, 1.0,
//            0.5, -0.5, 0.0, 0.0,
//            -0.5, 0.5, 1.0, 1.0,
//            -0.5, -0.5, 1.0, 0.0
//    ]);

    // 90度回転
    // var vertices = new Float32Array([
    //     0.5, 0.5, 0.0, 1.0,
    //     -0.5, 0.5, 0.0, 0.0,
    //     0.5, -0.5, 1.0, 1.0,
    //     -0.5, -0.5, 1.0, 0.0
    // ]);

    var FSIZE = vertices.BYTES_PER_ELEMENT;
    var n = 4;

    // let vertices = new Float32Array( 4 * n);

    var vertexTexCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexTexCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 4, 0);
    gl.enableVertexAttribArray(a_Position);

    var a_PlotCorners = gl.getAttribLocation(gl.program, 'a_PlotCorners');
    gl.vertexAttribPointer(a_PlotCorners, 2, gl.FLOAT, false, FSIZE * 4, FSIZE * 2);
    gl.enableVertexAttribArray(a_PlotCorners);

    let center = gl.getUniformLocation(gl.program, 'center');
    gl.uniform2f(center, 2.0, 0.0);

    let zoomScale = gl.getUniformLocation(gl.program, 'zoomScale');
    gl.uniform1f(zoomScale, 3.0);

    let maxColor = gl.getUniformLocation(gl.program, 'maxColor');
    gl.uniform4f(maxColor, 0.949, 0.905, 0.250, 1.0);

    let minColor = gl.getUniformLocation(gl.program, 'minColor');
    gl.uniform4f(minColor, 0.043, 0.011, 0.211, 1.0);


    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
    requestAnimationFrame(initVertexBuffers)
}

function initTextures(gl, n) {
    var texture = gl.createTexture();

    var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
    var img = new Image();
    img.onload = function () {
        loadTexture(gl, n, texture, u_Sampler, img);
    };
    img.src = "../resource/sky.jpg";

    return true;
}

function loadTexture(gl, n, texture, u_Sampler, img) {
    // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    //
    // gl.activeTexture(gl.TEXTURE0);
    // gl.bindTexture(gl.TEXTURE_2D, texture);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // // この2つを指定すると non-power-of-2 が可能になる
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    // gl.uniform1i(u_Sampler, 0);

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
}
