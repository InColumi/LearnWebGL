"use strict";

var mult = 0;
var mode = 1
var cubeRotation = 0;
var ambientLight = 0.1

var shaderProgram;
var currentProgramm;
var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var nMatrix = mat3.create();

var typeAttenuation;
var lightingModel;
var shading;
var texture;

var lightPosition = {
    x: 2,
    y: 0,
    z: -27
}

function updateShaderProgramm(vs, fs) {
    const canvas = document.querySelector("#gl_canvas");
    const gl = canvas.getContext("webgl2");
    shaderProgram = initShaderProgram(gl, vs, fs);

    currentProgramm = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
            textureCoord: gl.getAttribLocation(shaderProgram, 'inTextureCoord'),
        },
        uniformLocations: {
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uMVMatrix'),
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uPMatrix'),
            normalMatrix: gl.getUniformLocation(shaderProgram, 'uNMatrix'),

            lightPosition: gl.getUniformLocation(shaderProgram, 'uLightPosition'),
            ambientLightColor: gl.getUniformLocation(shaderProgram, 'uAmbientLightColor'),
            diffuseLightColor: gl.getUniformLocation(shaderProgram, 'uDiffuseLightColor'),
            specularLightColor: gl.getUniformLocation(shaderProgram, 'uSpecularLightColor'),

            vertexColor: gl.getUniformLocation(shaderProgram, 'aVertexColor'),

            typeAttenuation: gl.getUniformLocation(shaderProgram, 'typeAttenuation'),
            lightingModel: gl.getUniformLocation(shaderProgram, 'lightingModel'),

            uSampler1: gl.getUniformLocation(shaderProgram, 'uSampler1'),
            uSampler2: gl.getUniformLocation(shaderProgram, 'uSampler2'),
        }
    };
    console.log(currentProgramm.attribLocations.textureCoord);
}

function loadTexture(gl, url) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    // Because images have to be download over the internet
    // they might take a moment until they are ready.
    // Until then put a single pixel in the texture so we can
    // use it immediately. When the image has finished downloading
    // we'll update the texture with the contents of the image.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  width, height, border, srcFormat, srcType,
                  pixel);
  
    const image = new Image();
    image.onload = function() {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                    srcFormat, srcType, image);
  
      // WebGL1 has different requirements for power of 2 images
      // vs non power of 2 images so check if the image is a
      // power of 2 in both dimensions.
      if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
         // Yes, it's a power of 2. Generate mips.
         gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            // No, it's not a power of 2. Turn of mips and set
            // wrapping to clamp to edge
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      }
    };
    image.src = url;
  
    return texture;
}


function updateGuroShader() {
    let vs;
    let fs = getTextById('fSGuro');
    switch (typeAttenuation) {
        case 0:
            switch (lightingModel) {
                case 0:
                    vs = getTextById('vsGuro00');
                    console.log('Ламберт линейное')
                    break;
                case 1:
                    vs = getTextById('vsGuro10');
                    console.log('Фонг линейное')
                    break;
                case 2:
                    vs = getTextById('vsGuro20');
                    console.log('Блин-Фонг линейное')
                    break;
                default:
                    break;
            }
            break;
        case 1:
            switch (lightingModel) {
                case 0:
                    vs = getTextById('vsGuro01');
                    console.log('Ламберт-квадратичное')
                    break;
                case 1:
                    vs = getTextById('vsGuro11');
                    console.log('Фонг - квадратичное')
                    break;
                case 2:
                    vs = getTextById('vsGuro21');
                    console.log('Блин-Фонг квадратичное')
                    break;
                default:
                    break;
            }
            break;
        default:
            console.log(typeof typeAttenuation)
            alert('error updateGuroShader')
            break;
    }
    updateShaderProgramm(vs, fs)
}

function updatePosition(index) {
    return function (event, ui) {
        if (index == 0)
            ambientLight = ui.value / 10;
    };
}

function getLightingModel() {
    let fs;
    switch (lightingModel) {
        case 0:
            fs = getTextById('fSPhong00');
            console.log('fSPhong00')
            break;
        case 1:
            fs = getTextById('fSPhong01');
            console.log('fSPhong01')

            break;
        case 2:
            fs = getTextById('fSPhong02');
            console.log('fSPhong02')
            break;
        case 3:
            fs = getTextById('fSPhong03');
            console.log('fSPhong03')
            break;

        default:
            console.log(lightingModel);
            alert('updatePhongModel lightingModel')
            break;
    }
    return fs;
}

function getAttenuationModel() {
    let fs;
    let vs;
    switch (typeAttenuation) {
        case 0:
            vs = getTextById('vSPhong01');
            fs = getLightingModel();
            break;
        case 1:
            vs = getTextById('vSPhong11');
            fs = getLightingModel()
            break;
        default:
            console.log(typeAttenuation);
            alert('updatePhongModel typeAttenuation')
            break;
    }
    return { vs: vs, fs: fs };
}

function updatePhongModel() {
    let res = getAttenuationModel();
    updateShaderProgramm(res.vs, res.fs)
}

