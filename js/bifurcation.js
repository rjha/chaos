

import { Complex } from '/js/complex.js';


class Bifurcation {


  // map transformers 
  // tent x [0.5 - 1.0], y [0, 1.0]
  // quadratic x [2.0, 4.0], y[0, 1.0]
  // sine 
  // 

  #rc = 2.0;
  #rc_stop = 4.0; 
  #rc_step =  0.0001;
  #transformer;
  

  constructor(args={}) {
    
    const defaults = {
      "rc": 2.0,
      "rc_stop": 4.0,
      "rc_step" : 0.0001,
      "transformer": undefined 
    }

    // find the fixed parameter 
    const options = Object.assign(defaults, args);
    Object.freeze(options);

    this.#rc = options.rc;
    this.#rc_stop = options.rc_stop;
    this.#rc_step = options.rc_step;
    this.#transformer = options.transformer || undefined ;


  }

  // getters 

  get rc() {
    return this.#rc;
  }

  get rc_stop() {
    return this.#rc_stop;
  }

  // setters 

  set transformer(transformer_func) {
    this.#transformer = transformer_func;
  }

  set rc_step(value) {
    this.#rc_step = value;
  }
  
  // public methods 
  tent (x, r) {
    return r * (1 - 2 * Math.abs(x - 0.5));
  }

  quadratic (x, r) {
    return r * x * (1 - x);
  }

  sine(x, r) {
    return Math.sin(Math.PI * x) + r; 
  }
  
  stop () {
    if(Complex.isBiggerFloat(this.#rc, this.#rc_stop)) {
      return true;
    }

    return false;

  }


  getOrbitPoints (size=1) {

    let points = [];
    let num_points = 0;

    // collect n=size orbit points 
    while(num_points < size) {

      // start with a random point 
      // and let the orbit settle
      let x_orbit = Math.random();

      for(let n =0; n < 1000; n++) { 
        x_orbit = this.#transformer(x_orbit, this.#rc);
      }
      
      // orbit point 
      x_orbit = this.#transformer(x_orbit, this.#rc);
      points.push({
        "x": this.#rc, 
        "y": x_orbit
      });

      num_points = num_points + 1;
      this.#rc = this.#rc + this.#rc_step;

      if(this.stop()) {
        return points; 
      }

    }

    return points;

  }



}



export {Bifurcation};
export default Bifurcation;
