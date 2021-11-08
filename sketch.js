/**
 * Abacus
 *
 * https://gist.github.com/sixhat/5bcf3b8d159e7285e247a96c1cbf055f
 */
let bit = [];

let canvas;
let canvasCb;
let myFont;

let TEXT_SIZE_BASE = 30;
let TEXT_SIZE_COUNT = 50;

let ROW_SPACING = 150;
let activeBead = false;

let config = {
  showCount: true,
  showBase: true,
  showBaseCount: true,
  showBeadCount: true,
  showBasePowers: true,
  showBeadRowSum: true,
  base: 10,
  bits: 8,
  count: 1234,
}

function preload() {
  //myFont = loadFont('KronaOne-Regular.ttf');
  
  function _base64ToArrayBuffer(base64) {
    var binary_string = window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  }
  
	/**
	 * Load the font through a base64 encoded var to avoid
	 * issues with loading an external resource
	 */
  var rawFont = _base64ToArrayBuffer(kronaOneBase64);

  var font = opentype.parse(rawFont);
  
  /**
   * Hack to inject the base64 loaded font into the p5 font object
   */
  myFont = new p5.Font(p5.prototype.loadFont);
  myFont.font = font;
}

/**
 * Helper functions
 */
substract = function() {       
	if (config.count > 0) {
		bit[0]--;
		config.count--;
	} 
}

add = function() {       
	if (config.count < config.base ** config.bits - 1) {
		bit[0]++;
		config.count++;
	} 
}

class _p5 {
	static createCanvas() {
		canvas = createCanvas(...arguments);
		
		canvasCb = createGraphics(...arguments);
		//canvasCb.show();
		//canvasCb.style("display", "inline");
	}
	
	static pixelDensity() {
		canvasCb.pixelDensity(...arguments);
		return pixelDensity(...arguments);
	}
	
	static orbitControl() {
		canvasCb.orbitControl(...arguments);
		return orbitControl(...arguments);
	}
	
	static fillBead() { 
		let beadConfig = arguments[0];
		
		canvasCb.fill(beadConfig.bitIdx, beadConfig.beadIdx, 0); 
		return fill([...arguments].slice(1));
	}
	
	static cylinder() { canvasCb.cylinder(...arguments); return cylinder(...arguments);	}
	static torus() { canvasCb.torus(...arguments); return torus(...arguments);	}
	static fill() { canvasCb.fill(...arguments); return fill(...arguments);	}
	static noStroke() { canvasCb.noStroke(...arguments); return noStroke(...arguments);	}
	
	static push() { canvasCb.push(...arguments); return push(...arguments); }
	static pop() { canvasCb.pop(...arguments); return pop(...arguments); }
	static translate() { canvasCb.translate(...arguments); return translate(...arguments); }
	static rotateX() { canvasCb.rotateX(...arguments); return rotateX(...arguments); }
	static rotateY() { canvasCb.rotateY(...arguments); return rotateY(...arguments); }
	static rotateZ() { canvasCb.rotateZ(...arguments); return rotateZ(...arguments); }
	static scale() { canvasCb.scale(...arguments); return scale(...arguments); }
}

function getObject(mx, my) {
	if (mx > width || my > height) {
		return 0;
	}

	var gl = canvasCb.elt.getContext('webgl');
	var pix = getPixels();

	var index = 4 * ((gl.drawingBufferHeight - my) * gl.drawingBufferWidth + mx);

	/**
	 * should not happen ...
	 */
	if (typeof pix[index + 0] == 'undefined') {
		return 0;
	}
	
	var cor = color(
		pix[index + 0],
		pix[index + 1],
		pix[index + 2]
	);
  return cor;
}

/* This function loads the pixels of the color buffer canvas into an array 
		called pixels and returns them. */
function getPixels() {
	var gl = canvasCb.elt.getContext('webgl');
	var pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
	gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
	return (pixels);
}

function updateBeads() {
	/**
	 * Overflow, happens when dynamically reducing bits
	 * @todo set overflow flag 
	 */
	if (config.count >= config.base ** config.bits) {
		config.count = config.base ** config.bits - 1;
	}
	
	let bitCount = config.count;
	
	/**
   * Setup the bits according to count given
   */
  for (var i = config.bits - 1; i > -1; i--) {
    bit[i] = Math.floor(bitCount / (config.base ** i));
    
    bitCount -= bit[i] * (config.base ** i);
  }
}

