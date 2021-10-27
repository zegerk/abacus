/**
 * Abacus
 */
let bit = [];

let myFont;
let rightPressed = false;

let TEXT_SIZE_BASE = 30;
let TEXT_SIZE_COUNT = 50;

let config = {
  showCount: true,
  showBase: true,
  showBaseCount: true,
  showBeadCount: true,
  showBasePowers: true,
  showBeadRowSum: true,
  base: 10,
  bits: 4,
  count: 1234,
}

let BASE = config.base - 1;
let BITS = config.bits;

let count = config.count;

function preload() {
  myFont = loadFont('KronaOne-Regular.ttf');
}

function setup() {
  let params = getURLParams();

  Object.keys(config).reduce(function(key) {
    config[key] = params[key] || config[key]
  });
  
  let bitCount = count;
  
  button = createButton('-');
  button.addClass('control');
  button.position(window.innerWidth / 2 - 40, window.innerHeight - 65);
  button.mouseClicked(function() {       
    if (count > -1) {
        bit[0]--;
        count--;
    } 
  });
  
  button = createButton('+');
  button.addClass('control');
  button.position(window.innerWidth / 2 + 40, window.innerHeight - 65);
  button.mouseClicked(function() {       
    if (count < config.base ** BITS) {
      bit[0]++;
      count++;
    } 
  });
  
  /**
   * Todo - duplicate code
   */
  createButton('Base').addClass('control').position(0, 5).mouseClicked(function() {       
    config.showBase = !config.showBase;
  });
  
  createButton('Base count').addClass('control').position(55, 5).mouseClicked(function() {       
    config.showBaseCount = !config.showBaseCount;
  });
  
  createButton('Bead count').addClass('control').position(110, 5).mouseClicked(function() {       
    config.showBeadCount = !config.showBeadCount;
  });
  
  createButton('Base powers').addClass('control').position(165, 5).mouseClicked(function() {       
    config.showBasePowers = !config.showBasePowers;
  });
  
  createButton('Bead row sum').addClass('control').position(220, 5).mouseClicked(function() {       
    config.showBeadRowSum = !config.showBeadRowSum;
  });
  
  createButton('Count').addClass('control').position(275, 5).mouseClicked(function() {       
    config.showCount = !config.showCount;
  });
  
  /**
   * Setup the bits according to count given
   */
  for (var i = BITS - 1; i > -1; i--) {
    bit[i] = Math.floor(bitCount / (config.base ** i));
    
    bitCount -= bit[i] * (config.base ** i);
  }

  canvas = createCanvas(window.innerWidth - 4, window.innerHeight - 4, WEBGL);
  textFont(myFont);
  textSize(120);  
}

function draw() {
  background(255);
  ambientLight(60, 60, 60);
  pointLight(255, 255, 255, 0, 0, 100);

  orbitControl();

  /**
   * The "engine"
   */
  for (var i = 0; i < BITS - 1; i++) {
    if (bit[i] > BASE) {
      bit[i + 1] = bit[i + 1] + 1;
      bit[i] = 0;
    }
    
    if (bit[i] < 0) {
      bit[i + 1] = bit[i + 1] - 1;
      bit[i] = BASE;
    }
  }

  /**
   * Start drawing the abacus
   */
  translate(- window.innerWidth / 2,0,-window.innerWidth);
  
  /**
   * Draw generic information on the top
   */
  push();
    if (config.showCount) {
      push();
        translate(0, -150, 0);
        fill(255, 0, 0, 255);
        textSize(TEXT_SIZE_COUNT);  
        text("Count " + count, 0, 0);
      pop();
    }

    translate(config.base * 45 - 85, -150, 0);
    if (config.showBase) {
      push();
        fill(0, 0, 0, 255);
        textSize(TEXT_SIZE_BASE);
        text("Base " + config.base, 300, 0);
      pop();
      translate(250, 0, 0);
    }

    if (config.showBaseCount) {
      push();
        fill(0, 0, 0, 255);
        textSize(TEXT_SIZE_BASE);
        text("Base count " + (count.toString(config.base)), 300, 0);
      pop();
    }
  pop();

  /**
   * Draw the rows
   */
  for (var i = 0; i < BITS; i++) {  
    /**
     * Draw the number of beads shifted 
     */
    if (config.showBeadCount) {
      push();
        translate(-180, 45, 0);
        fill(0);
        textSize(120);
        text(bit[i], 0, 0);
      pop();
    }

    /**
     * Draw the base count information on right side of row
     */
    push();
      translate(120 + config.base * 45 + 100, 15, 0);
    
      if (config.showBasePowers) {
        push();
          fill(0);
          textSize(TEXT_SIZE_BASE);
          text(config.base ** i, 0, 0);
        pop();
        translate(250, 0, 0);
      }
    
      if (config.showBeadRowSum) {
        push();
          fill(0);
          textSize(TEXT_SIZE_BASE);
          text(bit[i] + " x " + config.base ** i + " = " + (bit[i] * config.base ** i), 0, 0);
        pop();
      }
    pop();
    

    push();
    
      /**
       * Draw the "stick" for the beads
       */
      push();
        rotateZ(PI / 2);
        translate(0, -60 - config.base * 22.5 - 20);
        fill(255, 0, 0, 255);
        cylinder(25, 120 + config.base * 45 + 40, 32, 32);
      pop();

      translate(0, 0, 0);
      rotateZ(0);
      rotateX(0);
      rotateY(PI / 2);

      /**
       * Draw the "active" beads
       */
      beads = 0;
      fill(0, 255, 0, 255);
      for (; beads < bit[i]; beads++) {
        translate(0, 0, 45);
        torus(40, 20, 32, 32);
      }

      /**
       * Space between the active and non active beads
       */
      translate(0, 0, 120);

      /**
       * Draw the non-active beads
       */
      fill(0, 128, 0, 255);
      for (; beads < config.base; beads++) {
        translate(0, 0, 45);
        torus(40, 20, 32, 32);
      }
    
    pop();
    
    /**
     * Move to new row
     */
    translate(0, 150, 0);

  }

}
