"use strict";


var positions = [
    1, 0, 0,
    -1, 0.5, 0,
    -0.5, -1, 0
];
    
let programSpark;
let gl;

window.onload = function main() {
    const canvas = document.querySelector("#gl_canvas");
    gl = canvas.getContext("webgl2");
    if (gl === null) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }

    // Устанавливаем размер вьюпорта  
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    //включает смешивание
    gl.enable(gl.BLEND);
    //определяет взаимодействие рисуемых и уже отрисованных пикселей
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE); 

    const vs1 = getTextById('vs1');
    const fs1 = getTextById('fs1');

    //инициализация программы искр
    programSpark = initShaderProgram(vs1, fs1);
    
    var positionAttributeLocationSpark = gl.getAttribLocation(programSpark, "a_position");
    var textureLocationSpark = gl.getUniformLocation(programSpark, "u_texture");
    var pMatrixUniformLocationSpark = gl.getUniformLocation(programSpark, "u_pMatrix");
    var mvMatrixUniformLocationSpark = gl.getUniformLocation(programSpark, "u_mvMatrix");
    
    var sparks = [];
    for (var i = 0; i < Spark.sparksCount; i++) {
        sparks.push(new Spark());
    }

    // const vs2 = getTextById('vs2');
    // const fs2 = getTextById('fs2');
    // let programTrack = initShaderProgram(gl, vs2, fs2);

    // var positionAttributeLocationTrack = gl.getAttribLocation(programTrack, "a_position");
    // var colorAttributeLocationTrack = gl.getAttribLocation(programTrack, "a_color");
    // var pMatrixUniformLocationTrack = gl.getUniformLocation(programTrack, "u_pMatrix");
    // var mvMatrixUniformLocationTrack = gl.getUniformLocation(programTrack, "u_mvMatrix");

    var texture = gl.createTexture();
    var image = new Image();
    image.crossOrigin = "anonymous";
    image.src = "spark.png";
    image.addEventListener('load', function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null);
        // отрисовку сцены начинаем только после загрузки изображения
        requestAnimationFrame(drawScene);
    });
}

function drawScene() {
    gl.useProgram(programSpark);
    var colors = [];
    var positionsFromCenter = [];
    for (var i = 0; i < positions.length; i += 3) {
        // для каждой координаты добавляем точку начала координат, чтобы получить след искры
        positionsFromCenter.push(0, 0, 0);
        positionsFromCenter.push(positions[i], positions[i + 1], positions[i + 2]);
        // цвет в начале координат будет белый (горячий), а дальше будет приближаться к оранжевому
        colors.push(1, 1, 1, 0.47, 0.31, 0.24);
    }


}

function Spark() {
    this.init();
};
    // количество искр
Spark.sparksCount = 200;

Spark.prototype.init = function() {
    // время создания искры
    this.timeFromCreation = performance.now();
    // задаём направление полёта искры в градусах, от 0 до 360
    var angle = Math.random() * 360;
    // радиус - это расстояние, которое пролетит искра
    var radius = Math.random();
    // отмеряем точки на окружности - максимальные координаты искры
    this.xMax = Math.cos(angle) * radius;
    this.yMax = Math.sin(angle) * radius;
    // dx и dy - приращение искры за вызов отрисовки, то есть её скорость,
    // у каждой искры своя скорость. multiplier подбирается эмпирически
    var multiplier = 125 + Math.random() * 125;
    this.dx = this.xMax / multiplier;
    this.dy = this.yMax / multiplier;
    // Для того, чтобы не все искры начинали движение из начала координат,
    // делаем каждой искре свой отступ, но не более максимальных значений.
    this.x = (this.dx * 1000) % this.xMax;
    this.y = (this.dy * 1000) % this.yMax;
};

Spark.prototype.move = function(time) {
    // находим разницу между вызовами отрисовки, чтобы анимация работала
    // одинаково на компьютерах разной мощности
    var timeShift = time - this.timeFromCreation;
    this.timeFromCreation = time;
    // приращение зависит от времени между отрисовками
    var speed = timeShift;
    this.x += this.dx * speed;
    this.y += this.dy * speed;
    // если искра достигла конечной точки, запускаем её заново из начала координат
    if (Math.abs(this.x) > Math.abs(this.xMax) || Math.abs(this.y) > Math.abs(this.yMax)) {
    this.init();
    return;
    }
};

Spark.prototype.move = function(time) {
// находим разницу между вызовами отрисовки, чтобы анимация работала
// одинаково на компьютерах разной мощности
var timeShift = time - this.timeFromCreation;
this.timeFromCreation = time;
// приращение зависит от времени между отрисовками
var speed = timeShift;
this.x += this.dx * speed;
this.y += this.dy * speed;
// если искра достигла конечной точки, запускаем её заново из начала координат
if (Math.abs(this.x) > Math.abs(this.xMax) || Math.abs(this.y) > Math.abs(this.yMax)) {
this.init();
return;
}
};

// Функция загрузки шейдера
function loadShader(type, source) {
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

function initShaderProgram(vs, fs) {
    const vertexShader = loadShader(gl.VERTEX_SHADER, vs);
    const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fs);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.log(gl.getProgramInfoLog(shaderProgram));
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

function getTextById(id) {
    return document.getElementById(id).innerText
}