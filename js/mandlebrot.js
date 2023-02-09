


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
    
    setColors(colors) {
      this.#colors = colors; 
    }

    setColorIndex(colorIndex) {
      this.#colorIndex = colorIndex;
    }
    
    setTransformer(transformer_func) {
      this.#transformer = transformer_func;
    }

    render(xp) {
      
      let y_pixels = this.plotter.resolution.y;
      
      for(let yp = 0; yp < y_pixels; yp = yp + 1) {

        // map the pixel into a number 
        // in complex plane 
        let z = this.plotter.mapXY(xp, yp);
        let orbit = this.#transformer(z);
        let color = this.getColor(orbit.n);

        this.plotter.add(['TDOT', {
          "x": z.x, 
          "y": z.y,
          "color": color  
        }]);

          
      }

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

  }


export {Mandlebrot};
export default Mandlebrot;
