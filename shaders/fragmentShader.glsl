uniform vec2 winResolution;
uniform sampler2D uTexture;

varying vec3 worldNormal;
varying vec3 eyeVector;

void main() {
  float iorRatio = 1.0/1.31;
  vec2 uv = gl_FragCoord.xy / winResolution.xy;
  vec3 normal = worldNormal;
  vec3 refractVec = refract(eyeVector, normal, iorRatio);
  
  vec4 color = texture2D(uTexture, uv + refractVec.xy);
  
  gl_FragColor = color;
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
