/* Здесь всё настраивается для шейдеров (создаются, загружаются и настраиваются связи) */
function initProgramOrange(gl) {
  return webglUtils.createProgramInfo(gl, ["vertex-shader-orange", "fragment-shader-orange"]);
}

/* Загружаем модель из файла и создаём массивы данных и задаём дополнительно цвет */
/* Взял с интернета и переделал */
async function initBuffersOrange(gl) {
const response = await fetch('./model/sphere3.obj');  
const text = await response.text();
const obj =  parseOBJ(text);

const extents = getGeometriesExtents(obj.geometries);
orange.yPos = -extents.min[1]

return obj.geometries.map(({data}) => {
    // Because data is just named arrays like this
    //
    // {
    //   position: [...],
    //   texcoord: [...],
    //   normal: [...],
    // }
    //
    // and because those names match the attributes in our vertex
    // shader we can pass it directly into `createBufferInfoFromArrays`
    // from the article "less code more fun".

    if (data.color) {
      if (data.position.length === data.color.length) {
        // it's 3. The our helper library assumes 4 so we need
        // to tell it there are only 3.
        data.color = { numComponents: 3, data: data.color };
      }
    } else {
      // there are no vertex colors so just use constant white
      data.color = { value: [1, 0.51, 0., 1] };
    }
    // create a buffer for each array by calling
    // gl.createBuffer, gl.bindBuffer, gl.bufferData
    const bufferInfo = webglUtils.createBufferInfoFromArrays(gl, data);
    return {
      bufferInfo,
    };
  });
}


function drawOrange(gl, programInfo, buffers) {
  /* Сбрасываем матрицу */
  mat4.identity(mvMatrix);

  /* Задаём значения камеры, чтоб апельсин красиво выглядил */
  mat4.lookAt(mvMatrix, [0, 2, 5], [0, 0, -50], [0,1,0]);
  /* Задаём координа апельсина */
  mat4.translate(mvMatrix, mvMatrix, [orange.xPos, orange.yPos, orange.zPos]);
  /* Вращаем на какой-то угол (управление с кнопок) */
  mat4.rotate(mvMatrix, mvMatrix, degToRad(orange.yaw), [1, 1, 0]);
  /* Заполняем матрицу нормали с помощью матрцы модели */
  mat3.normalFromMat4(nMatrix, mvMatrix);

  gl.useProgram(programInfo.programOrange.program);

  /* Заполняем unifirm - переменные в шейдер */
  webglUtils.setUniforms(programInfo.programOrange, {
      u_pMatrix: pMatrix, 
      u_mvMatrix: mvMatrix,
      u_nMatrix:nMatrix,
      u_res:[w, h]
  });

  /* Заполняем unifirm - переменные в шейдер (свет и текстуру)*/
  webglUtils.setUniforms(programInfo.programOrange, identicalUniform);

  /* С помощью этого мы рисуем апельсин */
  for (const {bufferInfo} of buffers.buffersOrange) {
    // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
    webglUtils.setBuffersAndAttributes(gl, programInfo.programOrange, bufferInfo);
    // calls gl.drawArrays or gl.drawElements
    webglUtils.drawBufferInfo(gl, bufferInfo);
  }
  /* Функция для вращения апельсина */
  animate()
}

class Orange {
  constructor(){
    /* Общий угол поворота */
    this.yaw = 0;

    /* на сколько меняем угол при нажатии */
    this.yawRate = 0;

    this.xPos = 0;
    this.yPos = 0;
    this.zPos = 0;
  }
}


var currentlyPressedKeys = {};

function handleKeyDown(event) {
  currentlyPressedKeys[event.keyCode] = true;
}

function handleKeyUp(event) {
  currentlyPressedKeys[event.keyCode] = false;
}

function handleKeys() {
  if (currentlyPressedKeys[37] || currentlyPressedKeys[65]) {
      // Left cursor key or A
      orange.yawRate = 0.1;
  } else if (currentlyPressedKeys[39] || currentlyPressedKeys[68]) {
      // Right cursor key or D
      orange.yawRate = -0.1;
  } else {
    orange.yawRate = 0;
  }
}
var lastTime = 0;
var orange = new Orange();

function animate() {
  var timeNow = new Date().getTime();
  if (lastTime != 0) {
    var elapsed = timeNow - lastTime;
    orange.yaw += orange.yawRate * elapsed;

  }
  lastTime = timeNow;
}