function updateShadingModel() {
    switch (shading) {
        case 0:
            updateGuroShader()
            console.log('shading Guro')
            break;
        case 1:
            updatePhongModel()
            console.log('shading Phong')
            break;
    }
}

function updateAttenuation(value) {
    typeAttenuation = parseInt(value);
    updateShadingModel()
}

function updatelightingModel(value) {
    lightingModel = parseInt(value);
    updateShadingModel()
}

function getTextById(id) {
    return document.getElementById(id).innerText
}

function updateShading(value) {
    shading = parseInt(value);
    updateShadingModel()
}

function getIndexById(id) {
    var e = document.getElementById(id);
    return e.selectedIndex
}

function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
  }

window.onload = function main() {
    const canvas = document.querySelector("#gl_canvas");
    const gl = canvas.getContext("webgl2");
    if (gl === null) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }

    texture = {
        t1: loadTexture(gl, 'wood.png'),
        t2: loadTexture(gl, '1.png')
    };
    
    webglLessonsUI.setupSlider("#x", { value: ambientLight * 10, slide: updatePosition(0), min: 0, max: 10, name: "Мощность фонового источника" });

    document.addEventListener('keydown', handleKeyDown, true);

    // Устанавливаем размер вьюпорта  
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable( gl.BLEND ); 
    gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    updateAttenuation(getIndexById('atenuation'));
    updatelightingModel(getIndexById('lighting'));
    updateShading(getIndexById('shading'));

    const buffers = initBuffers(gl)

    var then = 0;


    function render(now) {
        now *= 0.001;
        const deltaTime = now - then;
        then = now;
        drawScene(gl, currentProgramm, buffers, deltaTime);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

function setupLights(gl, programInfo) {
    gl.uniform3fv(programInfo.uniformLocations.lightPosition, [lightPosition.x, 0.0, lightPosition.z]);
    gl.uniform3fv(programInfo.uniformLocations.ambientLightColor, [ambientLight, ambientLight, ambientLight]);
    gl.uniform3fv(programInfo.uniformLocations.diffuseLightColor, [0.7, 0.7, 0.7]);
    gl.uniform3fv(programInfo.uniformLocations.specularLightColor, [1.0, 1.0, 1.0]);
}


// Функция загрузки шейдера
function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    // Компилируем шейдер
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    // Обрабатываем ошибки
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.log(gl.getShaderInfoLog(shader));
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function initShaderProgram(gl, vs, fs) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vs);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fs);

    const newShaderProgram = gl.createProgram();
    gl.attachShader(newShaderProgram, vertexShader);
    gl.attachShader(newShaderProgram, fragmentShader);
    gl.linkProgram(newShaderProgram);

    if (!gl.getProgramParameter(newShaderProgram, gl.LINK_STATUS)) {
        console.log(gl.getProgramInfoLog(newShaderProgram));
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(newShaderProgram));
        return null;
    }

    return newShaderProgram;
}

function initBuffers(gl) {
    const positionBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const positions = [
        // Front face
        -1.0, -1.0, 1.0,
        1.0, -1.0, 1.0,
        1.0, 1.0, 1.0,
        -1.0, 1.0, 1.0,

        // Back face
        -1.0, -1.0, -1.0,
        -1.0, 1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, -1.0, -1.0,

        // Top face
        -1.0, 1.0, -1.0,
        -1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, -1.0,

        // Bottom face
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0, 1.0,
        -1.0, -1.0, 1.0,

        // Right face
        1.0, -1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, 1.0, 1.0,
        1.0, -1.0, 1.0,

        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0, 1.0,
        -1.0, 1.0, 1.0,
        -1.0, 1.0, -1.0,
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
  
    const textureCoordinates = [
      // Front
      0.0,  0.0,
      1.0,  0.0,
      1.0,  1.0,
      0.0,  1.0,
      // Back
      0.0,  0.0,
      1.0,  0.0,
      1.0,  1.0,
      0.0,  1.0,
      // Top
      0.0,  0.0,
      1.0,  0.0,
      1.0,  1.0,
      0.0,  1.0,
      // Bottom
      0.0,  0.0,
      1.0,  0.0,
      1.0,  1.0,
      0.0,  1.0,
      // Right
      0.0,  0.0,
      1.0,  0.0,
      1.0,  1.0,
      0.0,  1.0,
      // Left
      0.0,  0.0,
      1.0,  0.0,
      1.0,  1.0,
      0.0,  1.0,
    ];
  
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
                  gl.STATIC_DRAW);

    
    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

    const vertexNormals = [
        // Front
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,

        // Back
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,

        // Top
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,

        // Bottom
        0.0, -1.0, 0.0,
        0.0, -1.0, 0.0,
        0.0, -1.0, 0.0,
        0.0, -1.0, 0.0,

        // Right
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,

        // Left
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals),
        gl.STATIC_DRAW);


    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    const indices = [
        0, 1, 2, 0, 2, 3,    // front
        4, 5, 6, 4, 6, 7,    // back
        8, 9, 10, 8, 10, 11,   // top
        12, 13, 14, 12, 14, 15,   // bottom
        16, 17, 18, 16, 18, 19,   // right
        20, 21, 22, 20, 22, 23,   // left
    ];

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices), gl.STATIC_DRAW);

    return {
        position: positionBuffer,
        normal: normalBuffer,
        textureCoord: textureCoordBuffer,
        indices: indexBuffer,
    };
}