function setup() {
	let params = getURLParams();

  Object.keys(config).forEach((key) => {
    (typeof params[key] != 'undefined') && (config[key] = params[key]);
  }, []);
		
	
	_p5.createCanvas(window.innerWidth - 4, window.innerHeight - 4, WEBGL);
	//_p5.createCanvas(500, 500, WEBGL);
  _p5.pixelDensity(1);
	
  textFont(myFont);
  textSize(120);  

	/**
	 * Slider controls and checkboxes
	 */
	let controlsConfig = {
		bits: { label: 'Bits', min: 1, max: 16, default: config.bits, step: 1 },
		base: { label: 'Base', min: 2, max: 16, default: config.base, step: 1 },
		count: { label: 'Count', min: 0, max: 100000, default: config.count, step: 1 },
	}
	let offsetY = 10;
	let textBox = [];
	let slider = [];
	
	Object.entries(controlsConfig).forEach(([variable, variableConfig]) => {	
		offsetY += 30;
		
		let label = createDiv(variableConfig.label);
		label.position(30, offsetY); 

		textBox[variable] = createInput('');
		textBox[variable].size(50);
		textBox[variable].parent(label);
		textBox[variable].input(
			debounce(() => {
				config[variable] = textBox[variable].value();
				slider[variable].value(textBox[variable].value());
				updateBeads();
			}, 250)
		);

		slider[variable] = createSlider(variableConfig.min, variableConfig.max, variableConfig.default, variableConfig.step);
		slider[variable].parent(label);
		slider[variable].input((event) => {
			config[variable] = slider[variable].value();
			textBox[variable].value(slider[variable].value());
			updateBeads();
		});

		textBox[variable].value(slider[variable].value());
	})
	
  /**
   * Buttons to switch on extra visualisations
   */
	controlsConfig = {
		showBase: { label: 'Base' },
		showBaseCount: { label: 'Base count' },
		showBeadCount: { label: 'Bead count' },
		showBasePowers: { label: 'Base powers' },
		showBeadRowSum: { label: 'Bead row sum' },
		showCount: { label: 'Count' },
	}
	
	let buttons = createDiv();
	buttons.position(10, 10); 
	
	let offsetX = 0;
	
	Object.entries(controlsConfig).forEach(([variable, variableConfig]) => {	
		offsetX += 100;
		
		let button = createButton(variableConfig.label).addClass('control').mouseClicked(function() {       
    	config[variable] = !config[variable];
  	});
		button.parent(buttons);
	});
	
	updateBeads();
}

function keyTyped() {
  if (key == "+") {
    add();
  } else if (key == "-") {
    substract();
  }
}

