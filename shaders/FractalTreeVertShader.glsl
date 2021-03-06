precision mediump float;
attribute vec3 a_Position;
uniform float u_PointSize;

uniform mat4 u_Model;
uniform mat4 u_View;
uniform mat4 u_Projection;
        
varying vec2 v_TexCoord;
        
void main() {
    gl_Position = u_Projection * u_View * u_Model * vec4(a_Position, 1.0);
    gl_PointSize = u_PointSize;
}