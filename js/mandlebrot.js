


const MAX_ITER = 1000;


class Mandlebrot {

  
    #transformer; 
    #attractor_color = "red";
    #colors = [];
    #colorsIndex = [];
    #pixels = 0;   
    #xp = 0;
    #yp = 0;
    #total = 0;


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
    
    set transformer(transformer_func) {
      this.#transformer = transformer_func;
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
        let orbit = this.#transformer(z);
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


export {Mandlebrot};
export default Mandlebrot;
