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
		textureCoord: gl.getAttribLocation(shaderProgram, 'a_texcoord'),
		uSampler1: gl.getUniformLocation(shaderProgram, 'uSampler1'),
      	uSampler2: gl.getUniformLocation(shaderProgram, 'uSampler2'),
	};

	texture = {
		wood:loadTexture('wood.png'),
		one:loadTexture('1.png'),
		two:loadTexture('2.png'),
		three:loadTexture('3.png')
	};
	gl.enable(gl.DEPTH_TEST);
	buffers = initBuffer(gl);
	space = initSpace();
	console.log(space)
	update();
}

function loadTexture(url) {
	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(
		gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0,
		gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255])
	);

	const image = new Image();
	image.crossOrigin = "anonymous";
	image.onload = function loadTex(){
		gl.bindTexture(gl.TEXTURE_2D, texture);
    	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  	};

	image.src = url;
	return texture;
}


function update() {
	drawScene();
	requestAnimationFrame(update);
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

	const tx00 = [1,0], tx01 = [0,0];
	const tx10 = [1, 1], tx11 = [0,1];
	const tx0 = [tx00, tx10, tx11];
	const tx1 = [tx00, tx11, tx01];
	
	const txy = [
		tx0, tx1,
		tx0, tx1,
		tx0, tx1,
		tx0, tx1,
		tx0, tx1,
		tx0, tx1
	].flat(2);

	const buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);

	const textureCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(txy), gl.STATIC_DRAW);

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
	const t_wood = [];
	const t_number = [];
	_mat.push(c1);
	color.push([1, 0, 0, 1]);
	t_wood.push(texture.wood);
	t_number.push(texture.two);

	_mat.push(c2);
	color.push([0, 1, 0, 1]);
	t_wood.push(texture.wood);
	t_number.push(texture.wood);

	_mat.push(c3);
	color.push([0, 0, 1, 1]);
	t_wood.push(texture.wood);
	t_number.push(texture.three);

	_mat.push(c4);
	color.push([1, 1, 0, 1]);
	t_wood.push(texture.wood);
	t_number.push(texture.one);


	return {
		mat: _mat,
		col: color,
		t_wood: t_wood,
		t_number: t_number,
		size: _mat.length
	};
}

function render(tmat, tcol, t1, t2) {
	gl.bindBuffer(gl.ARRAY_BUFFER, buffers.buf);
	gl.vertexAttribPointer(info.vposloc, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(info.vposloc);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
    gl.vertexAttribPointer(info.textureCoord, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(info.textureCoord);
	
	gl.useProgram(info.prog);

	gl.uniformMatrix4fv(info.tmatloc, false, tmat);
	gl.uniformMatrix4fv(info.projloc, false, proj);
	gl.uniform4f(info.tcolloc, false, tcol[0], tcol[1], tcol[2], tcol[3]);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, t1);
	gl.uniform1i(info.uSampler1,  0);

	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, t2);
	gl.uniform1i(info.uSampler2,  1);

	gl.drawArrays(gl.TRIANGLES, 0, buffers.size);
}

function drawScene() {
	gl.clearColor(0.96, 0.87, 0.7, 1.0);
	gl.clearDepth(1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	for (var i = 0; i < space.size; i++) {
		console.log(space.mat[i])
		render(space.mat[i], space.col[i], space.t_wood[i], space.t_number[i]);
	}
}


function rotateCube(mat, roty) {
	const x = mat[3];   // mat[3] = 0;
	const y = mat[7];   // mat[7] = 0;
	const z = mat[11];  // mat[11] = 0;
	mat4.rotateY(mat, mat, roty);
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
		mat4.rotateY(mat, mat, roty);
		mat[3] += x; mat[7] += y; mat[11] += z;
	}
}

function rotateStallone(roty) {
	for (var i = 0; i < space.size; i++) {
		let mat = space.mat[i];
		mat4.rotateY(mat, mat, roty);
	}
}

window.onkeydown = function kot_blini(event) {

	let angle = 0.2;
	if (event.code == "Digit1") {
		for (let i = 0; i < space.size; i++) {
			let mat = space.mat[i];
			console.log(mat)
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
	gl.enable(gl.DEPTH_TEST);
	initShaders(gl, canvas);
}