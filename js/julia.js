


import { Complex, MutableComplex } from '/js/complex.js';


const MAX_ITER = 1000;

class Julia {

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
    
    setFixedParameter(x, y) {
      this.cz = new Complex(x, y);
    }

    
    render() {
        
        // init shades 
        // for every possible value of n 
        for(let i =0 ; i <= MAX_ITER; i++) {
            this.shades[i] = 0;
        }

        let resolution = this.plotter.resolution;

        for(let xp = 0; xp < resolution.x; xp = xp + 1) {
            for(let yp = 0; yp < resolution.y; yp = yp + 1) {

                // map the pixel into a 
                // x,y number in the complex plane 
                let z = this.plotter.mapXY(xp, yp);
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