function makeF32ArrayBuffer(gl, array) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    // Заполняем буффер массивом флоатов
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(array),
        gl.STATIC_DRAW
    );

    return buffer
}

function setupWebGL(gl) {
    // gl.clearColor(1.0, 0.89, 0.77, 1.0);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    mat4.perspective(pMatrix, 45 * Math.PI / 180,
        gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 100.0);
}

function drawScene(gl, program, buffers, time) {
    cubeRotation += mult * time;

    setupWebGL(gl)
    {
        const numComponents = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(
            program.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(program.attribLocations.vertexPosition);
        
    }
    
    {
        const numComponents = 2;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
        gl.vertexAttribPointer(
            program.attribLocations.textureCoord,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(program.attribLocations.textureCoord);
        console.log(program.attribLocations.textureCoord)
    }

    {
        const numComponents = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
        gl.vertexAttribPointer(
            program.attribLocations.vertexNormal,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(program.attribLocations.vertexNormal);
    }
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

    gl.useProgram(program.program);

    gl.uniform1i(currentProgramm.uniformLocations.uSampler1, 0);
    gl.uniform1i(currentProgramm.uniformLocations.uSampler2, 1);
  
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture.t1);
  
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture.t2);

    setupLights(gl, program)

    gl.uniform1i(program.uniformLocations.typeAttenuation, typeAttenuation)
    gl.uniform1i(program.uniformLocations.lightingModel, lightingModel)

    const shift = 2.00;
    drawCube(gl, program, [-shift, 0, 0], [1, 0, 0, 1])
    drawCube(gl, program, [shift, 0, 0], [0, 0, 1, 1])
    drawCube(gl, program, [0, 0, 0], [0, 1, 1, 1])
    drawCube(gl, program, [0, shift, 0], [0, 1, 0, 1])
}

function drawCube(gl, programInfo, translation, color) {
    const scaleDelta = 1;
    const shiftX = 2.0;
    const shiftZ = 0.0;
    mat4.identity(mvMatrix);
    mat4.lookAt(mvMatrix, [0, 5, 30], [0, 0, 0], [0, 1, 0]);
    // mat3.scale(mvMatrix, mvMatrix, [scaleDelta, scaleDelta, scaleDelta])

    if (mode == 1) {
        mat4.translate(mvMatrix, mvMatrix, [shiftX, 0.0, shiftZ]);
        mat4.translate(mvMatrix, mvMatrix, translation);
        mat4.rotate(mvMatrix, mvMatrix, cubeRotation, [0, 1, 0]);
    }
    else if (mode == 2) {
        mat4.translate(mvMatrix, mvMatrix, [shiftX, 0.0, shiftZ]);
        mat4.rotate(mvMatrix, mvMatrix, cubeRotation, [0, 1, 0]);
        mat4.translate(mvMatrix, mvMatrix, translation);
    }
    else if (mode == 3) {
        mat4.rotate(mvMatrix, mvMatrix, cubeRotation, [0, 1, 0]);
        mat4.translate(mvMatrix, mvMatrix, [shiftX, 0.0, shiftZ]);
        mat4.translate(mvMatrix, mvMatrix, translation);
    }
    else {
        alert('None mode')
    }
    mat3.normalFromMat4(nMatrix, mvMatrix);

    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        pMatrix);
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        mvMatrix);
    gl.uniformMatrix3fv(
        programInfo.uniformLocations.normalMatrix,
        false,
        nMatrix);

    gl.uniform4fv(programInfo.uniformLocations.vertexColor, color);
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

    // gl.uniform4fv(programInfo.uniformLocations.vertexColor, [0, 1, 0, 1]);
    // gl.drawElements(gl.LINES, 36, gl.UNSIGNED_SHORT, 0);
}

function handleKeyDown(e) {
    switch (e.keyCode) {
        // w
        case 87:
            lightPosition.z += -1
            console.log(lightPosition)
            break
        // s
        case 83:
            lightPosition.z += 1
            console.log(lightPosition)
            break
        // a
        case 65:
            lightPosition.x += -1
            console.log(lightPosition)
            break
        // d
        case 68:
            lightPosition.x += 1
            console.log(lightPosition)
            break
        // right arrow 
        case 39:
            mult += 1;
            break;
        // left arrow 
        case 37:
            mult += -1;
            break;
        // 1
        case 49:
            cubeRotation = 0
            mode = 1
            break;
        // 2
        case 50:
            cubeRotation = 0
            mode = 2
            break;
        // 3
        case 51:
            cubeRotation = 0
            mode = 3
            break;
    }
}