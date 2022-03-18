function getCanvasById(idCanvas) {
    let canvas = document.getElementById(idCanvas);

    if (canvas === null) {
        alert('canvasGL does not exist!')
        return
    }
    else {
        return canvas
    }
}

function getContext(canvas) {
    try {
        return canvas.getContext("webgl", { antialias: true });
    } catch (e) {
        alert(e)
        return;
    }
}

function getVS() {
    return 'attribute vec4 a_Position;' +
        'attribute float a_PointSize;' +
        ' void main() {\n' +
        ' gl_PointSize = a_PointSize;\n' +
        ' gl_Position = a_Position;\n' +
        ' }\n'
}

function getFS() {
    return ' precision mediump float;\n' +
        ' void main() {\n' +
        ' gl_FragColor = vec4(1.0, 0.5, 0.0, 1.0);\n' +
        ' }\n';
}

function getAttrib(gl, shader, name) {
    let res = gl.getAttribLocation(shader, name);
    if (res < 0) {
        alert('Failed getAttrib', name);
        return;
    }
    else{
        return res;
    }
}

function initShaders(gl) {
    let VS = getShader(gl, 'vs');
    let FS = getShader(gl, 'fs');

    let shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, VS);
    gl.attachShader(shaderProgram, FS);
    gl.linkProgram(shaderProgram);
    gl.useProgram(shaderProgram);

    let a_Position = getAttrib(gl, shaderProgram, 'a_Position');
    let a_PointSize = getAttrib(gl, shaderProgram, 'a_PointSize');

    gl.vertexAttrib1f(a_PointSize, 10.0);
    gl.vertexAttrib3f(a_Position, 0.0, 0.0, 0.0);
}


function getShader(gl, name) {
    let shader;
    let param;
    if (name === 'vs') {
        shader = gl.createShader(gl.VERTEX_SHADER);
        param = getVS()
    } else if (name === 'fs') {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
        param = getFS()
    } else {
        alert("Unknow name in getShader", name)
        return
    }

    gl.shaderSource(shader, param);
    gl.compileShader(shader);

    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS) === false) {
        alert('Error in getShader', gl.getShaderInfoLog(shader));
        return;
    }
    return shader;
}

function main() {
    let canvas = getCanvasById("canvasGL")
    let gl = getContext(canvas);

    initShaders(gl);

    gl.clearColor(0.5, 0.5, 0.5, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, 1);
}

