var gl;
var prog;
var info;
var buffers;
var space;
var proj;
var texture;

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
		return canvas.getContext("webgl2", { antialias: false });;
	} catch (e) {
		alert(e)
		return;
	}
}

function getShaderText(name) {
	let text = document.getElementById(name).innerText;
	return text === null ? null : text;
}

function getAttrib(gl, shader, name) {
	let res = gl.getAttribLocation(shader, name);
	if (res < 0) {
		console.log(res)
		alert('Failed getAttrib', name);
		return;
	}
	else {
		return res;
	}
}

function getShader(gl, name) {
	let shader;
	let param;
	if (name === 'vs') {
		shader = gl.createShader(gl.VERTEX_SHADER);
		param = getShaderText('vShader')
	} else if (name === 'fs') {
		shader = gl.createShader(gl.FRAGMENT_SHADER);
		param = getShaderText('fShader')
	} else {
		alert("Unknow name in getShader", name)
		return
	}

	gl.shaderSource(shader, param);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.log(gl.getShaderInfoLog(shader))
		alert('Error in getShader');
		return;
	}
	return shader;
}

function createShader(gl, canvas) {
	let VS = getShader(gl, 'vs');
	let FS = getShader(gl, 'fs');

	let shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, VS);
	gl.attachShader(shaderProgram, FS);
	gl.linkProgram(shaderProgram);
	gl.useProgram(shaderProgram);

	return shaderProgram;
}

function initShaders(gl, canvas) {
	let shaderProgram = createShader(gl, canvas);
	prog = shaderProgram;
	info = {
		prog: prog,
		vposloc: gl.getAttribLocation(prog, 'pos'),
		tmatloc: gl.getUniformLocation(prog, 'tmat'),
		projloc: gl.getUniformLocation(prog, 'proj'),
		tcolloc: gl.getUniformLocation(prog, 'tcol'),
		textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
		uSampler1: gl.getUniformLocation(shaderProgram, 'uSampler1'),
      	uSampler2: gl.getUniformLocation(shaderProgram, 'uSampler2'),
	};

	console.log(info.textureCoord)
	buffers = initBuffer(gl);
	space = initSpace();
	
	texture = {
		t1:loadTexture('wood.png'),
		t2:loadTexture('1.png')
	};

	update();
}

function loadTexture(url) {
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
		 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	  }
	};
	image.src = url;
  
	return texture;
}


function update() {
	drawScene();
	requestAnimationFrame(update);
}

function isPowerOf2(value) {
	return (value & (value - 1)) == 0;
}

function initBuffer(gl) {
	var a = 0.1;
	let p000 = [-a, -a, -a]
	let p001 = [-a, -a, +a]
	let p010 = [-a, +a, -a]
	let p011 = [-a, +a, +a]
	let p100 = [+a, -a, -a]
	let p101 = [+a, -a, +a]
	let p110 = [+a, +a, -a]
	let p111 = [+a, +a, +a]

	const pos = [
		[p101, p001, p000],
		[p100, p101, p000],
		[p001, p011, p111],
		[p001, p111, p101],
		[p011, p010, p110],
		[p011, p110, p111],
		[p000, p010, p110],
		[p000, p110, p100],
		[p000, p010, p011],
		[p000, p011, p001],
		[p110, p111, p101],
		[p110, p101, p100],
	].flat(2)


	const buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);


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

	return {
		buf: buffer,
		textureCoord: textureCoordBuffer,
		size: pos.length,
	};
}

function initCubeMat(roty, x, y, z) {
	const mat = mat4.create();
	mat4.identity(mat)
	mat4.rotateY(mat, mat, roty);
	mat[3] = x;
	mat[7] = y;
	mat[11] = z;

	return mat;
}

