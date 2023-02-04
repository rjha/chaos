


import { Complex, MutableComplex } from '/js/complex.js';


const MAX_ITER = 1000;

class Julia {

    x_min = -2.0;
    x_max = 2.0 ;
    y_min = -2.0;
    y_max = 2.0;
    points = 500;
    debug = false; 

    pixels = [];
    shades = [];
    shades_index = [];
    
    attractor_color = "orange";

    colors = [
        "black", 
        "blue", 
        "red",
        "navy",
        "aqua",
        "teal",
        "yellow",
        "green"]; 
      
    // 4 eyes pattern 
    cz = new Complex(-0.1, 0.65); 
    
    setXRange(x_min, x_max) {
      this.x_min = x_min;
      this.x_max = x_max;
      this.plotter.setXRange(x_min, x_max); 

    }

    setYRange(y_min, y_max) {
      this.y_min = y_min;
      this.y_max = y_max;
      this.plotter.setYRange(y_min, y_max);
    }

    setGridSize(points) {
      this.points = points;
    }

    setFixedParameter(x, y) {
      this.cz = new Complex(x, y);
    }

    
    render() {
        
        // init shades 
        // for every possible value of n 
        for(let i =0 ; i <= MAX_ITER; i++) {
            this.shades[i] = 0;
        }


        for(let xp = 0; xp < this.points; xp = xp + 1) {
            for(let yp = 0; yp < this.points; yp = yp + 1) {

                // map the pixel into a number 
                // in complex plane 
                let z = this.#mapPixel(xp, yp);
                let result = this.#transform(z);
                
                this.pixels.push({
                    "x": z.x,
                    "y": z.y,
                    "shade": result.n 
                });

                // one more point for this shade
                this.shades[result.n] = this.shades[result.n] + 1; 
            
         }

        }

        // process shades 
        this.#processShades();

        let num_points = this.pixels.length;

        for(let i =0; i < num_points; i = i +1) {

            let pixel = this.pixels[i];
            this.plotter.add(['DOT', {
                    "x": pixel.x, 
                    "y": pixel.y,
                    "radius": 1.0,
                    "color": this.#getColor(pixel.shade) 
                }]);

        }

    }
    
    // private methods 
    #getColor(n) {

      if(n == MAX_ITER) {
        return this.attractor_color;
      }

      let colors_size = this.colors.length;
      for(let i =0; i < colors_size; i = i +1) {

        if(this.shades_index[i] >= n) {
          return this.colors[i]; 
        }

      }

      return this.colors[colors_size - 1];

    }

    #mapPixel(xp, yp) {

      let x_range = Math.abs(this.x_max - this.x_min);
      let y_range = Math.abs(this.y_max - this.y_min);

      let xc = this.x_min + ((xp / this.points) *  x_range);
      let yc = this.y_min + ((yp / this.points) *  y_range);

      return {
        "x": xc,
        "y": yc
      }

    }

    #transform(z0) {

      let z = new MutableComplex(z0.x, z0.y);
      let n = 0;

      while(n < 1000) {
        
        z.square();
        z.add(this.cz);
        
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

    #processShades() {

        let shades_size = this.shades.length; 
        let bucket_points = 0;

        for(let i = 0; i < shades_size; i++) {
            bucket_points = bucket_points + this.shades[i];
        }

        if(this.debug) {
            console.log("#bucket points -> %d", bucket_points);
        }

        let slice = Math.ceil(bucket_points / 64);

        let buckets = [slice *60, 
            slice , 
            slice * 0.5, 
            slice * 0.5, 
            slice * 0.5, 
            slice * 0.5, 
            slice * 0.5, 
            slice * 0.5];
        
        if(this.debug) {
            console.log("buckets -> %O", buckets);
        }

        
        let loop_total = 0;
        let bucket_num = 0;

        for(let i = 0 ;  i < shades_size; i= i +1) {

            loop_total = loop_total + this.shades[i]; 
            if( loop_total > buckets[bucket_num]) {
                this.shades_index.push(i);
                if(this.debug) {
                    console.log("push -> n=%d, @total=%d", i, loop_total);
                }

                loop_total = 0;
                bucket_num = bucket_num + 1;
            }

        }

    }


  }


export {Julia};
export default Julia;

