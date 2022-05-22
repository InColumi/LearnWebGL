var identicalUniform;
let w, h;

window.onload = async function main() {
  const canvas = document.querySelector('#canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  if (!gl) {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
    return;
  }

  /* Запоминаем размер окна и устанавливаем canvas на весь экран */
  w = canvas.width = window.innerWidth
  h = canvas.height = window.innerHeight

  /* Событие при изменении размера экрана */
  window.addEventListener('resize', function() {
    const canvas = document.querySelector('#canvas');
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    gl.viewport(0, 0, w, h);
  })

  /* Добавляем свои события при нажатии клавиш (чтобы кручить модель) */
  document.onkeydown = handleKeyDown;
  document.onkeyup = handleKeyUp;

  const programInfo = {
    programOrange: initProgramOrange(gl),
  }

  /* Загружаем текстуру */
  const collectionTextures = [
    loadTexture(gl, "1.png")
  ]

  /* Создаём буферы */
  const buffers = {
    buffersOrange: await initBuffersOrange(gl),
  }

  function render(now) {
    /* Функция для проверки нажатия кнопок */
    handleKeys();

    drawScene(gl, programInfo, buffers, collectionTextures);
    
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

/* Функция для загрузки текстуры */
function loadTexture(gl, url) {
    var texture = gl.createTexture();
    var image = new Image();
    image.src = url;
    image.addEventListener('load', function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null);
    });
    return texture
}

/* Создаём матрицы для камеры, модели и нормали соответственно */
var pMatrix = mat4.create();
var mvMatrix = mat4.create();
var nMatrix = mat3.create();

function drawScene(gl, programInfo, buffers, collectionTextures) {
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  /* Задаём матрицу дл камеры */
  const fieldOfView = degToRad(45);   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  mat4.perspective(pMatrix,
      fieldOfView,
      aspect,
      zNear,
      zFar);

  /* Добавляем в переменную настройки для света и текстуры */
  identicalUniform = {
      "lights.ambient": [0.2, 0.2, 0.2],
      "lights.position": [-2, 2, -1],
      "lights.diffuse": [0.7, 0.7, 0.7],
      "lights.specular": [0.9, 0.9, 0.9],
      "u_texture": collectionTextures[0],
    }
  /* Вызываем функцию для отрисовки апельсина */
  drawOrange(gl, programInfo, buffers);
}

/* Вспомогательная функция для вычисления градуса */
function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

