

   
    
    import Two from '/js/two.module.js'

    const PLOTTER_NO_ERROR = 0;
    const PLOTTER_NO_COMMAND_ERROR = 101;

    
    const PLOTTER_COMMANDS = [
        'DOT', 
        'FD', 
        'LT', 
        'RT', 
        'PU', 
        'PD', 
        'SETPOS'];
    
    
    class Plotter {

        #theta = 0;
        #visible = true;
        #debug = false;
        #commands = [];
        #x_pixels = 0;
        #y_pixels = 0;
        #cursor = {};
        #range = {} ;
        #batchSize = 1;
        
        // two.js instance 
        #two;
       

        constructor(config ={}) {

            // setup an instance of two.js 
            let container = config.container || document.body; 
            let fullscreen = config.fullscreen || true ;
            
            this.#two = new Two({
                fullscreen: fullscreen
            }).appendTo(container);

            
            // provide plotter reference to two.js 
            this.#two.plotter = this;

            // setup canvas size using two.js properties 
            this.#x_pixels = this.#two.width;
            this.#y_pixels = this.#two.height;

            this.#cursor = {
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
            
            if(isNaN(x) || isNaN(y)) {
                throw new Error(`moveTo() failed, [x= ${x}, y= ${y}]`);
            }

            this.#cursor.x = x;
            this.#cursor.y = y;
            
            if(this.#debug) {
                console.log("moved cursor to [%s, %s] ", x, y);
            }
            
        }

        #drawLine(point1, point2) {
            
            
            let pixel1 = this.mapPixel(point1);
            let pixel2 = this.mapPixel(point2);

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

        // pop next command from plotter queue 
        // and run it  
        #popCommand() {
            
            let error = PLOTTER_NO_ERROR;
            // nothing in queue 
            // the caller should have done the check 
            // throw error!  
            if(this.#commands.length == 0) {
                return PLOTTER_NO_COMMAND_ERROR;
            }

            let [name, args] = this.#commands.shift();
            if(this.#debug) {
                console.log("pop command %s, args [%O]", name, args);
            }
            
            switch(name) {

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
                    
                    this.createDot(args);
                    break;
                
                case 'SETPOS':
                    this.#moveTo(args.x, args.y);
                    break; 

                default:
                    console.error("unimplemented command: %s", name);

            }

            return error; 

        }

        // commands 
        createDot (args = {}) {

            // x, y check 
            if(isNaN(args.x) || isNaN(args.y)) {
                throw new Error(`createDot() failed, [x= ${args.x}, y= ${args.y}]`);
            }

            // merge defaul config 
            const defaults = {
                "color": "black",
                "radius": 1.0
            }

            const options = Object.assign(defaults, args);

            if(this.debug) {
                console.log("create dot options: %O", options);
            }

            // set z-plane cursor
            this.#cursor.x = options.x;
            this.#cursor.y = options.y;

            // pixel space 
            let pixel = this.mapPixel(this.#cursor);

            // draw the dot
            let square = this.#two.makeRectangle(
                pixel.x, 
                pixel.y, 
                options.radius, 
                options.radius);
            
            // dot props
            square.fill = options.color;
            square.opacity = 1.0;
            // stroke will hide 
            // the color for small dots
            square.noStroke();

        }


        forward(d) {
            
            // get projection of d 
            let radians = (Math.PI / 180.0) * this.#theta;
            let temp = {
                "x": this.#cursor.x + d * Math.cos(radians),
                "y":  this.#cursor.y + d * Math.sin(radians)
            }

            try {

                // assign new cursor position after 
                // drawing the line
                this.#drawLine(this.#cursor, temp); 
                this.#cursor.x = temp.x; 
                this.#cursor.y = temp.y;

            } catch(error) {
                // @todo indicate mapping errors 
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

        
        // getters 
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

        get queueSize() {
            return this.#commands.length; 
        }

        // setters

        setPixels(xp, yp) {

            // @todo check? 
            if(arguments.length < 2) {
                throw new Error("setPixels() requires two arguments");
            }

            if (isNaN(xp) || isNaN(yp)) {
                throw new Error("setPixels() arguments must be numbers");
            }

            this.#x_pixels = xp;
            this.#y_pixels = yp;

        }

        setXRange(min, max) {

            if(arguments.length < 2) {
                throw new Error("setXRange() requires two arguments");
            }

            if (isNaN(min) || isNaN(max)) {
                throw new Error("setXRange() arguments must be numbers");
            }

            this.#range.x.min = min;
            this.#range.x.max = max;
            this.#range.x_span = Math.abs(max - min);

        }

        setYRange(min, max) {

            if(arguments.length < 2) {
                throw new Error("setYRange() requires two arguments");
            }

            if (isNaN(min) || isNaN(max)) {
                throw new Error("setYRange() arguments must be numbers");
            }

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

        setPosition(x, y) {
            this.add(['SETPOS', {"x": x, "y": y}]);
        }


        // -----------------------------------
        // public methods 
        // -----------------------------------
        mapPixel(point) {

            if(this.#debug) {
                console.log("mapPixel() point [%s, %s]", point.x, point.y);
            }

            // point should be inside the 
            //  range of allowed values 
            // in the z-plane 
            if(point.x < this.#range.x.min
                || point.x > this.#range.x.max 
                || point.y < this.#range.y.min 
                || point.y > this.#range.y.max) {
                
                let message = `mapPixel(): out of range [x= ${point.x}, y= ${point.y}]`;
                throw new Error(message);

            }

            let x_scaled = Math.abs(point.x - this.#range.x.min) / this.#range.x_span;
            let y_scaled = Math.abs(point.y - this.#range.y.min) / this.#range.y_span;
            
            if(isNaN(x_scaled) || isNaN(y_scaled)) {
                let message = `mapPixel(): failed, scaled [x= ${x_scaled}, y= ${y_scaled}]`;
                throw new Error(message);
            }

            // adjust for canvas co-ordinates
            let pixel = {
                "x": x_scaled * this.#x_pixels ,
                "y": this.#y_pixels - (y_scaled * this.#y_pixels)
            };

            // mapped pixel should be in bounds 
            if(pixel.x > this.#x_pixels 
                || pixel.y > this.#y_pixels) {

                let message = `mapPixel(): pixel outside canvas [x= ${point.x}, y= ${point.y}]`;
                throw new Error(message);
            }

            // @todo integer pixels?
            // pixel.x = Math.floor(pixel.x);
            
            if(this.#debug) {

                console.log("point[%s, %s] mapped to -> pixel [%s, %s]", 
                    point.x, 
                    point.y, 
                    pixel.x, 
                    pixel.y);

            }
           
            return pixel;
            
        }
        
        // command methods 
        // add commands to plotter queue 
        add(command) {

            if(!Array.isArray(command)) {
                throw new Error("add() requires an array");
            }

            let [name, args] = command;
            if(!PLOTTER_COMMANDS.includes(name)) {
                throw new Error(`add() unknown command ${name}`);
            }

            // @todo input check 
            this.#commands.push(command);

        }

       
        // execute commands waiting in plotter 
        // queue. 
        // @size is batch size 
        // default batch size is 1
        execute(size=1) {

            let error = PLOTTER_NO_ERROR;
            
            for(let i=0; i < size; i = i+1) {

                error = this.#popCommand();
                if(error) {
                    break;
                }
            }

            return error; 

        }
        
        executeAll() {
            return this.execute(this.queueSize);
        }


        // animation methods 
        // 
        bind_animation_handler(event_handler) {
            this.#two.bind('update', event_handler);
        }
        
        
        update_handler(frameCount) {

            let error = this.plotter.execute(this.plotter.batchSize);
            if(this.plotter.debug) {
                console.log("plotter.execute() error: %d", error);
            }

            if(error == PLOTTER_NO_COMMAND_ERROR) {
                console.log("pause PLOTTER...");
                this.plotter.pause();
            }
            
        }
        
        pause() {
            this.#two.pause();
        }

        play() {
            this.#two.play();
        }

        update() {
            this.#two.update();
        }


        // --------------------------
        // utility methods 
        // ---------------------------
        // axes

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


    }
    
    export {Plotter};
    export default Plotter;
