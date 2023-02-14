

import { Complex, MutableComplex } from '/js/complex.js';

const MAX_ITER = 1000;

const JULIA_FIXED_PARAMETERS = {

  EYES: new Complex(-0.1, 0.65),
  PEACOCK_FEATHER: new Complex(0.355534, -0.337292),
  DENDRITE: new Complex(-0.835, -0.2321),
  HIGHWAY_FRACTAL: new Complex(-0.54, 0.54), 
  FLOATERS: new Complex(0.285, 0.01),
  EMBROIDERY: new Complex(-0.04, -0.684),
  MONKEY_TOY: new Complex(0.285, 0.535)

}


class Julia {

  #cz;
  constructor(args={}) {


    // default options
    const defaults = {
      "fixedParameter": new Complex(-0.1, 0.65)
    }

    // find the fixed parameter 
    const options = Object.assign(defaults, args);
    this.#cz = options.fixedParameter;

  }

  static get Parameters() {
    return JULIA_FIXED_PARAMETERS;
  }

  transform(z0) {

    let z = new MutableComplex(z0.x, z0.y);
    let n = 0;

    while(n < 1000) {
      
      z.power(2);
      z.add(this.#cz);
      
      if(Complex.isBiggerFloat(Complex.magnitude(z), 2.0)) {
        break;
      }

      n = n + 1;

    }

    return {
      "n": n, 
      "magnitude": Complex.magnitude(z)
    }
  }

}


class ComplexGrid {


    #transformer; 
    #attractor_color = "red";
    #colors = [];
    #colorsIndex = [];
    #pixels = 0;   
    #xp = 0;
    #yp = 0;
    #total = 0;

    // 4 eyes 
    // #cz = new Complex(-0.1, 0.65);

    constructor(args={}) {

       // default options
       const defaults = {
          "pixels": undefined,
          "transformer": undefined, 
          "colorsIndex": [40, 60, 90, 110, 150, 200, 300],
          "colors": [
            "black", 
            "blue",
            "yellow", 
            "orange",
            "green",
            "aqua",
            "teal",
            "navy"],
      }

      const options = Object.assign(defaults, args);
      this.#pixels = options.pixels;
      this.#colors = options.colors;
      this.#colorsIndex = options.colorsIndex;
      this.#total = 0;

    }

   
    set colors(colors=[]) {
      this.#colors = colors; 
    }

    set colorsIndex(colorsIndex=[]) {
      this.#colorsIndex = colorsIndex;
    }
    
    set transformer(transformer) {
      this.#transformer = transformer;
    }


    stop() {

      if(this.#total >= (this.#pixels * this.#pixels)) {
        return true;
      }

      return false;

    }

    
    getVerticalPoints() {
      
      let points = [];

      // get all vertical points for #xp  
      for(let yp = 0; yp < this.#pixels; yp++) {

        // map the pixel into a number 
        // in complex plane 
        let z = this.plotter.mapXY(this.#xp, yp);
        let orbit = this.#transformer.transform(z);
        let color = this.getColor(orbit.n);

        points.push({
            "x": z.x, 
            "y": z.y,
            "color": color 
          });

        this.#total = this.#total + 1;

      }

      // set for next #xp 
      this.#xp = this.#xp + 1;
      return points; 

    }

    getGridPoints(size=1) {
      
      
      let points = [];
      let num_points = 0;
      let done = false;

      // this.#yp = this.#yp % this.#pixels;
      

      while(this.#xp < this.#pixels) {

        while(this.#yp < this.#pixels) {

          // map the pixel into a number 
          // in complex plane 
          let z = this.plotter.mapXY(this.#xp, this.#yp);
          let orbit = this.#transformer(z);
          let color = this.getColor(orbit.n);
          
          points.push({
            "x": z.x, 
            "y": z.y,
            "color": color 
          });

          // increase counters
          num_points = num_points + 1;
          this.#yp = this.#yp + 1;
          this.#total = this.#total + 1;

          // break innner loop
          if(num_points >= size) {
            done = true;
            break;
          }
          
        }

        // y loop complete 
        if(this.#yp == this.#pixels) {
          // roll over y-value 
          this.#yp = 0;
          this.#xp = this.#xp + 1;
        }

        // collected points 
        // break out of x loop 
        if(done) {
          break;
        }

      }
      
      return points;

    }


    getColor(n) {

     
      let colors_size = this.#colors.length;
      if(n == MAX_ITER || colors_size == 0) {
        return this.#attractor_color;
      }

      let index = this.#colors.length -1;
      let index_size = this.#colorsIndex.length;

      // typically we get elements in colors array 
      // than in the colors index array 
      // so we loop on colors indexes 
      for(let i =0; i < index_size; i = i +1) {

        if(this.#colorsIndex[i] >= n) {
          index = i;
          break;
        }

      }

      if(index >=  this.#colors.length) {
        index = this.#colors.length - 1;
      }

      return this.#colors[index];

    }

  }


export {ComplexGrid, Julia};
export default ComplexGrid;
