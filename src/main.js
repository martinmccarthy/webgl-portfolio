import { load } from '@loaders.gl/core';
import { GLTFLoader } from '@loaders.gl/gltf';
import { createProgram, vertexShaderSource, fragmentShaderSource } from './shaders.js';
import { mat4 } from 'gl-matrix';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

if (!gl) {
  console.error('WebGL not supported');
}

const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
if (!program) {
  console.error('Failed to initialize shaders');
}

gl.useProgram(program);

const projectionMatrix = mat4.create();
mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 100);
const projectionLocation = gl.getUniformLocation(program, 'uProjectionMatrix');
gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);

const uLightPos = gl.getUniformLocation(program, 'uLightPos');
const uLightColor = gl.getUniformLocation(program, 'uLightColor');
const uObjectColor = gl.getUniformLocation(program, 'uObjectColor');
gl.uniform3f(uLightPos, 0.0, 1.0, 0.0);
gl.uniform3f(uLightColor, 1.0, 1.0, 1.0);
gl.uniform3f(uObjectColor, 1.0, 1.0, 1.0);

const planeVertices = new Float32Array([
  -1, 0, -1, 0, 1, 0, 0, 0,
   1, 0, -1, 0, 1, 0, 1, 0,
   1, 0,  1, 0, 1, 0, 1, 1,
  -1, 0,  1, 0, 1, 0, 0, 1,
]);

const planeIndices = new Uint16Array([
  0, 1, 2,
  2, 3, 0,
]);

const wallVertices = new Float32Array([
  -1, 0, -1,  0, 0, 1, 0, 0,
  -1, 1, -1,  0, 0, 1, 0, 1,
   1, 1, -1,  0, 0, 1, 1, 1,
   1, 0, -1,  0, 0, 1, 1, 0,

   1, 0, -1, -1, 0, 0, 0, 0,
   1, 1, -1, -1, 0, 0, 0, 1,
   1, 1,  1, -1, 0, 0, 1, 1,
   1, 0,  1, -1, 0, 0, 1, 0,

   1, 0,  1,  0, 0, -1, 0, 0,
   1, 1,  1,  0, 0, -1, 0, 1,
  -1, 1,  1,  0, 0, -1, 1, 1,
  -1, 0,  1,  0, 0, -1, 1, 0,

  -1, 0,  1,  1, 0, 0, 0, 0,
  -1, 1,  1,  1, 0, 0, 0, 1,
  -1, 1, -1,  1, 0, 0, 1, 1,
  -1, 0, -1,  1, 0, 0, 1, 0,
]);

const wallIndices = new Uint16Array([
  0, 1, 2, 2, 3, 0,
  4, 5, 6, 6, 7, 4,
  8, 9, 10, 10, 11, 8,
  12, 13, 14, 14, 15, 12,
]);

const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, planeVertices, gl.STATIC_DRAW);

const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, planeIndices, gl.STATIC_DRAW);

const wallVertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, wallVertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, wallVertices, gl.STATIC_DRAW);

const wallIndexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wallIndexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, wallIndices, gl.STATIC_DRAW);

const texture = gl.createTexture();
const textureImage = new Image();
textureImage.src = './imgs/wood-floor.jpg';
textureImage.onload = () => {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureImage);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  render();
};

load('./models/picture_frame.glb', GLTFLoader).then((gltf) => {
  const mesh = gltf.meshes[0];
  setupFrame(mesh);
});

function setupFrame(mesh) {
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.attributes.POSITION), gl.STATIC_DRAW);

  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.attributes.NORMAL), gl.STATIC_DRAW);

  const texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.attributes.TEXCOORD_0), gl.STATIC_DRAW);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), gl.STATIC_DRAW);

  renderFrame(positionBuffer, normalBuffer, texCoordBuffer, indexBuffer, mesh.indices.length);
}

function renderFrame(positionBuffer, normalBuffer, texCoordBuffer, indexBuffer, indexCount) {
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  const aPosition = gl.getAttribLocation(program, 'aPosition');
  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aPosition);

  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  const aNormal = gl.getAttribLocation(program, 'aNormal');
  gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aNormal);

  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  const aTexCoord = gl.getAttribLocation(program, 'aTexCoord');
  gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aTexCoord);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.enable(gl.DEPTH_TEST);
  gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);
}

let cameraAngle = 0;

function render() {
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const radius = 1;
  const eyeX = Math.sin(cameraAngle) * radius;
  const eyeZ = Math.cos(cameraAngle) * radius;
  const eyeY = 0.5;

  const viewMatrix = mat4.create();
  mat4.lookAt(viewMatrix, [eyeX, eyeY, eyeZ], [0, 0.5, 0], [0, 1, 0]);
  const viewLocation = gl.getUniformLocation(program, 'uViewMatrix');
  gl.uniformMatrix4fv(viewLocation, false, viewMatrix);

  const aPosition = gl.getAttribLocation(program, 'aPosition');
  const aNormal = gl.getAttribLocation(program, 'aNormal');
  const aTexCoord = gl.getAttribLocation(program, 'aTexCoord');
  const uTexture = gl.getUniformLocation(program, 'uTexture');
  const uUseTexture = gl.getUniformLocation(program, 'uUseTexture');
  const uObjectColor = gl.getUniformLocation(program, 'uObjectColor');

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 0);
  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
  gl.enableVertexAttribArray(aNormal);
  gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 6 * Float32Array.BYTES_PER_ELEMENT);
  gl.enableVertexAttribArray(aTexCoord);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.uniform1i(uUseTexture, true);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(uTexture, 0);
  gl.drawElements(gl.TRIANGLES, planeIndices.length, gl.UNSIGNED_SHORT, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, wallVertexBuffer);
  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 0);
  gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
  gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 6 * Float32Array.BYTES_PER_ELEMENT);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wallIndexBuffer);
  gl.uniform1i(uUseTexture, false);
  gl.uniform3f(uObjectColor, 1.0, 1.0, 1.0);
  gl.drawElements(gl.TRIANGLES, wallIndices.length, gl.UNSIGNED_SHORT, 0);

  cameraAngle += 0.001;

  requestAnimationFrame(render);
}

render();
