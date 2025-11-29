/*
  Geometry Lab - Triangle Congruence (Visual Upgrade)
  Features:
  - Confetti Reward System
  - Blueprint Grid Background
  - Pulsing UI Elements
  - Modern Color Palette
  - RHS Constraints & Rotation
*/

let canvas;
let t1, t2;
let buttons = [];
let confetti = []; // Array for particles

// Interaction States
let draggedPoint = null;
let draggedTriangle = null;
let rotatingTriangle = null;
let dragOffset = { x: 0, y: 0 }; 
let initialAngle = 0;

// Game State
let currentMode = "ALL"; 
let isCongruent = false; // To track state change for one-time effects

// Visual Assets (Pulse time)
let time = 0; 

// Constants
const TOLERANCE_SIDE = 8; // Slightly looser for better UX
const TOLERANCE_ANGLE = 3;

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  canvas.elt.style.touchAction = "none";
  
  // Set Font settings
  textFont('Nunito');
  textStyle(BOLD);
  textAlign(CENTER, CENTER);

  resetTriangles();
  setupButtons();
}

function draw() {
  time += 0.05; // Advance time for animations
  
  // 1. Draw Custom Background (Grid)
  drawBackground();

  // 2. Logic Check
  let status = checkStatus();
  
  // 3. Handle Success State & Feedback
  if (status.match) {
    if (!isCongruent) {
      // JUST became congruent: Trigger Confetti
      spawnConfetti();
      isCongruent = true;
    }
    
    // Success Banner
    drawBanner("條件成立! (Matched!)", color(46, 204, 113));
  } else {
    isCongruent = false;
    
    // Failure Feedback
    if (currentMode === "AAA" && status.anglesMatch) {
      drawBanner("AAA 不全等 (形狀相同，大小不同)", color(231, 76, 60));
    } else if (currentMode === "ASS" && status.assMatch) {
      drawBanner("ASS (SSA) 不全等 (兩義性)", color(231, 76, 60));
    }
  }

  // 4. Draw Triangles (With modern styling)
  // T1: Warm Coral Gradient
  t1.display(color(255, 107, 107, 150), color(196, 69, 69)); 
  // T2: Cool Ocean Gradient
  t2.display(color(72, 219, 251, 150), color(44, 130, 201));

  // 5. Draw Confetti (if any)
  updateAndDrawConfetti();

  // 6. Draw UI
  drawButtons();
  
  // 7. Helper Text (Fade out if interacting)
  if (!draggedPoint && !draggedTriangle && !rotatingTriangle && !status.match) {
    fill(100, 150);
    noStroke();
    textSize(14);
    text("拖動頂點改變形狀 • 綠棒旋轉", width/2, height - 110);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  setupButtons();
}

// --- Visual Helpers ---

function drawBackground() {
  background(245, 247, 250); // Off-white
  
  // Draw Grid
  stroke(220, 225, 230);
  strokeWeight(1);
  let gridSize = 40;
  
  for (let x = 0; x < width; x += gridSize) {
    line(x, 0, x, height);
  }
  for (let y = 0; y < height; y += gridSize) {
    line(0, y, width, y);
  }
}

function drawBanner(msg, c) {
  push();
  fill(c);
  noStroke();
  // Modern pill shape at top
  rectMode(CENTER);
  
  // Shadow
  drawingContext.shadowBlur = 20;
  drawingContext.shadowColor = 'rgba(0,0,0,0.2)';
  
  rect(width/2, 50, 350, 50, 25);
  
  // Reset shadow for text
  drawingContext.shadowBlur = 0;
  fill(255);
  textSize(20);
  text(msg, width/2, 50);
  pop();
}

// --- Confetti System ---

function spawnConfetti() {
  for(let i=0; i<80; i++) {
    confetti.push(new Particle(width/2, height/2));
  }
}

function updateAndDrawConfetti() {
  for (let i = confetti.length - 1; i >= 0; i--) {
    let p = confetti[i];
    p.update();
    p.display();
    if (p.isDead()) {
      confetti.splice(i, 1);
    }
  }
}

class Particle {
  constructor(x, y) {
    this.x = x + random(-50, 50);
    this.y = y + random(-50, 50);
    this.vx = random(-5, 5);
    this.vy = random(-10, -2);
    this.gravity = 0.2;
    this.color = color(random(255), random(255), random(255));
    this.life = 255;
    this.size = random(5, 10);
    this.rotation = random(TWO_PI);
    this.rotSpeed = random(-0.1, 0.1);
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.life -= 4;
    this.rotation += this.rotSpeed;
  }
  
  display() {
    noStroke();
    fill(red(this.color), green(this.color), blue(this.color), this.life);
    push();
    translate(this.x, this.y);
    rotate(this.rotation);
    rect(0, 0, this.size, this.size);
    pop();
  }
  
  isDead() {
    return this.life < 0;
  }
}

// --- Input Handling ---

function touchStarted() {
  for (let btn of buttons) {
    if (btn.isClicked(mouseX, mouseY)) {
      btn.action();
      return false;
    }
  }

  // Priority: 1.Rotation -> 2.Vertices -> 3.Body
  if (checkRotation(t1)) return false;
  if (checkRotation(t2)) return false;

  if (checkVertexDrag(t1)) return false;
  if (checkVertexDrag(t2)) return false;

  if (checkBodyDrag(t1)) return false;
  if (checkBodyDrag(t2)) return false;

  return false;
}

function checkVertexDrag(t) {
  for (let i = 0; i < 3; i++) {
    let p = t.points[i];
    // Larger hit area (40px) for ease of use
    if (dist(mouseX, mouseY, p.x, p.y) < 40) {
      if (currentMode === 'RHS' && i === 1) {
         // Locked (RHS Corner)
      } else {
         draggedPoint = { t: t, idx: i };
      }
      return true;
    }
  }
  return false;
}

function checkBodyDrag(t) {
  if (t.contains(mouseX, mouseY)) {
    draggedTriangle = t;
    dragOffset.x = mouseX; dragOffset.y = mouseY;
    return true;
  }
  return false;
}

function checkRotation(tri) {
  let d = dist(mouseX, mouseY, tri.handlePos.x, tri.handlePos.y);
  if (d < 30) {
    rotatingTriangle = tri;
    let c = tri.getCentroid();
    initialAngle = atan2(mouseY - c.y, mouseX - c.x);
    return true;
  }
  return false;
}

function touchMoved() {
  if (draggedPoint) {
    let t = draggedPoint.t;
    let idx = draggedPoint.idx;
    let p = t.points[idx];

    if (currentMode === 'RHS') {
      let pCorner = t.points[1];
      if (idx === 0) {
        let vBase = createVector(t.points[2].x - pCorner.x, t.points[2].y - pCorner.y);
        let vPerp = createVector(-vBase.y, vBase.x); 
        let pProj = getProjectedPoint(pCorner, vPerp, mouseX, mouseY);
        p.x = pProj.x; p.y = pProj.y;
      } 
      else if (idx === 2) {
        let vBase = createVector(t.points[0].x - pCorner.x, t.points[0].y - pCorner.y);
        let vPerp = createVector(vBase.y, -vBase.x); 
        let pProj = getProjectedPoint(pCorner, vPerp, mouseX, mouseY);
        p.x = pProj.x; p.y = pProj.y;
      }
    } else {
      p.x = mouseX; p.y = mouseY;
    }
  } 
  else if (rotatingTriangle) {
    let t = rotatingTriangle;
    let c = t.getCentroid();
    let currentAngle = atan2(mouseY - c.y, mouseX - c.x);
    let rotationDiff = currentAngle - initialAngle;
    for (let p of t.points) {
      let dx = p.x - c.x; let dy = p.y - c.y;
      p.x = c.x + dx * cos(rotationDiff) - dy * sin(rotationDiff);
      p.y = c.y + dx * sin(rotationDiff) + dy * cos(rotationDiff);
    }
    initialAngle = currentAngle;
  }
  else if (draggedTriangle) {
    let dx = mouseX - dragOffset.x;
    let dy = mouseY - dragOffset.y;
    for (let p of draggedTriangle.points) {
      p.x += dx; p.y += dy;
    }
    dragOffset.x = mouseX; dragOffset.y = mouseY;
  }
  return false;
}

function touchEnded() {
  draggedPoint = null;
  draggedTriangle = null;
  rotatingTriangle = null;
  return false;
}

function getProjectedPoint(origin, dir, mx, my) {
  let vMouse = createVector(mx - origin.x, my - origin.y);
  let d = dir.copy().normalize();
  let shadow = vMouse.dot(d);
  return {x: origin.x + d.x * shadow, y: origin.y + d.y * shadow};
}

// --- Triangle Logic ---

class Triangle {
  constructor(x1, y1, x2, y2, x3, y3) {
    this.points = [{x:x1, y:y1}, {x:x2, y:y2}, {x:x3, y:y3}];
    this.handlePos = {x:0, y:0};
  }

  getCentroid() {
    return {
      x: (this.points[0].x + this.points[1].x + this.points[2].x) / 3,
      y: (this.points[0].y + this.points[1].y + this.points[2].y) / 3
    };
  }

  contains(px, py) {
    let p0 = this.points[0], p1 = this.points[1], p2 = this.points[2];
    let area = 0.5 * (-p1.y * p2.x + p0.y * (-p1.x + p2.x) + p0.x * (p1.y - p2.y) + p1.x * p2.y);
    let s = 1 / (2 * area) * (p0.y * p2.x - p0.x * p2.y + (p2.y - p0.y) * px + (p0.x - p2.x) * py);
    let tr = 1 / (2 * area) * (p0.x * p1.y - p0.y * p1.x + (p0.y - p1.y) * px + (p1.x - p0.x) * py);
    return s > 0 && tr > 0 && (1 - s - tr) > 0;
  }

  getData() {
    let sides = [];
    let angles = [];
    let p = this.points;
    for (let i = 0; i < 3; i++) {
      let pA = p[i];
      let pB = p[(i+1)%3];
      sides.push(dist(pA.x, pA.y, pB.x, pB.y));
      let v1 = createVector(pB.x - pA.x, pB.y - pA.y);
      let v2 = createVector(p[(i+2)%3].x - pA.x, p[(i+2)%3].y - pA.y);
      angles.push(degrees(v1.angleBetween(v2)));
    }
    return { sides, angles: angles.map(a => abs(a)) };
  }

  display(fillColor, strokeColor) {
    let p = this.points;
    let data = this.getData();
    let c = this.getCentroid();

    // 1. Rotation Handle (Animated)
    let vUp = createVector(p[0].x - c.x, p[0].y - c.y);
    vUp.setMag(vUp.mag() + 45); 
    this.handlePos = {x: c.x + vUp.x, y: c.y + vUp.y};
    
    stroke(100); strokeWeight(1);
    drawingContext.setLineDash([5, 5]); // Dashed line
    line(c.x, c.y, this.handlePos.x, this.handlePos.y);
    drawingContext.setLineDash([]); // Reset
    
    // Green Knob
    fill(46, 204, 113); noStroke();
    circle(this.handlePos.x, this.handlePos.y, 20);
    fill(255); textSize(10);
    text("↻", this.handlePos.x, this.handlePos.y);

    // 2. Main Body
    fill(fillColor);
    stroke(strokeColor);
    strokeWeight(3);
    strokeJoin(ROUND);
    triangle(p[0].x, p[0].y, p[1].x, p[1].y, p[2].x, p[2].y);

    // 3. Vertices (Pulsing)
    let pulse = map(sin(time * 2), -1, 1, 12, 18);
    for (let i=0; i<3; i++) {
      noStroke();
      if (currentMode === 'RHS' && i === 1) {
        fill(100); // Locked gray
        circle(p[i].x, p[i].y, 10);
      } else {
        fill(strokeColor);
        circle(p[i].x, p[i].y, pulse);
        // White center dot
        fill(255); circle(p[i].x, p[i].y, 5);
      }
    }

    // 4. Visibility Logic
    let showS = [0,0,0], showA = [0,0,0]; 
    if (currentMode === "ALL") { showS=[1,1,1]; showA=[1,1,1]; }
    else if (currentMode === "SSS") { showS=[1,1,1]; }
    else if (currentMode === "SAS") { showS=[1,0,1]; showA=[1,0,0]; }
    else if (currentMode === "ASA") { showA=[0,1,1]; showS=[0,1,0]; }
    else if (currentMode === "AAS") { showA=[0,1,1]; showS=[0,0,1]; }
    else if (currentMode === "RHS") { showA=[0,1,0]; showS=[1,0,1]; }
    else if (currentMode === "AAA") { showA=[1,1,1]; }
    else if (currentMode === "ASS") { showA=[1,0,0]; showS=[0,1,1]; }

    // Render Sides
    textSize(14);
    for (let i=0; i<3; i++) {
      if (!showS[i]) continue;
      let mx = (p[i].x + p[(i+1)%3].x)/2;
      let my = (p[i].y + p[(i+1)%3].y)/2;
      let dx = mx - c.x; let dy = my - c.y;
      let distVal = sqrt(dx*dx+dy*dy);
      
      let tx = mx + (dx/distVal)*25;
      let ty = my + (dy/distVal)*25;
      
      this.drawLabel(nf(data.sides[i]/10, 0, 1), tx, ty);
    }

    // Render Angles
    for (let i=0; i<3; i++) {
      if (!showA[i]) continue;
      if (currentMode === 'RHS' && i === 1) {
        push(); translate(p[i].x, p[i].y);
        let vBase = createVector(p[2].x - p[1].x, p[2].y - p[1].y);
        rotate(vBase.heading());
        noFill(); stroke(strokeColor); strokeWeight(2);
        rect(5, -5, 15, 15);
        pop();
      } else {
        noFill(); stroke(strokeColor); strokeWeight(2);
        arc(p[i].x, p[i].y, 40, 40, 0, TWO_PI);
        
        let dx = c.x - p[i].x; let dy = c.y - p[i].y;
        let distVal = sqrt(dx*dx+dy*dy);
        
        let tx = p[i].x + (dx/distVal)*40;
        let ty = p[i].y + (dy/distVal)*40;
        this.drawLabel(nf(data.angles[i], 0, 0)+"°", tx, ty);
      }
    }
  }
  
  drawLabel(txt, x, y) {
    rectMode(CENTER);
    noStroke();
    fill(255, 200); // White background with opacity
    let w = textWidth(txt) + 10;
    rect(x, y, w, 20, 5);
    fill(50);
    text(txt, x, y);
  }
}

// --- Check Logic ---

function checkStatus() {
  let d1 = t1.getData();
  let d2 = t2.getData();
  
  const eq = (a, b, t) => abs(a-b) < t;

  let s1 = d1.sides; let a1 = d1.angles;
  let s2 = d2.sides; let a2 = d2.angles;
  
  let match = false;
  
  if (currentMode === "SSS") {
     let set1 = s1.slice().sort((a,b)=>a-b);
     let set2 = s2.slice().sort((a,b)=>a-b);
     match = eq(set1[0], set2[0], TOLERANCE_SIDE) && eq(set1[1], set2[1], TOLERANCE_SIDE) && eq(set1[2], set2[2], TOLERANCE_SIDE);
  }
  else if (currentMode === "SAS") {
    match = eq(s1[2], s2[2], TOLERANCE_SIDE) && eq(a1[0], a2[0], TOLERANCE_ANGLE) && eq(s1[0], s2[0], TOLERANCE_SIDE);
  }
  else if (currentMode === "ASA") {
    match = eq(a1[1], a2[1], TOLERANCE_ANGLE) && eq(s1[1], s2[1], TOLERANCE_SIDE) && eq(a1[2], a2[2], TOLERANCE_ANGLE);
  }
  else if (currentMode === "AAS") {
    match = eq(a1[1], a2[1], TOLERANCE_ANGLE) && eq(a1[2], a2[2], TOLERANCE_ANGLE) && eq(s1[2], s2[2], TOLERANCE_SIDE);
  }
  else if (currentMode === "RHS") {
    let isRight = eq(a1[1], 90, 5) && eq(a2[1], 90, 5);
    match = isRight && eq(s1[0], s2[0], TOLERANCE_SIDE) && eq(s1[2], s2[2], TOLERANCE_SIDE);
  }
  else if (currentMode === "AAA") {
     let set1 = a1.slice().sort((a,b)=>a-b);
     let set2 = a2.slice().sort((a,b)=>a-b);
     let anglesMatch = eq(set1[0], set2[0], TOLERANCE_ANGLE) && eq(set1[1], set2[1], TOLERANCE_ANGLE) && eq(set1[2], set2[2], TOLERANCE_ANGLE);
     return { match: false, anglesMatch: anglesMatch };
  }
  else if (currentMode === "ASS") {
     let assMatch = eq(a1[0], a2[0], TOLERANCE_ANGLE) && eq(s1[1], s2[1], TOLERANCE_SIDE) && eq(s1[2], s2[2], TOLERANCE_SIDE);
     return { match: false, assMatch: assMatch };
  }
  else {
    let set1 = s1.slice().sort((a,b)=>a-b);
    let set2 = s2.slice().sort((a,b)=>a-b);
    match = eq(set1[0], set2[0], TOLERANCE_SIDE) && eq(set1[1], set2[1], TOLERANCE_SIDE) && eq(set1[2], set2[2], TOLERANCE_SIDE);
  }

  return { match: match };
}

function resetTriangles() {
  let cy = height/2;
  t1 = new Triangle(width*0.2, cy-80, width*0.1, cy+80, width*0.35, cy+80);
  t2 = new Triangle(width*0.7, cy-80, width*0.6, cy+80, width*0.85, cy+80);
}

// --- UI Buttons ---

function setupButtons() {
  buttons = [];
  let modes = ["SSS", "SAS", "ASA", "AAS", "RHS", "AAA", "ASS", "ALL"];
  let labels = ["SSS", "SAS", "ASA", "AAS", "RHS", "AAA", "ASS", "自由"];
  
  let btnW = 60, btnH = 40, gap = 8;
  
  if (width < 600) {
    btnW = (width - 40) / 4;
    let startX = 15;
    let y1 = height - 100, y2 = height - 50;
    for(let i=0; i<modes.length; i++) {
       let x = startX + (i%4)*(btnW+gap);
       let y = (i < 4) ? y1 : y2;
       buttons.push(new ModeButton(labels[i], modes[i], x, y, btnW, 40));
    }
  } else {
    let rowW = modes.length * (btnW + gap);
    let startX = (width - rowW) / 2;
    let y = height - 70;
    for(let i=0; i<modes.length; i++) {
       buttons.push(new ModeButton(labels[i], modes[i], startX + i*(btnW+gap), y, btnW, 50));
    }
  }
}

class ModeButton {
  constructor(label, mode, x, y, w, h) {
    this.label = label; this.mode = mode;
    this.x = x; this.y = y; this.w = w; this.h = h;
  }
  
  display() {
    // Shadow
    drawingContext.shadowBlur = 5;
    drawingContext.shadowColor = 'rgba(0,0,0,0.1)';
    
    if (currentMode === this.mode) {
      fill(52, 152, 219); // Active Blue
      stroke(41, 128, 185);
    } else {
      fill(255);
      stroke(220);
    }
    
    rectMode(CORNER);
    strokeWeight(1);
    rect(this.x, this.y, this.w, this.h, 10);
    
    // Reset shadow
    drawingContext.shadowBlur = 0;
    
    if (currentMode === this.mode) fill(255);
    else fill(80);
    
    noStroke();
    textSize(14);
    text(this.label, this.x + this.w/2, this.y + this.h/2);
  }
  
  isClicked(mx, my) {
    return mx > this.x && mx < this.x + this.w && my > this.y && my < this.y + this.h;
  }
  
  action() {
    currentMode = this.mode;
    if (this.mode === 'RHS') {
      fixToRightAngle(t1);
      fixToRightAngle(t2);
    }
  }
}

function fixToRightAngle(t) {
  let p1 = t.points[1];
  t.points[0] = {x: p1.x, y: p1.y - 120};
  t.points[2] = {x: p1.x + 140, y: p1.y};
}