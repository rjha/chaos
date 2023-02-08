



const MAX_ITER = 1000;


class Mandlebrot {


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
    #num_points = 500; 
    #range = {
      "x": {"min" : -2.0, "max": 2.0},
      "y": {"min": -2.0, "max": 2.0}
    }
    
    
    // public methods 
    setGridPoints(points) {
      this.#num_points = points;
    }

    setColors(colors) {
      this.#colors = colors; 
    }

    setColorIndex(colorIndex) {
      this.#colorIndex = colorIndex;
    }

    setRange(range) {
      this.#range = range ;
    }
    
    setTransformer(transformer_func) {
      this.#transformer = transformer_func;
    }

    render(xp_min, xp_max, yp_min, yp_max) {
      
      let pixels = [];
      
      for(let xp = xp_min; xp < xp_max; xp = xp + 1) {
          for(let yp = yp_min; yp < yp_max; yp = yp + 1) {

              // map the pixel into a number 
              // in complex plane 
              let z = this.#mapPixel(xp, yp);
              let result = this.#transformer(z);
              let color = this.getColor(result.n);

              pixels.push({
                  "x": z.x,
                  "y": z.y,
                  "color": color
              });
          
        }

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

      let xc = range.x.min + ((xp / this.#num_points) *  x_range);
      let yc = range.y.min + ((yp / this.#num_points) *  y_range);

      return {
        "x": xc,
        "y": yc
      }

    }

  }


export {Mandlebrot};
export default Mandlebrot;
