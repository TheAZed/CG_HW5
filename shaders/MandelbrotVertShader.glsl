attribute vec4 a_Position;
attribute vec2 a_PlotCorners;
varying vec2 v_PlotPosition;

void main() {
    gl_Position = a_Position;
    v_PlotPosition = a_PlotCorners;
}