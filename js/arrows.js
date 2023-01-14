// Create variables for each arrow
let arrow1;
let arrow2;
let arrow3;
let arrow4;
let arrow5;
let arrow6;
let arrow7;
let arrow8;

// Create a variable to help decide which arrow should flash
let activeArrow = 1;

function setup() {
  createCanvas(400, 400);
  
  // Set the starting coordinates of each arrow
  let xCoor = width/2;
  let yCoor = height/2;
  
  // Create each arrow
  
  arrow1 = new Arrow(xCoor, yCoor, 270);
  arrow2 = new Arrow(xCoor, yCoor, 315);
  arrow4 = new Arrow(xCoor, yCoor, 0);
  arrow6 = new Arrow(xCoor, yCoor, 45);
  arrow8 = new Arrow(xCoor, yCoor, 90);
  arrow7 = new Arrow(xCoor, yCoor, 135);
  arrow5 = new Arrow(xCoor, yCoor, 180);
  arrow3 = new Arrow(xCoor, yCoor, 225);
}

function draw() {
  background(220);
  
  // Display each arrow
  arrow1.display();
  arrow2.display();
  arrow3.display();
  arrow4.display();
  arrow5.display();
  arrow6.display();
  arrow7.display();
  arrow8.display();
}

// When the user presses a number key, check which arrow should flash
function keyPressed() {
	console.log(key)
  if (key == '1') {
    arrow1.flashGreen();
  }
  if (key == '2') {
    arrow2.flashGreen();
  }
  if (key == '3') {
    arrow3.flashGreen();
  }
  if (key == '4') {
    arrow4.flashGreen();
  }
  if (key == '5') {
    arrow5.flashGreen();
  }
  if (key == '6') {
    arrow6.flashGreen();
  }
  if (key == '7') {
    arrow7.flashGreen();
  }
  if (key == '8') {
    arrow8.flashGreen();
  }
}
function keyReleased() {
  if (key == '1') {
    arrow1.resetColor();
  }
  if (key == '2') {
    arrow2.resetColor();
  }
  if (key == '3') {
    arrow3.resetColor();
  }
  if (key == '4') {
    arrow4.resetColor();
  }
  if (key == '5') {
    arrow5.resetColor();
  }
  if (key == '6') {
    arrow6.resetColor();
  }
  if (key == '7') {
    arrow7.resetColor();
  }
  if (key == '8') {
    arrow8.resetColor();
  }
}

// Updated arrow constructor
function Arrow(xCoor, yCoor, angle) {
  this.xCoor = xCoor;
  this.yCoor = yCoor;
  this.angle = angle;
  this.color = 'black';
  
  this.display = function() {
    push();
    stroke(this.color);
    strokeWeight(3);
    translate(this.xCoor, this.yCoor);
    rotate(radians(this.angle));
    line(0, 0, 100, 0);
    triangle(100, 10, 100, -10, 110, 0);
    pop();
  }
  
  // Set the color of the arrow to green
  this.flashGreen = function() {
    this.color = 'green';
  }
  
  // Reset the color of the arrow
  this.resetColor = function() {
    this.color = 'black';
  }
  
}