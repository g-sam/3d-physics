

var gl;
function initGL(canvas) {
    try {
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}
function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }
    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }
    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }
    gl.shaderSource(shader, str);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}
var shaderProgram;
function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }
    gl.useProgram(shaderProgram);
    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
}

var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();
function mvPushMatrix() {
    var copy = mat4.create();
    mat4.set(mvMatrix, copy);
    mvMatrixStack.push(copy);
}

function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
        throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

///OUTPUTS OF BELOW FOR USE IN NEXT FUNCTION
var bodyVertexPositionBuffer;
var bodyVertexColorBuffer;
var bodyVertexIndexBuffer;
////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////

function initBuffers() {

// DRAW EACH TYPE OF BODY///////////////////////////////////////////////////////
  types.forEach(function(type) {
    var latitudeBands = 30;
    var longitudeBands = 30;
    var radius = type.radius;
    var vertexPositionData = [];
    var colorCoordData = [];

    for (var latNumber=0; latNumber <= latitudeBands; latNumber++) {
        var theta = latNumber * Math.PI / latitudeBands;
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);
        for (var longNumber=0; longNumber <= longitudeBands; longNumber++) {
            var phi = longNumber * 2 * Math.PI / longitudeBands;
            var sinPhi = Math.sin(phi);
            var cosPhi = Math.cos(phi);
            var x = cosPhi * sinTheta;
            var y = cosTheta;
            var z = sinPhi * sinTheta;

///Sphere colours defined////////////////////////////////////////
            var a = type.color[0];
            var b = type.color[1];
            var c = type.color[2];
            var d = type.color[3];
///////////////////////////////////////////////////////////////

            colorCoordData.push(a);
            colorCoordData.push(b);
            colorCoordData.push(c);
            colorCoordData.push(d);
            vertexPositionData.push(radius * x);
            vertexPositionData.push(radius * y);
            vertexPositionData.push(radius * z);
        }
    }
    var indexData = [];
    for (var latNumber=0; latNumber < latitudeBands; latNumber++) {
        for (var longNumber=0; longNumber < longitudeBands; longNumber++) {
            var first = (latNumber * (longitudeBands + 1)) + longNumber;
            var second = first + longitudeBands + 1;
            indexData.push(first);
            indexData.push(second);
            indexData.push(first + 1);
            indexData.push(second);
            indexData.push(second + 1);
            indexData.push(first + 1);
        }
    }

    bodyVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bodyVertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorCoordData), gl.STATIC_DRAW);
    ///Change this to 4 to make block colour defined above by a, b, c and d variables.
    bodyVertexColorBuffer.itemSize = 2;
    //////////////////
    bodyVertexColorBuffer.numItems = colorCoordData.length / 2;
    bodyVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bodyVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), gl.STATIC_DRAW);
    bodyVertexPositionBuffer.itemSize = 3;
    bodyVertexPositionBuffer.numItems = vertexPositionData.length / 3;
    bodyVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bodyVertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STATIC_DRAW);
    bodyVertexIndexBuffer.itemSize = 1;
    bodyVertexIndexBuffer.numItems = indexData.length;

/////////////////////////////////////////////////////////
    bodiesVertexPositionBuffer.push(bodyVertexPositionBuffer);
    bodiesVertexColorBuffer.push(bodyVertexColorBuffer);
    bodiesVertexIndexBuffer.push(bodyVertexIndexBuffer);

  })
}

/////////////////////////////////////////////////////////////////////////////

var cameraPerspective = mat4.create()
mat4.identity(cameraPerspective);

function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);


    //TODO////FOR EACH BODY TYPE OUTSIDE OF FOR EACH INSTANCE OF BODY (STORED IN BODIESVERTEXPOSITIONBUFFER)

    particles.forEach(function (particle) {
      mat4.identity(mvMatrix);

      mat4.translate(mvMatrix, [0, 0, centre])
      mat4.rotate(mvMatrix, -xTotalRotation, [0, 1, 0])
      mat4.rotate(mvMatrix, -yTotalRotation, [1, 0, 0])
      mat4.translate(mvMatrix, [0, 0, -centre]);

      mat4.translate(mvMatrix, particle.position);

      mvPushMatrix();
      mat4.rotate(mvMatrix, degToRad(rbody), particle.rotation);
      gl.bindBuffer(gl.ARRAY_BUFFER, bodiesVertexPositionBuffer[0]);
      gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, bodiesVertexPositionBuffer[0].itemSize, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, bodiesVertexColorBuffer[0]);
      gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, bodiesVertexColorBuffer[0].itemSize, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bodiesVertexIndexBuffer[0]);
      setMatrixUniforms();
      gl.drawElements(gl.TRIANGLES, bodiesVertexIndexBuffer[0].numItems, gl.UNSIGNED_SHORT, 0);
      mvPopMatrix();
    });

    gravityMasses.forEach(function (gravityMass) {
      mat4.identity(mvMatrix)

      // This works in reverse. If I want to move towards something, rotate and move back away then I do the
      // steps in reverse for the translation matrix. Move away, rotate the other way, and move in.

      mat4.translate(mvMatrix, [0, 0, centre]);
      mat4.rotate(mvMatrix, -xTotalRotation, [0, 1, 0]);
      mat4.rotate(mvMatrix, -yTotalRotation, [1, 0, 0]);
      mat4.translate(mvMatrix, [0, 0, -centre]);

      mat4.translate(mvMatrix, gravityMass.position);

      mvPushMatrix();
      mat4.rotate(mvMatrix, degToRad(rbody), gravityMass.rotation);
      gl.bindBuffer(gl.ARRAY_BUFFER, bodiesVertexPositionBuffer[2]);
      gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, bodiesVertexPositionBuffer[2].itemSize, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, bodiesVertexColorBuffer[2]);
      gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, bodiesVertexColorBuffer[2].itemSize, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bodiesVertexIndexBuffer[2]);
      setMatrixUniforms();
      gl.drawElements(gl.TRIANGLES, bodiesVertexIndexBuffer[2].numItems, gl.UNSIGNED_SHORT, 0);
      mvPopMatrix();
    });




}
