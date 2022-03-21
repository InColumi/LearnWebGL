var gl;
var prog;
var info;
var buffers;
var space;
var proj;

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
		return canvas.getContext("webgl2", { antialias: true });;
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
		tcolloc: gl.getUniformLocation(prog, 'tcol')
	};

	buffers = initBuffer(gl);
	space = initSpace();

	update();
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


	const buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);

	return {
		buf: buffer,
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
}

function drawScene() {
	gl.clearColor(1.0, 1.0, 1.0, 1.0);
	gl.clearDepth(1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

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
	
	if (event.code == "Numpad4") { rotateCubes(0.2);}
	if (event.code == "Numpad6") { rotateCubes(-0.2);}

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