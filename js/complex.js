

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

        let x1 = (this.x * this.x) - (this.y * this.y);
        let y1 = (this.x * this.y) ;
        
        this.x = x1;
        this.y = 2.0 * y1;

    }

};


export {Complex, MutableComplex};
export default Complex;