function initSpace() {
	proj = mat4.create();
	mat4.identity(proj)
	mat4.rotateX(proj, proj, 0.5);
	mat4.rotateY(proj, proj, 0.5);

	const d = 0.2;
	const x = 0, y = -0.2, z = 0.2;
	const c1 = initCubeMat(0.1, x - d, y - d, z);
	const c2 = initCubeMat(0.1, x, y - d, z);
	const c3 = initCubeMat(0.1, x + d, y - d, z);
	const c4 = initCubeMat(0.1, x, y, z);

	const _mat = [];
	const color = [];
	_mat.push(c1);
	color.push([1, 0, 0, 1]);

	_mat.push(c2);
	color.push([0, 1, 0, 1]);

	_mat.push(c3);
	color.push([0, 0, 1, 1]);

	_mat.push(c4);
	color.push([1, 1, 0, 1]);

	return {
		mat: _mat,
		col: color,
		size: _mat.length
	};
}

function render(tmat, tcol) {

	gl.bindBuffer(gl.ARRAY_BUFFER, buffers.buf);
	gl.vertexAttribPointer(info.vposloc, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(info.vposloc);

	gl.useProgram(info.prog);
	gl.uniformMatrix4fv(info.tmatloc, false, tmat);
	gl.uniformMatrix4fv(info.projloc, false, proj);
	gl.uniform4f(info.tcolloc, false, tcol[0], tcol[1], tcol[2], tcol[3]);

	gl.drawArrays(gl.TRIANGLES, 0, buffers.size);

	gl.bindBuffer(gl.ARRAY_BUFFER, buffers.buf);
	gl.uniform4f(info.tcolloc, false, 0.1, 0.1, 0.1, 1.0);
	gl.drawArrays(gl.LINES, 0, buffers.size);
}

function drawScene() {
	gl.clearColor(1.0, 1.0, 1.0, 1.0);
	gl.clearDepth(1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Tell WebGL how to pull out the texture coordinates from
  // the texture coordinate buffer into the textureCoord attribute.
  {
    const numComponents = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
    gl.vertexAttribPointer(
        info.textureCoord,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        info.textureCoord);
    console.log(info.textureCoord)
  }

	for (var i = 0; i < space.size; i++) {
		// console.log(i)
		render(space.mat[i], space.col[i]);
	}
}


function rotateCube(mat, roty) {
	const x = mat[3];   // mat[3] = 0;
	const y = mat[7];   // mat[7] = 0;
	const z = mat[11];  // mat[11] = 0;
	mat = mat4.rotateY(mat, roty);
	mat[3] = x;
	mat[7] = y;
	mat[11] = z;
}

function rotateCubes(roty) {
	const mat0 = space.mat[1];
	const x = mat0[3];
	const y = mat0[7];
	const z = mat0[11];
	for (var i = 0; i < space.size; i++) {
		let mat = space.mat[i];
		mat[3] -= x; mat[7] -= y; mat[11] -= z;
		mat = mat4.rotateY(mat, roty);
		mat[3] += x; mat[7] += y; mat[11] += z;
	}
}

function rotateStallone(roty) {
	for (var i = 0; i < space.size; i++) {
		let mat = space.mat[i];
		mat = mat4.rotateY(mat, roty);
	}
}

window.onkeydown = function kot_blini(event) {

	let angle = 0.2;
	if (event.code == "Digit1") {
		for (let i = 0; i < space.size; i++) {
			rotateCube(space.mat[i], angle);
		}
	}

	if (event.code == "Digit2") {
		for (let i = 0; i < space.size; i++) {
			rotateCube(space.mat[i], -angle);
		}
	}

	if (event.code == "ArrowUp") { rotateCubes(0.2);}
	if (event.code == "ArrowDown") { rotateCubes(-0.2);}

	if (event.code == "ArrowLeft") { rotateStallone(0.2); }
	if (event.code == "ArrowRight") { rotateStallone(-0.2); }
}

function main() {
	let canvas = getCanvasById("canvasGL")
	
	gl = getContext(canvas);
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	// gl.enable(gl.DEPTH_TEST);

	initShaders(gl, canvas);
}