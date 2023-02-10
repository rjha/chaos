

   
    
    import Two from '/js/two.module.js'
    
    const Errors = {

        INTERNAL: 100,
        EMPTY_QUEUE: 101,
        UNKNOWN_COMMAND: 102,
        OK: 200, 
        MOVE: 201,
        CREATE_DOT: 202,
        PIXEL_MAPPING: 203,
        TILE_DOT: 204 

    }

    Object.freeze(Errors);

    class  PlotterError extends Error {

        code = Errors.INTERNAL;

        constructor(message, code) {
            super(message);
            this.name = 'PlotterError';
            this.code = code 
        }

    }
    

    const PLOTTER_COMMANDS = [
        'DOT', 
        'FD', 
        'LT', 
        'RT', 
        'PU', 
        'PD', 
        'SETPOS',
        'TDOT'];
    
    
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
        tiles =[]; 
        tilesIndex = 0;

        constructor(args ={}) {

            // default options for two.js canvas
            const defaults = {
                "container": document.body,
                "fullscreen": true, 
                "overdraw": false,
                "type": Two.Types.canvas,
                "tiles": {
                    "total": 0
                }
            }


            const options = Object.assign(defaults, args);
            console.log("plotter options: %O", options);
            
            if(options.overdraw && (options.tiles <= 0)) {
                throw new Error("canvas overdraw requires tiles!");
            }

            this.#two = new Two(options).appendTo(options.container)
            // bind plotter reference to two.js instance
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

            // create tiles
            let tile_size = options.tiles.size || 1;
            for(let i =0; i < options.tiles.total; i++) {
                let shape = this.#two.makeRectangle(0, 0, tile_size, tile_size);
                shape.opacity = 1.0;
                this.tiles.push(shape);
            }

            this.tilesIndex = 0;


        }

        // private methods 
        // drawing primitives 
        #moveCursor(x, y) {
            
            if(isNaN(x) || isNaN(y)) {
                let message = `moveTo() failed, [x= ${x}, y= ${y}]`;
                throw new PlotterError(message, Errors.MOVE);
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
            
            // nothing in queue 
            // the caller should have done the check 
            // throw error!  
            if(this.#commands.length == 0) {
                throw new PlotterError("command queue empty", Erros.EMPTY_QUEUE);
            }

            let [name, args] = this.#commands.shift();
            if(this.#debug) {
                console.log("pop command %s, args [%O]", name, args);
            }
            
            switch(name) {

                case 'FD':
                    this.#forward(args);
                    break;
                case 'LT':
                    this.#left(args);
                    break;
                case 'RT':
                    this.#right(args);
                    break;
                case 'PU':
                    this.#penUp();
                    break;
                case 'PD': 
                    this.#penDown();
                    break;
                
                case 'DOT': 
                    this.#createDot(args);
                    break;

                case 'TDOT': 
                    this.#tileDot(args);
                    break;

                case 'SETPOS':
                    this.#moveCursor(args.x, args.y);
                    break; 

                default:
                    let message = `unknown command ${name}`;
                    throw new PlotterError(message, Errors.UNKNOWN_COMMAND);
            }

        }

        // command methods 
        #createDot (args = {}) {

            // x, y check 
            if(isNaN(args.x) || isNaN(args.y)) {
                let message = `#createDot() failed, [x= ${args.x}, y= ${args.y}]`;
                throw new PlotterError(message, Errors.CREATE_DOT);
            }

            // merge defaul config 
            const defaults = {
                "color": "black",
                "radius": 1.0
            }

            const options = Object.assign(defaults, args);

            if(this.debug) {
                console.log("createDot() options: %O", options);
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


        #tileDot (args={}) {

             // x, y check 
             if(isNaN(args.x) || isNaN(args.y)) {
                let message = `#tileDot() failed, [x= ${args.x}, y= ${args.y}]`;
                throw new PlotterError(message, Errors.TILE_DOT);
            }

            // merge defaul config 
            const defaults = {
                "color": "black"
            }

            const options = Object.assign(defaults, args);

            if(this.debug) {
                console.log("tileDot() options: %O", options);
            }

            let tiles_size = this.tiles.length;
            let pixel = this.mapPixel({"x": options.x, "y": options.y});

            // move the tile 
            this.tiles[this.tilesIndex].position.x = pixel.x;
            this.tiles[this.tilesIndex].position.y = pixel.y;
            this.tiles[this.tilesIndex].fill = options.color;
            this.tiles[this.tilesIndex].noStroke();

            this.tilesIndex = this.tilesIndex + 1;
            this.tilesIndex = this.tilesIndex % tiles_size;


        }


        #forward(d) {
            
            // get projection of d 
            let radians = (Math.PI / 180.0) * this.#theta;
            let next = {
                "x": this.#cursor.x + d * Math.cos(radians),
                "y":  this.#cursor.y + d * Math.sin(radians)
            }

            // assign new cursor position after 
            // drawing the line
            this.#drawLine(this.#cursor, next); 
            this.#cursor.x = next.x; 
            this.#cursor.y = next.y;

        }
        
        #right(angle) {
            this.#theta = (this.#theta - angle + 360) % 360;
        }
    
        #left(angle) {
            this.#theta = (this.#theta + angle + 360) % 360;
        }

        
        #penUp() {
            this.#visible = false;
        }

        #penDown() {
            this.#visible = true;
        }


        // getters
        static get ERRORS() {
            return Errors;
        }

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

        get debug() {
            return this.#debug;
        }

        // get plotter resolutin in pixels 
        get resolution() {

            return {
                "x": this.#x_pixels,
                "y": this.#y_pixels
            }

        }

        // setters
        set debug(value) {
            this.#debug = value;
        }

        set batchSize(size) {
            this.#batchSize = size;
        }

        // -----------------------------------
        // public methods 
        // -----------------------------------

        // set resolution in pixels
        setResolution(xp, yp) {

            if(arguments.length < 2) {
                throw new Error("setResolution() requires two arguments");
            }

            if (isNaN(xp) || isNaN(yp)) {
                throw new Error("setResolution() arguments must be numbers");
            }

            /*
            @todo 
            if(xp > this.#two.width || yp > this.#two.height) {
                let message = `resolution exceeds canvas pixels [${this.#x_pixels}, ${this.#y_pixels}]`;
                throw new Error(message);
            } */ 
            
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

       

        setPosition(x, y) {
            this.add(['SETPOS', {"x": x, "y": y}]);
        }


        // given a point with x,y coordinates 
        // return the pixel 
        mapPixel(point={}) {

            if(isNaN(point.x) || isNaN(point.y)) {
                let message = `mapPixel(): bad point [x= ${point.x}, y= ${point.y}]`;
                throw new PlotterError(message, Errors.PIXEL_MAPPING);
            }

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
                throw new PlotterError(message, Errors.PIXEL_MAPPING);

            }

            let x_scaled = Math.abs(point.x - this.#range.x.min) / this.#range.x_span;
            let y_scaled = Math.abs(point.y - this.#range.y.min) / this.#range.y_span;
            
            if(isNaN(x_scaled) || isNaN(y_scaled)) {
                let message = `mapPixel(): failed, scaled [x= ${x_scaled}, y= ${y_scaled}]`;
                throw new PlotterError(message, Errors.PIXEL_MAPPING);
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
                throw new PlotterError(message, Errors.PIXEL_MAPPING);
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
        
        // given a pixel  
        // return a point with x,y co-ordinates
        mapXY(xp, yp) {

            let x_range = Math.abs(this.#range.x.max - this.#range.x.min);
            let y_range = Math.abs(this.#range.y.max  - this.#range.y.min);
            
            // xc,yc in complex plane 
            let xc = this.#range.x.min + ((xp / this.#x_pixels) *  x_range);
            let yc = this.#range.y.min + ((yp / this.#y_pixels) *  y_range);
      
            return {
              "x": xc,
              "y": yc
            }
      
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
            
            for(let i=0; i < size; i = i+1) {
                this.#popCommand();
            }

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

            try {

                this.plotter.execute(this.plotter.batchSize);

            } catch(error) {

                if(this.plotter.debug) {
                    console.error(error);
                }

                let code = error.code; 

                // pause for low level errors
                if(code < Errors.OK) {
                    this.plotter.pause();
                    console.log("code: %d, pause PLOTTER...", code);
                    return;
                }

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
