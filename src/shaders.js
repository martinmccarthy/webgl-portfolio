export function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(`Error compiling shader: ${gl.getShaderInfoLog(shader)}`);
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }
  
  export function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  
    if (!vertexShader || !fragmentShader) return null;
  
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(`Error linking program: ${gl.getProgramInfoLog(program)}`);
      gl.deleteProgram(program);
      return null;
    }
    return program;
  }
  
  // Vertex Shader
  export const vertexShaderSource = `
  attribute vec3 aPosition;
  attribute vec3 aNormal;
  attribute vec2 aTexCoord;
  
  uniform mat4 uProjectionMatrix;
  uniform mat4 uViewMatrix;
  
  varying vec3 vFragPos;
  varying vec3 vNormal;
  varying vec2 vTexCoord;
  
  void main() {
    gl_Position = uProjectionMatrix * uViewMatrix * vec4(aPosition, 1.0);
    vFragPos = aPosition;
    vNormal = aNormal; // Pass the normal to the fragment shader
    vTexCoord = aTexCoord;
  }
  `;
  
  
  
  export const fragmentShaderSource = `
  precision mediump float;
  
  uniform vec3 uLightPos;
  uniform vec3 uLightColor;
  uniform vec3 uObjectColor;
  uniform bool uUseTexture;
  uniform sampler2D uTexture;
  
  varying vec3 vFragPos;
  varying vec3 vNormal;
  varying vec2 vTexCoord;
  
  void main() {
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(uLightPos - vFragPos);
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * uLightColor;
    vec3 ambient = 0.2 * uLightColor;
  
    vec3 lighting = ambient + diffuse;
  
    if (uUseTexture) {
      vec4 texColor = texture2D(uTexture, vTexCoord);
      gl_FragColor = vec4(texColor.rgb * lighting, texColor.a);
    } else {
      gl_FragColor = vec4(uObjectColor * lighting, 1.0);
    }
  }
  `;
  