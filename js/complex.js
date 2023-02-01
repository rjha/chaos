

class Complex {
    #x = 0;
    #y = 0;
    constructor(x, y) {
        this.#x = x;
        this.#y = y;
    }

    static magnitude(c) {
        return Math.sqrt((c.x * c.x) + (c.y * c.y));
    }

    get x() {
        return this.#x ;
    }

    get y() {
        return this.#y ;
    }

    add(c) {
        return new Complex(this.#x + c.x, this.#y + c.y);
    }

    multiply(c) {
        let x1 = (this.#x * c.x) - (this.#y * c.y);
        let y1 = (this.#x * c.y) + (this.#y * c.x);
        return new Complex(x1, y1);
    }

};

class MutableComplex {

    x = 0;
    y = 0;
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(c) {
        this.x = this.x + c.x;
        this.y = this.y + c.y;
    }

    multiply(c) {

        let x1 = (this.x * c.x) - (this.y * c.y);
        let y1 = (this.x * c.y) + (this.y * c.x);
        
        this.x = x1;
        this.y = y1;
    }

    square() {
        
        let x_temp = (this.x * this.x) - (this.y * this.y);
        this.y = (2.0 * this.x * this.y) ;
        this.x = x_temp;

    }

    power(N) {

        let r = Math.hypot(this.x, this.y);
        let n_theta = N * Math.atan2(this.y * 1.0, this.x);
        let d = Math.pow(r, N);
        
        let x_temp = d * Math.cos(n_theta);
        this.y = d * Math.sin(n_theta);
        this.x = x_temp;

    }


};


export {Complex, MutableComplex};
export default Complex;

