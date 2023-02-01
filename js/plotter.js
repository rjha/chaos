

   
    
    import Two from '/js/two.module.js'


    class Plotter {

        #theta = 0;
        #visible = true;
        #debug = false;
        #commands = [];
        #x_pixels = 0;
        #y_pixels = 0;
        #current = {};
        #range = {} ;
        #batchSize = 1;
        
        // two.js instance 
        #two ;
        

        constructor(config) {

            // setup an instance of two.js 
            let container = config.container || document.body; 
            let fullscreen = config.fullscreen || true ;
            let animation = config.animation || true;

            this.#two = new Two({
                fullscreen: fullscreen
            }).appendTo(container);

            
            if(animation) {
                this.#two.bind('update', this.update_frame);
            }
            
            // provide plotter reference to two.js 
            this.#two.plotter = this;

            // setup canvas size using two.js properties 
            this.#x_pixels = this.#two.width;
            this.#y_pixels = this.#two.height;

            this.#current = {
                "x": 0,
                "y": 0
            };

            this.#range = {
                "x": { "min": 0, "max": this.#two.width},
                "y": { "min": 0, "max": this.#two.height},
                "x_span": this.#two.width,
                "y_span": this.#two.height   
            }

           

        }

        // private methods 

        #moveTo(x, y) {
            
            this.#current.x = x;
            this.#current.y = y;
            
            if(this.#debug) {
                console.log("moved cursor to [%s, %s] ", x, y);
            }
            
        }

        #drawLine(point1, point2) {
            
            
            let pixel1 = this.#mapPixel(point1);
            let pixel2 = this.#mapPixel(point2);

            let line = this.#two.makeLine(pixel1.x, 
                    pixel1.y, 
                    pixel2.x, 
                    pixel2.y);
                
            line.visible = this.#visible;
            
            // Using fill sets the color inside the object 
            // and stroke sets the color of the line drawn 
            // around the object
            line.linewidth = 1; 
            line.fill = "black";
            line.stroke = "black";
            line.opacity = 1.0;  
            this.#two.add(line);
            
        }


        #drawPixel(config) {
            
            let side = config.radius || 1.0 ;
            let color = config.color || "red";
            let pixel = this.#mapPixel(this.#current);
            let square = this.#two.makeRectangle(pixel.x, pixel.y, side, side);

            // dot props
            square.fill = color;
            square.opacity = 1.0;
            // stroke will hide 
            // the color for small dots
            square.noStroke();
            
        }

        #mapPixel(point) {

            if(this.#debug) {
                console.log("map point [%s, %s]", point.x, point.y);
            }

            // out of bounds 
            if(point.x < this.#range.x.min
                || point.x > this.#range.x.max 
                || point.y < this.#range.y.min 
                || point.y > this.#range.y.max) {
                
                let message = `unable to map point [${point.x}, ${point.y}]`;
                throw new Error(message);

            }

            let x_scaled = Math.abs(point.x - this.#range.x.min) / this.#range.x_span;
            let y_scaled = Math.abs(point.y - this.#range.y.min) / this.#range.y_span;
            
            // map point to a pixel on canvas 
            let pixel = {
                "x": x_scaled * this.#x_pixels ,
                "y": this.#y_pixels - (y_scaled * this.#y_pixels)
            };

            if(this.#debug) {

                console.log("point[%s, %s] mapped to -> pixel [%s, %s]", 
                    point.x, 
                    point.y, 
                    pixel.x, 
                    pixel.y);

            }
           
            return pixel;
            
        }

        #executeCommand(command, args) {
            
            if(this.#debug) {
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
                    this.#moveTo(args.x, args.y);
                    this.#drawPixel({
                        "color": args.color,
                        "radius": args.radius 
                    });

                    break;
                
                case 'SETPOS':
                    this.#moveTo(args.x, args.y);
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

        get two() {
            return this.#two;
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
       
        // turtle commands 

        setPosition(x, y) {
            this.add(['SETPOS', {"x": x, "y": y}]);
        }

        forward(d) {
            
            // get projection of d 
            let radians = (Math.PI / 180.0) * this.#theta;
            let temp = {
                "x": this.#current.x + d * Math.cos(radians),
                "y":  this.#current.y + d * Math.sin(radians)
            }

            try {

                // assign new cursor position after 
                // drawing the line
                this.#drawLine(this.#current, temp); 
                this.#current.x = temp.x; 
                this.#current.y = temp.y;

            } catch(error) {
               // console.error(error);
            }
            
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

       // end -- turtle commands 

        showAxis() {

            let x_zero = this.#range.x.min + (this.#range.x_span / 2.0); 
            let y_zero = this.#range.y.min + (this.#range.y_span / 2.0); 

            // x-axis 
            this.#drawLine({
                "x": this.#range.x.min, "y": y_zero},{
                "x": this.#range.x.max, "y": y_zero 
            });

            // y-axis 
            this.#drawLine({
                "x": x_zero, "y": this.#range.y.min},{
                "x": x_zero, "y": this.#range.y.max
            });


        }
        
        showBox() {

            // top  
            this.#drawLine({
                "x": this.#range.x.min, "y": this.#range.y.max},{
                "x": this.#range.x.max, "y": this.#range.y.max 
            });

            // bottom  
            this.#drawLine({
                "x": this.#range.x.min, "y": this.#range.y.min},{
                "x": this.#range.x.max, "y": this.#range.y.min 
            });

            // right  
            this.#drawLine({
                "x": this.#range.x.max, "y": this.#range.y.min},{
                "x": this.#range.x.max, "y": this.#range.y.max 
            });

             // left  
             this.#drawLine({
                "x": this.#range.x.min, "y": this.#range.y.min},{
                "x": this.#range.x.min, "y": this.#range.y.max 
            });

        }

        
        bind_animation_event(event_func) {
            this.#two.bind('update', event_func);
        }
        
       

        popCommands(size) {

            for(let n = 0; n < size; n  = n +1){
           
                if(this.#commands.length == 0) {
                    return false;
                }

                let [command, args] = this.#commands.shift();
                this.#executeCommand(command, args);

            }

            return true;
            
        }

        update_frame(frameCount) {

            let remaining = this.plotter.popCommands(this.plotter.batchSize);
            if(!remaining) {
                console.log("pause PLOTTER...");
                this.plotter.pause();
            }
        }

        draw() {

            // process all the commands 
            this.popCommands(this.#commands.length);
            // update the canvas
            this.#two.update();

        }

        pause() {
            this.#two.pause();
        }

        play() {
            this.#two.play();
        }

    }
    
    export {Plotter};
    export default Plotter;
