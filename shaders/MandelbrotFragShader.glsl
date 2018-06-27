#define maxIter (1000)
    
    precision highp float;
    
    uniform vec4 minColor;
    uniform vec4 maxColor;
    uniform vec2 center;
    uniform float zoomScale;
    
    varying vec2 v_PlotPosition;
    
    void main() {
    
        vec2 z, c;
    
        c.x = (v_PlotPosition.x - center.x) / zoomScale;
        c.y = (v_PlotPosition.y - center.y) / zoomScale;
    
        int i = 0;
        z = vec2(0, 0);
        for(int j = 0; j < maxIter; j++){
            float x = (z.x * z.x - z.y * z.y) + c.x;
            float y = (z.y * z.x + z.x * z.y) + c.y;
    
            if((x*x + y*y) > 100.0){
                i = j;
                break;
            }
            i = j + 1;
            z.x = x;
            z.y = y;
        }
    
        if(i == maxIter)
            gl_FragColor = vec4(0, 0, 0, 1);
        else
            gl_FragColor = (1.0 - float(i) / float(maxIter - 1)) * minColor + (float(i) / float(maxIter - 1)) * maxColor;
    }