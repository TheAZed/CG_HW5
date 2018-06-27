attribute vec4 a_Position;
attribute float a_PointSize;
uniform vec4 u_Translation;

void main() {
    gl_Position = a_Position + u_Translation;
    gl_PointSize = a_PointSize;
}