function draw() {
	let colorIdx = 0;
	let mouseObj = getObject(mouseX, mouseY);
	
	activeBead = false;
	
  background(255);
  ambientLight(60, 60, 60);
  pointLight(255, 255, 255, 0, 0, 100);

  _p5.orbitControl();
	
	/**
	 * Sync
	 */
	let camera = this._renderer._curCamera;
	canvasCb.clear();
	canvasCb.background(128,128,128);
	canvasCb.camera(
		camera.eyeX, camera.eyeY, camera.eyeZ,
		camera.centerX, camera.centerY, camera.centerZ,
		camera.upX, camera.upY, camera.upZ,
	);

  /**
   * The "engine"
   */
  for (var i = 0; i < config.bits - 1; i++) {
    if (bit[i] > config.base - 1) {
      bit[i + 1] = bit[i + 1] + 1;
      bit[i] = 0;
    }
    
    if (bit[i] < 0) {
      bit[i + 1] = bit[i + 1] - 1;
      bit[i] = config.base - 1;
    }
  }

  /**
   * Start drawing the abacus
	 *
	 * width and height of the abacus without text, try to get it 
	 * in the screen 
   */
	let height = ROW_SPACING * config.bits;
	
	// minimal space, space per bead, final cylinder piece sticking out
	let width = 120 + config.base * 45 + 40;
	
	_p5.scale(Math.min(window.innerHeight / height, window.innerWidth / width));
	
	_p5.translate(-width / 2, -height / 2, -height);
  
  /**
   * Draw generic information on the top
   */
  _p5.push();
    if (config.showCount) {
      _p5.push();
        _p5.translate(0, -150, 0);
        _p5.fill(255, 0, 0, 255);
        textSize(TEXT_SIZE_COUNT);  
        text("Count " + config.count, 0, 0);
      _p5.pop();
    }

    _p5.translate(config.base * 45 - 85, -150, 0);
    if (config.showBase) {
      _p5.push();
        _p5.fill(0, 0, 0, 255);
        textSize(TEXT_SIZE_BASE);
        text("Base " + config.base, 300, 0);
      _p5.pop();
      _p5.translate(250, 0, 0);
    }

    if (config.showBaseCount) {
      _p5.push();
        _p5.fill(0, 0, 0, 255);
        textSize(TEXT_SIZE_BASE);
        text("Base count " + (config.count.toString(config.base)), 300, 0);
      _p5.pop();
    }
  _p5.pop();

  /**
   * Draw the rows
   */
  for (var bitIdx = 0; bitIdx < config.bits; bitIdx++) {
		
		colorIdx++;
		/**
		 * Bit shifts because it is possible, using
		 * colorIdx > 7 && (colorIdx -= 7); also works
		 */
		colorIdx -= 7 * ( colorIdx >> 3 );
		
    /**
     * Draw the number of beads shifted 
     */
    if (config.showBeadCount) {
      _p5.push();
        _p5.translate(-180, 45, 0);
        _p5.fill(0);
        textSize(120);
        text(bit[bitIdx], 0, 0);
      _p5.pop();
    }

    /**
     * Draw the base count information on right side of row
     */
    _p5.push();
      _p5.translate(120 + config.base * 45 + 100, 15, 0);
    
      if (config.showBasePowers) {
        _p5.push();
          _p5.fill(0);
          textSize(TEXT_SIZE_BASE);
          text(config.base ** bitIdx, 0, 0);
        _p5.pop();
        _p5.translate(250, 0, 0);
      }
    
      if (config.showBeadRowSum) {
        _p5.push();
          _p5.fill(0);
          textSize(TEXT_SIZE_BASE);
          text(bit[bitIdx] + " x " + config.base ** bitIdx + " = " + (bit[bitIdx] * config.base ** bitIdx), 0, 0);
        _p5.pop();
      }
    _p5.pop();
    

    _p5.push();
      _p5.noStroke();
    
      /**
       * Draw the "stick" for the beads
       */
      _p5.push();
        _p5.rotateZ(PI / 2);
        _p5.translate(0, -width / 2);
			  fill(!!(colorIdx & 1) * 144, !!(colorIdx & 2) * 144, !!(colorIdx & 4) * 144);
		
        cylinder(25, width, 24, 16);
      _p5.pop();

      _p5.translate(0, 0, 0);
      _p5.rotateZ(0);
      _p5.rotateX(0);
      _p5.rotateY(PI / 2);

      /**
			 * @todo : merge blocks, lots of duplicate code here
			 *
       * Draw the "active" beads
       */
      beadIdx = 0;
			for (; beadIdx < bit[bitIdx]; beadIdx++) {
				_p5.fillBead({bitIdx, beadIdx}, !!(colorIdx & 1) * 235, !!(colorIdx & 2) * 235, !!(colorIdx & 4) * 235);
				if (mouseObj != 0 && mouseObj.levels[0] == bitIdx && mouseObj.levels[1] == beadIdx) {
					activeBead = {bitIdx, beadIdx};
					fill(255,255,255);
				} 
				
      	_p5.translate(0, 0, 45);
        _p5.torus(40, 20, 24, 16);
      }

      /**
       * Space between the active and non active beads
       */
      _p5.translate(0, 0, 120);

      /**
       * Draw the non-active beads
       */
			for (; beadIdx < config.base; beadIdx++) {
				_p5.fillBead({bitIdx, beadIdx}, !!(colorIdx & 1) * 200, !!(colorIdx & 2) * 200, !!(colorIdx & 4) * 200);
				if (mouseObj != 0 && mouseObj.levels[0] == bitIdx && mouseObj.levels[1] == beadIdx) {
					activeBead = {bitIdx, beadIdx};
					fill(255,255,255);
				} 
				
      	_p5.translate(0, 0, 45);
        _p5.torus(40, 20, 24, 16);
      }
    
    _p5.pop();
    
    /**
     * Move to new row
     */
    _p5.translate(0, ROW_SPACING, 0);

  }

}

