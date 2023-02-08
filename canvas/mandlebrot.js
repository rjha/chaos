


import { Plotter } from '/js/plotter.js';


const MAX_ITER = 1000;


class Mandlebrot {


    #plotter; 
    #transformer; 
    #attractor_color = "red";
    #colors = [
        "black", 
        "blue",
        "yellow", 
        "orange",
        "green",
        "aqua",
        "teal",
        "navy"];
    
    #colorIndex = [10, 50, 100];
    #grid_size = 500; 

    #range = {
      "x": {"min" : -2.0, "max": 2.0},
      "y": {"min": -2.0, "max": 2.0}
    }
    
    constructor() {
      this.#plotter = new Plotter({});
      this.#plotter.setXRange(this.#range.x.min, this.#range.x.max);
      this.#plotter.setYRange(this.#range.y.min, this.#range.y.max);
      this.#plotter.setPixels(this.#grid_size, this.#grid_size);

    }

    // public methods 
    setGridSize(points) {
      this.#grid_size = points;
      this.#plotter.setPixels(points, points);
    }

    setColors(colors) {
      this.#colors = colors; 
    }

    setColorIndex(colorIndex) {
      this.#colorIndex = colorIndex;
    }

    
    setRange(range) {
      this.#range = range;
      this.#plotter.setXRange(this.#range.x.min, this.#range.x.max);
      this.#plotter.setYRange(this.#range.y.min, this.#range.y.max);

    }
    
    setTransformer(transformer_func) {
      this.#transformer = transformer_func;
    }

    getPixels(xp) {
      
      let pixels = [];
      for(let yp = 0; yp < this.#grid_size; yp = yp + 1) {

        // map the pixel into a number 
        // in complex plane 
        let z = this.#mapPixel(xp, yp);
        let result = this.#transformer(z);
        let color = this.getColor(result.n);

        // map to actual x,y 
        let point = this.#plotter.mapPixel(z);

        pixels.push({
            "x": point.x,
            "y": point.y,
            "color": color
        });
          
      }

      return pixels; 

    }

    
    getColor(n) {

     
      let colors_size = this.#colors.length;
      if(n == MAX_ITER || colors_size == 0) {
        return this.#attractor_color;
      }

      let index = this.#colors.length -1;
      let index_size = this.#colorIndex.length;

      // typically we get elements in colors array 
      // than in the colors index array 
      // so we loop on colors indexes 
      for(let i =0; i < index_size; i = i +1) {

        if(this.#colorIndex[i] >= n) {
          index = i;
          break;
        }

      }

      if(index >=  this.#colors.length) {
        index = this.#colors.length - 1;
      }

      return this.#colors[index];

    }

    #mapPixel(xp, yp) {

      let range = this.#range; 
      let x_range = Math.abs(range.x.max - range.x.min);
      let y_range = Math.abs(range.y.max - range.y.min);

      let xc = range.x.min + ((xp / this.#grid_size) *  x_range);
      let yc = range.y.min + ((yp / this.#grid_size) *  y_range);

      return {
        "x": xc,
        "y": yc
      }

    }

  }


export {Mandlebrot};
export default Mandlebrot;
