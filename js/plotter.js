

   
    import Two from 'https://cdn.skypack.dev/two.js@latest';
    

    // init two.js canvas 
    var two = new Two({
        fullscreen: true
      }).appendTo(document.body);



    // plotter class  

    class Plotter {

        #theta = 0;
        #visible = true;
        #debug = false;
        #commands = [];
        #x_pixels = 0;
        #y_pixels = 0;
        #current = {};
        #range = {} ;
        #previous = {};
        #batchSize = 1;
        

        constructor() {

            this.#x_pixels = two.width;
            this.#y_pixels = two.height;

            this.#current = {
                "x": 0,
                "y": 0
            };

            this.#previous = {
                "x": 0,
                "y": 0
            }

            this.#range = {
                "x": { "min": 0, "max": two.width},
                "y": { "min": 0, "max": two.height},
                "x_span": two.width,
                "y_span": two.height   
            }


        }

        // private methods 

        #mapPixel(point) {

            if(this.debug) {
                console.log("point [%s, %s]", point.x, point.y);
            }

            // out of bounds 
            // 
            if(point.x < this.#range.x.min
            || point.x > this.#range.x.max 
            || point.y < this.#range.y.min 
            || point.y > this.#range.y.max) {

                console.error("[%s, %s] is out of range: %O ", 
                    point.x, 
                    point.y, 
                    this.range);

                throw "out of bounds error";

            }

            let x_scaled = Math.abs(point.x - this.#range.x.min) / this.#range.x_span;
            let y_scaled = Math.abs(point.y - this.#range.y.min) / this.#range.y_span;
            
            // shift axis 
            let pixel = {
                "x": x_scaled * this.#x_pixels ,
                "y": this.#y_pixels - (y_scaled * this.#y_pixels)
            };

            if(this.debug) {
                console.log("point translated to [%O]", pixel);
            }
           
            return pixel;
            
        }

        #processCommand(command, args) {
            
            if(this.debug) {
                console.log("execute command -> %s, args [%O]", command, args);
            }
            
            switch(command) {

                case 'FD':
                    this.forward(args);
                    break;
                case 'LT':
                    this.left(args);
                    break;
                case 'RT':
                    this.right(args);
                    break;
                case 'PU':
                    this.penUp();
                    break;
                case 'PD': 
                    this.penDown();
                    break;
                
                case 'DOT': 
                    this.setPosition(args.x, args.y);
                    this.createDot({
                        "color": args.color,
                        "radius": args.radius 
                    });

                    break;

                default:
                    console.error("unimplemented command -> %s", command);

            }

        }

        // public properties 

        get range() {

            let value =  
            {
                "x": { "min": this.#range.x.min, "max": this.#range.x.max},
                "y": { "min": this.#range.y.min, "max": this.#range.y.max},
                "x_span": this.#range.x_span,
                "y_span": this.#range.y_span    
            }

            return value;
        }

        get batchSize() {
            return this.#batchSize;
        }


        // public methods 

        setPixels(xp, yp) {
            // @check 
            this.#x_pixels = xp;
            this.#y_pixels = yp;
        }

        setXRange(min, max) {
            // @todo check 
            this.#range.x.min = min;
            this.#range.x.max = max;
            this.#range.x_span = Math.abs(max - min);

        }

        setYRange(min, max) {
            // @todo check 
            this.#range.y.min = min;
            this.#range.y.max = max;
            this.#range.y_span = Math.abs(max - min);
        }

        setDebug(value) {
            this.#debug = value;
        }

        setBatchSize(size) {
            this.#batchSize = size;
        }

        add(command) {
            this.#commands.push(command);
        }
        

        run() {

            
            let n = 0;

            while(n < this.#batchSize) {

                if(this.#commands.length == 0) {
                    console.log("pause PLOTTER...");
                    two.pause();
                    return;
                }

                let [command, args] = this.#commands.shift();
                this.#processCommand(command, args);
                n = n + 1;

            }

            
            
        }
        
        forward(d) {
            
            // get projection of d 
            let radians = (Math.PI / 180.0) * this.#theta; 
            this.#previous.x = this.#current.x;
            this.#previous.y = this.#current.y;
            
            this.#current.x = this.#current.x + d * Math.cos(radians);
            this.#current.y = this.#current.x + d * Math.sin(radians);
            
            // add line object to scene 
            let pixel1 = this.#mapPixel(this.#previous);
            let pixel2 = this.#mapPixel(this.#current);

            let line = two.makeLine(pixel1.x, 
                    pixel1.y, 
                    pixel2.x, 
                    pixel2.y);

            line.visible = this.#visible;
            two.add(line);
            
            
        }
        

        right(angle) {
            this.#theta = (this.#theta - angle + 360) % 360;
        }
    
        left(angle) {
            this.#theta = (this.#theta + angle + 360) % 360;
        }

        penUp() {
            this.#visible = false;
        }

        penDown() {
            this.#visible = true;
        }

        setPosition(x, y) {

            this.#current.x = x;
            this.#current.y = y;
            if(this.debug) {
                console.log("set position -> %s, %s", x, y);
            }
            
        }

        createDot(config) {
            
            let side = config.radius || 1.0 ;
            let color = config.color || '#222222' ;

            let pixel = this.#mapPixel(this.#current);
            let square = two.makeRectangle(pixel.x, pixel.y, side, side);

            // dot props
            square.fill = color;
            square.opacity = 1.0;
            // stroke will hide 
            // the color for small dots
            square.noStroke();
            
        }

        createAxis() {

            let x_zero = this.#range.x.min + (this.#range.x_span / 2.0); 
            let y_zero = this.#range.y.min + (this.#range.y_span / 2.0); 
   
            let x1_pixel = this.#mapPixel({
                "x": this.#range.x.min,
                "y": y_zero 
            });
            
            let x2_pixel = this.#mapPixel({
                "x": this.#range.x.max,
                "y": y_zero 
            });

            let y1_pixel =  this.#mapPixel({
                "x": x_zero,
                "y": this.#range.y.min 
            });
            
            let y2_pixel =  this.#mapPixel({
                "x": x_zero,
                "y": this.#range.y.max 
            });

            
            let x_axis = two.makeLine(x1_pixel.x, 
                    x1_pixel.y, 
                    x2_pixel.x, 
                    x2_pixel.y);

            let y_axis = two.makeLine(y1_pixel.x, 
                y1_pixel.y, 
                y2_pixel.x, 
                y2_pixel.y);

            
            two.add(x_axis);
            two.add(y_axis);

        }
       
        update_frame(frameCount) {
            this.plotter.run();
        }

        draw() {
            two.play();
        }

    }

   
    // bind a plotter variable to two.js instance 
    // the frame update method will access the 
    // plotter bound to two.js instance variable 
    var plotter = new Plotter();
    two.plotter = plotter; 
    two.bind('update', plotter.update_frame);

    
    export {plotter};
    export default plotter;