function mouseClicked() {
  if (activeBead) {
		/**
		 * Compute the value of the bead being moved
		 */
		let value = parseInt( config.base ** activeBead.bitIdx * ( activeBead.beadIdx - bit[activeBead.bitIdx] + (activeBead.beadIdx >= bit[activeBead.bitIdx]) ) );
		
		
		//bit[activeBead.bitIdx]
		config.count += value;
		updateBeads();
  }
}

/**
 * https://www.joshwcomeau.com/snippets/javascript/debounce/
 */
const debounce = (callback, wait) => {
  let timeoutId = null;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      callback.apply(null, args);
    }, wait);
  };
}

/**
 *  https://hellogreg.github.io/woff2base/
 */
var kronaOneBase64 = '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CkJwnwZoOWePV1ZfX1ZXj2c5//8AuQAABhUH7gAmAAsAAAAHAOEAxAAAAAMAiQCyBB4FUAADAAcACwAAATMBIwMhFSEVIRUhAynj/XPjEwOV/GsDlfxrBVD7YgOa3sDe//8AFQAABzcH7gImALIAAAAHAJYBagAA//8AFQAABzcH7gImALIAAAAHAJcA/QAA//8AFQAABzcH7gImALIAAAAHAOEBBQAA//8AFQAABzcH7gImALIAAAAHAKUCPAAA//8AFQAABzcH7gImALIAAAAHAJoAgQAA//8AFQAABzcH3QImALIAAAAHANwCSgAA//8AFQAABzcH7gImALIAAAAHAOYCSgAA//8AFQAABzcH7QImALIAAAAHAKQCSgAA//8Af//rBtgH7gImAC8AAAAHAJcBiAAA//8Af//rBtgH7gImAC8AAAAHAOEBkAAA//8Af//rBtgH7gImAC8AAAAHAOIBkQAA//8Af//rBtgH7gImAC8AAAAHAK8C1gAA//8A3v//BvIH7gImABIAAAAHAOIBUAAA//8A3gAABiYH7gImAAQAAAAHAJYBTgAA//8A3gAABiYH7gImAAQAAAAHAJcA4QAA//8A3gAABiYH7gImAAQAAAAHAOEA6QAA//8A3gAABiYH7gImAAQAAAAHAOIA6gAA//8A3gAABiYH7gImAAQAAAAGAJplAP//AN4AAAYmB90CJgAEAAAABwDcAi4AAP//AN4AAAYmB+4CJgAEAAAABwDmAi4AAP//AN4AAAYmB+4CJgAEAAAABwCvAi8AAP//AHP/6weBB+4CJgAwAAAABwDhAV4AAP//AHP/6weBB+4CJgAwAAAABwDmAqMAAP//AHP97geBBi4CJgAwAAAABwCUAnUAAP//AHP/6weBB+4CJgAwAAAABwCvAqQAAP//AN0AAAckB+4CJgARAAAABwDhAWcAAP///+IAAALKB+4CJgAFAAAABwCW/yIAAP///+IAAALKB+4CJgAFAAAABwCX/rUAAP///40AAAMfB+4CJgAFAAAABwDh/r0AAP///5YAAAMWB+4CJgAFAAAABgCl9AD///8pAAADgwfuAiYABQAAAAcAmv45AAD////JAAAC4gfdAiYABQAAAAYA3AEA////lAAAAxYH7gImAAUAAAAGAOYBAP//AH4AAAItB+4CJgAFAAAABgCv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AEP/7gBEAET/7gBFAEX/7gBGAEb/7QBHAEf/7QBIAEj/7QBJAEn/7QBKAEr/7ABLAEv/7ABMAEz/7ABNAE3/7ABOAE7/6wBPAE//6wBQAFD/6wBRAFH/6wBSAFL/6gBTAFP/6gBUAFT/6gBVAFX/6gBWAFb/6QBXAFf/6QBYAFj/6QBZAFn/6ABaAFr/6ABbAFv/6ABcAFz/6ABdAF3/5wBeAF7/5wBfAF//5wBgAGD/5wBhAGH/5gBiAGL/5gBjAGP/5gBkAGT/5gBlAGX/5QBmAGb/5QBnAGf/5QBoAGj/5QBpAGn/5ABqAGr/5ABrAGv/5ABsAGz/5ABtAG3/4wBuAG7/4wBvAG//4wBwAHD/4wBxAHH/4gByAHH/4gBzAHL/4gB0AHP/4QB1AHT/4QB2AHX/4QB3AHb/4QB4AHf/4AB5AHj/4AB6AHn/4AB7AHr/4AB8AHv/3wB9AHz/3wB+AH3/3wB/AH7/3wCAAH//3gCBAID/3gCCAIH/3gCDAIL/3gCEAIP/3QCFAIT/3QCGAIX/3QCHAIb/3QCIAIf/3ACJAIj/3ACKAIn/3ACLAIr/3ACMAIv/2wCNAIz/2wCOAI3/2wCPAI7/2gCQAI//2gCRAJD/2gCSAJH/2gCTAJL/2QCUAJP/2QCVAJT/2QCWAJX/2QCXAJb/2ACYAJf/2ACZAJj/2ACaAJn/2ACbAJr/1wCcAJv/1wCdAJz/1wCeAJ3/1wCfAJ7/1gCgAJ//1gChAKD/1gCiAKH/1gCjAKL/1QCkAKP/1QClAKT/1QCmAKX/1QCnAKb/1ACoAKf/1ACpAKj/1ACqAKn/1ACrAKr/0wCsAKv/0wCtAKz/0wCuAK3/0gCvAK7/0gCwAK//0gCxALD/0gCyALH/0QCzALL/0QC0ALP/0QC1ALT/0QC2ALX/0AC3ALb/0AC4ALf/0AC5ALj/0AC6ALn/zwC7ALr/zwC8ALv/zwC9ALz/zwC+AL3/zgC/AL7/zgDAAL//zgDBAMD/zgDCAMH/zQDDAML/zQDEAMP/zQDFAMT/zQDGAMX/zADHAMb/zADIAMf/zADJAMj/ywDKAMn/ywDLAMr/ywDMAMv/ywDNAMz/ygDOAM3/ygDPAM7/ygDQAM//ygDRAND/yQDSANH/yQDTANL/yQDUANP/yQDVANT/yADWANX/yADXANb/yADYANf/yADZ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AHIAbwBuAGEAOgAgADIAMAAxADEAVgBlAHIAcwBpAG8AbgAgADEALgAwADAAMwBLAHIAbwBuAGEATwBuAGUALQBSAGUAZwB1AGwAYQByAEsAcgBvAG4AYQAgAGkAcwAgAGEAIAB0AHIAYQBkAGUAbQBhAHIAawAgAG8AZgAgAFMAbwByAGsAaQBuACAAVAB5AHAAZQAgAEMAbwAuAFkAdgBvAG4AbgBlACAAUwBjAGgAdQBlAHQAdABsAGUAcgBLAHIAbwBuAGEAIABpAHMAIABhACAAbABvAHcAIABjAG8AbgB0AHIAYQBzAHQAIABzAGUAbQBpAC0AZQB4AHQAZQBuAGQAZQBkACAAcwB0AHkAbABlACAAcwBhAG4AcwAgAHMAZQByAGkAZgAuACAASwByAG8AbgBhACAAaQBzACAAYgBvAHQAaAAgAHIAZQBhAGQAYQBiAGwAZQAgAGEAbgBkACAAZgB1AGwAbAAgAG8AZgAgAHAAZQByAHMAbwBuAGEAbABpAHQAeQAuACAASwByAG8AbgBhACAAYwBhAG4AIABiAGUAIAB1AHMAZQBkACAAZgByAG8AbQAgAHMAbQBhAGwAbAAgAHMAaQB6AGUAcwAgAHQAbwAgAGwAYQByAGcAZQByACAAZABpAHMAcABsAGEAeQAgAHMAZQB0AHQAaQBuAGcAcwAuACAASwByAG8AbgBhACAAdwBhAHMAIABpAG4AcwBwAGkAcgBlAGQAIABiAHkAIABoAGEAbgBkACAAbABlAHQAdABlAHIAaQBuAGcAIABvAG4AIABlAGEAcgBsAHkAIAAyADAAdABoACAAYwBlAG4AdAB1AHIAeQAgAFMAdwBlAGQAaQBzAGgAIABwAG8AcwB0AGUAcgBzAC4AdwB3AHcALgBzAG8AcgBrAGkAbgB0AHkAcABlAC4AYwBvAG0AdwB3AHcALgB5AHMAYwBoAC4AZABlAFQAaABpAHMAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAaQBzACAAbABpAGMAZQBuAHMAZQBkACAAdQBuAGQAZQByACAAdABoAGUAIABTAEkATAAgAE8AcABlAG4AIABGAG8AbgB0ACAATABpAGMAZQBuAHMAZQAsACAAVgBlAHIAcwBpAG8AbgAgADEALgAxAC4AIABUAGgAaQBzACAAbABpAGMAZQBuAHMAZQAgAGkAcwAgAGEAdgBhAGkAbABhAGIAbABlACAAdwBpAHQAaAAgAGEAIABGAEEAUQAgAGEAdAA6ACAAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8ARgBMAGgAdAB0AHAAOgAvAC8AcwBjAHIAaQBwAHQAcwAuAHMAaQBsAC4AbwByAGcALwBPAEYATAACAAAAAAAA/7UAMgAAAAAAAAAAAAAAAAAAAAAAAAAAAagAAAABAAIAAwAoACwAMQA2ADIARABHAEsASABWAEwAUgBRACsAJwBNAEUAVQBXAE8ASgBOAFAASQBGAFMAVABYAFkAWgBbAF0AXAApAC8ANwAlAC0AMwAuADAANQA0ACYAKgA9ADkAOgA7ADgAEAAdAA8APAARABQAFQAXABoAHAAZABYAGAAbABMAHgDDAAQAIgCjAKIADQCHAAkAvgC/AKkAqgASAD8AXwDoAAsADAA+AEAAiACyALMAtgC3ALQAtQAKAMQABQBeAGAAxQAjAIsAigCXAJ0AngCDAB8AIQAOAJMAIADwALgACACNAEMAhgDZANoA3gCOAJYAhQAHAL0AhAAGAKQAYQBBAEIA8QDyAPMA9QD0APYA1wDqAO4BAgDpAO0BAwEEAN0BBQEGAOIA4wEHAJAA3ACRAIkAsACxAKABCAChAQkBCgCrAIwAxgCmAIIAwgC5AGQBCwEMAQ0ArAAkAQ4BDwEQAREBEgETARQBFQEWARcBGAEZARoBGwEcAR0BHgEfASABIQEiAOABIwEkASUBJgEnASgBKQEqASsBLAEtAS4BLwEBATABMQEyATMBNAE1ATYBNwDYAOEBOAE5AN8A2wE6ATsBPACPAK0AyQDHAK4AYgE9AT4AYwD9AT8A/wFAAUEAywBlAMgBQgDKAUMBRAFFAUYA+AFHAUgBSQDPAMwAzQFKAM4BSwFMAPoBTQFOAU8BUAFRAVIAZgFTANMA0ADRAK8AZwFUAVUBVgFXAVgBWQFaAOQA+wFbAVwBXQDWANQA1QFeAGgBXwFgAWEBYgFjAWQBZQFmAWcBaADrAWkAuwFqAOYBawBqAGkAawBtAGwBbAFtAG4A/gFuAQABbwBvAXAAcQBwAHIBcQBzAXIBcwF0AXUA+QF2AXcAdQB0AHYBeAB3AXkBegF7AOwBfAC6AX0BfgF/AYAAfwB+AIABgQCBAYIBgwGEAYUBhgD8AYcBiADlAYkBigGLAYwAwADBAY0A5wGOAHoAeQB7AH0AfAGPAZABkQGSAHgBkwGUAZUBlgGXAZgBmQGaAZsBnAGdAZ4BnwGgAaEBogGjAaQBpQGmAacBqADvAJIAlACVAJgAmQCaAJsAnACfAKUApwCoALwBqQRoYmFyCGRvdGxlc3NqC2NvbW1hYWNjZW50CWdyYXZlLmNhcAlhY3V0ZS5jYXAMZGllcmVzaXMuY2FwBEV1cm8IcmluZy5jYXAJdGlsZGUuY2FwDGtncmVlbmxhbmRpYw1kb3RhY2NlbnQuY2FwBGxkb3QHdW5pMDAwMQd1bmkwMDAyB3VuaTAwMDMHdW5pMDAwNAd1bmkwMDA1B3VuaTAwMDYHdW5pMDAwNwd1bmkwMDA4B3VuaTAwMDkHdW5pMDAxMAd1bmkwMDExB3VuaTAwMTIHdW5pMDAxMwd1bmkwMDE0B3VuaTAwMTUHdW5pMDAxNgd1bmkwMDE3B3VuaTAwMTgHdW5pMDAxOQd1bmkwMEFEB2VvZ29uZWsHYW9nb25lawdBb2dvbmVrB0VvZ29uZWsNY2Fyb252ZXJ0aWNhbAZkY2Fyb24GbGNhcm9uBkxjYXJvbgZ0Y2Fyb24HaW9nb25lawdJb2dvbmVrB3VvZ29uZWsHVW9nb25lawZEY3JvYXQGbGFjdXRlBHRiYXIEVGJhcgRIYmFyBkxhY3V0ZQptYWNyb24uY2FwA0VuZwNlbmcOY2lyY3VtZmxleC5jYXAJY2Fyb24uY2FwEGh1bmdhcnVtbGF1dC5jYXAJYnJldmUuY2FwC2hjaXJjdW1mbGV4B0FtYWNyb24GQWJyZXZlC0NjaXJjdW1mbGV4CkNkb3RhY2NlbnQGRGNhcm9uBkVjYXJvbgdFbWFjcm9uBkVicmV2ZQpFZG90YWNjZW50C0djaXJjdW1mbGV4DEdjb21tYWFjY2VudApHZG90YWNjZW50C0hjaXJjdW1mbGV4Bkl0aWxkZQdJbWFjcm9uBklicmV2ZQJJSgtKY2lyY3VtZmxleAxLY29tbWFhY2NlbnQMTGNvbW1hYWNjZW50Bk5hY3V0ZQZOY2Fyb24MTmNvbW1hYWNjZW50B09tYWNyb24GT2JyZXZlBlJhY3V0ZQZSY2Fyb24MUmNvbW1hYWNjZW50BlNhY3V0ZQtTY2lyY3VtZmxleAxTY29tbWFhY2NlbnQGVGNhcm9uDFRjb21tYWFjY2VudAZVdGlsZGUHVW1hY3JvbgZVYnJldmUFVXJpbmcNVWh1bmdhcnVtbGF1dA1PaHVuZ2FydW1sYXV0BldncmF2ZQZXYWN1dGULV2NpcmN1bWZsZXgJV2RpZXJlc2lzBllncmF2ZQtZY2lyY3VtZmxleAZaYWN1dGUKWmRvdGFjY2VudAdhbWFjcm9uBmFicmV2ZQtjY2lyY3VtZmxleApjZG90YWNjZW50B2FlYWN1dGUGZWNhcm9uB2VtYWNyb24GZWJyZXZlCmVkb3RhY2NlbnQLZ2NpcmN1bWZsZXgKZ2RvdGFjY2VudAxnY29tbWFhY2NlbnQGaXRpbGRlB2ltYWNyb24GaWJyZXZlBnlncmF2ZQt5Y2lyY3VtZmxleAZ3Z3JhdmUGd2FjdXRlC3djaXJjdW1mbGV4CXdkaWVyZXNpcwZ1dGlsZGUHdW1hY3JvbgZ1YnJldmUFdXJpbmcMdGNvbW1hYWNjZW50DHNjb21tYWFjY2VudAZzYWN1dGULc2NpcmN1bWZsZXgGcmNhcm9uBnJhY3V0ZQxyY29tbWFhY2NlbnQCZmYGemFjdXRlCnpkb3RhY2NlbnQHb21hY3JvbgZvYnJldmUGbmFjdXRlBm5jYXJvbgxrY29tbWFhY2NlbnQLamNpcmN1bWZsZXgCaWoMbmNvbW1hYWNjZW50DGxjb21tYWFjY2VudAd1bmkxRTYxB3VuaTFFNjAHdW5pMUU1Nwd1bmkxRTU2B3VuaTFFNDEHdW5pMUU0MAd1bmkxRTFFB3VuaTFFMEIHdW5pMUUwQQd1bmkxRTAzB3VuaTFFMDIHdW5pMUUxRgd1bmkxRTZBB3VuaTFFNkINb2h1bmdhcnVtbGF1dA11aHVuZ2FydW1sYXV0BExkb3QHQUVhY3V0ZQAAAAAAAwAIAAIAEAAB//8AAw=='
