/*
  Triangle Congruence App - Main Logic
  - Integer Mode (0 d.p.)
  - Grid Snapping
  - Confetti & Graph Paper Background
  - HTML UI Integration
*/

let t1, t2; // The two triangles
let confettiSystem = []; // Array for confetti particles
let isMatched = false;

// Interaction State
let draggedPoint = null;      
let draggedTriangle = null;   
let rotatedTriangle = null;   
let dragOffset = { x: 0, y: 0 }; 
let initialMouseAngle = 0;

// Current Mode
let currentMode = "ALL"; 

function setup() {
  // Create canvas inside the specific container
  let container = document.getElementById('canvas-container');
  let c = createCanvas(container.offsetWidth, container.offsetHeight);
  c.parent('canvas-container');
  
  textSize(16);
  textAlign(CENTER, CENTER);
  textFont('Fredoka'); // Match CSS font

  resetTriangles();
  setupUI();
}

function windowResized() {
  let container = document.getElementById('canvas-container');
  resizeCanvas(container.offsetWidth, container.offsetHeight);
}

function draw() {
  drawBackground();

  // 1. Logic Check & UI Update
  let status = checkStatus();
  updateUI(status);

  // 2. Draw Triangles
  // Triangle 1: Soft Blue
  t1.display(color(74, 144, 226, 150), color(41, 80, 125)); 
  // Triangle 2: Soft Orange
  t2.display(color(255, 107, 107, 150), color(150, 50, 50));

  // 3. Confetti Effect on Win
  if (status.match) {
    if (!isMatched) {
      spawnConfetti(); // Trigger once
      isMatched = true;
    }
    drawConfetti();
  } else {
    isMatched = false;
  }
}

// --- Visuals ---

function drawBackground() {
  background(248, 249, 250);
  
  // Draw Graph Paper Grid
  stroke(220, 225, 230);
  strokeWeight(1);
  
  // Major grid lines every 50px
  for (let x = 0; x < width; x += 50) line(x, 0, x, height);
  for (let y = 0; y < height; y += 50) line(0, y, width, y);
}

function updateUI(status) {
  const statusBar = document.getElementById('status-bar');
  const statusIcon = document.getElementById('status-icon');
  const statusText = document.getElementById('status-text');

  if (status.match) {
    statusBar.className = "status-success";
    statusIcon.innerText = "🎉";
    statusText.innerText = "太棒了！全等條件成立！";
  } else {
    // Specific Failure Feedback
    if (currentMode === "AAA" && status.anglesMatch) {
      statusBar.className = "status-fail";
      statusIcon.innerText = "⚠️";
      statusText.innerText = "AAA 不能證明全等 (形狀相同，大小不同)";
    } else if (currentMode === "ASS" && status.assMatch) {
      statusBar.className = "status-fail";
      statusIcon.innerText = "⚠️";
      statusText.innerText = "ASS (SSA) 不能證明全等";
    } else if (currentMode === "RHS" && !status.rightAngle) {
      statusBar.className = "status-fail";
      statusIcon.innerText = "📐";
      statusText.innerText = "RHS 必須包含直角 (90°)";
    } else {
      statusBar.className = "status-neutral";
      statusIcon.innerText = "🤔";
      statusText.innerText = "拖動圖形使它們全等...";
    }
  }
}

function setupUI() {
  const buttons = document.querySelectorAll('.mode-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Update Active State
      buttons.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      
      // Set Mode
      currentMode = e.target.getAttribute('data-mode');
      
      // RHS Special Action
      if (currentMode === 'RHS') {
        alignRightAngles();
      }
    });
  });
}

// --- Interaction (Same Logic as V6) ---

function touchStarted() {
  // 1. Rotation Handles
  if (checkRotationHandle(t1)) return false;
  if (checkRotationHandle(t2)) return false;

  // 2. Vertices
  if (checkVertex(t1)) return false;
  if (checkVertex(t2)) return false;

  // 3. Body Move
  if (checkBody(t1)) return false;
  if (checkBody(t2)) return false;

  return true; // Let default happen if nothing clicked (e.g., UI clicks)
}

function checkRotationHandle(t) {
  let h = t.getRotationHandle();
  if (dist(mouseX, mouseY, h.x, h.y) < 25) {
    rotatedTriangle = t;
    let c = t.getCentroid();
    initialMouseAngle = atan2(mouseY - c.y, mouseX - c.x);
    return true;
  }
  return false;
}

function checkVertex(t) {
  for (let i = 0; i < t.points.length; i++) {
    let p = t.points[i];
    if (dist(mouseX, mouseY, p.x, p.y) < 30) {
      draggedPoint = p;
      draggedPoint.parentTriangle = t; 
      draggedPoint.index = i;          
      return true;
    }
  }
  return false;
}

function checkBody(t) {
  if (pointInTriangle(mouseX, mouseY, t)) {
    draggedTriangle = t;
    dragOffset.x = mouseX;
    dragOffset.y = mouseY;
    return true;
  }
  return false;
}

function touchMoved() {
  if (rotatedTriangle) {
    let c = rotatedTriangle.getCentroid();
    let currentMouseAngle = atan2(mouseY - c.y, mouseX - c.x);
    let deltaAngle = currentMouseAngle - initialMouseAngle;
    rotatedTriangle.rotate(deltaAngle, c);
    initialMouseAngle = currentMouseAngle;
    return false;
  }
  else if (draggedPoint) {
    if (currentMode === "RHS") {
       handleRHSConstraint(draggedPoint);
    } else {
       draggedPoint.x = Math.round(constrain(mouseX, 0, width));
       draggedPoint.y = Math.round(constrain(mouseY, 0, height));
    }
    return false;
  } 
  else if (draggedTriangle) {
    let dx = Math.round(mouseX - dragOffset.x);
    let dy = Math.round(mouseY - dragOffset.y);
    if (dx !== 0 || dy !== 0) {
        for (let p of draggedTriangle.points) {
          p.x += dx;
          p.y += dy;
        }
        dragOffset.x = mouseX;
        dragOffset.y = mouseY;
    }
    return false;
  }
  return true;
}

function touchEnded() {
  draggedPoint = null;
  draggedTriangle = null;
  rotatedTriangle = null;
}

// --- Constraints & Math ---

function alignRightAngles() {
  // Force Right Angle alignment
  t1.points[1].x = t1.points[0].x; t1.points[1].y = t1.points[2].y;
  t2.points[1].x = t2.points[0].x; t2.points[1].y = t2.points[2].y;
}

function handleRHSConstraint(pt) {
  let t = pt.parentTriangle;
  let pts = t.points;
  let idx = pt.index; 
  
  if (idx === 1) { // 90-degree corner
    let dx = Math.round(mouseX - pt.x);
    let dy = Math.round(mouseY - pt.y);
    for(let p of pts) {
      p.x += dx;
      p.y += dy;
    }
  } 
  else { // Legs
    let pCorner = pts[1]; 
    let pOther = (idx === 0) ? pts[2] : pts[0]; 
    
    let vFixed = createVector(pOther.x - pCorner.x, pOther.y - pCorner.y);
    let vPerp = createVector(-vFixed.y, vFixed.x); 
    
    let vMouse = createVector(mouseX - pCorner.x, mouseY - pCorner.y);
    let dot = vMouse.dot(vPerp);
    let magSq = vPerp.magSq();
    
    if (magSq > 0) {
      let scalar = dot / magSq;
      pt.x = Math.round(pCorner.x + vPerp.x * scalar);
      pt.y = Math.round(pCorner.y + vPerp.y * scalar);
    }
  }
}

// --- Triangle Class ---

class Triangle {
  constructor(x1, y1, x2, y2, x3, y3) {
    this.points = [{x:Math.round(x1), y:Math.round(y1)}, {x:Math.round(x2), y:Math.round(y2)}, {x:Math.round(x3), y:Math.round(y3)}];
  }

  getCentroid() {
    let x = (this.points[0].x + this.points[1].x + this.points[2].x) / 3;
    let y = (this.points[0].y + this.points[1].y + this.points[2].y) / 3;
    return {x, y};
  }

  getRotationHandle() {
    let c = this.getCentroid();
    let p1 = this.points[1]; 
    let vx = c.x - p1.x;
    let vy = c.y - p1.y;
    let len = sqrt(vx*vx + vy*vy);
    let dist = 80;
    if (len === 0) return {x: c.x, y: c.y - dist};
    return { x: c.x + (vx/len) * dist, y: c.y + (vy/len) * dist };
  }
  
  rotate(angle, center) {
    let c = center || this.getCentroid();
    let cosA = cos(angle);
    let sinA = sin(angle);
    for (let p of this.points) {
      let dx = p.x - c.x;
      let dy = p.y - c.y;
      p.x = c.x + dx * cosA - dy * sinA;
      p.y = c.y + dx * sinA + dy * cosA;
    }
  }

  getRawData() {
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

  getFormattedData() {
    let raw = this.getRawData();
    // Integer Mode logic
    let fSides = raw.sides.map(s => nf(s/10, 0, 0));
    let fAngles = raw.angles.map(a => nf(a, 0, 0));
    return { sides: fSides, angles: fAngles };
  }

  display(fillColor, strokeColor) {
    let p = this.points;
    let data = this.getFormattedData(); 
    let c = this.getCentroid();

    // 1. Draw Shape
    fill(fillColor);
    stroke(strokeColor);
    strokeWeight(3);
    strokeJoin(ROUND);
    triangle(p[0].x, p[0].y, p[1].x, p[1].y, p[2].x, p[2].y);

    // 2. Draw Rotation Handle (Modern Look)
    let rh = this.getRotationHandle();
    stroke(180); strokeWeight(2); drawingContext.setLineDash([5, 5]);
    line(c.x, c.y, rh.x, rh.y);
    drawingContext.setLineDash([]); // Reset dash
    
    fill(255, 230, 80); stroke(200, 150, 0); strokeWeight(2);
    circle(rh.x, rh.y, 24);
    noFill(); stroke(100, 80, 0); strokeWeight(2.5);
    arc(rh.x, rh.y, 14, 14, 0, PI + HALF_PI);
    triangle(rh.x, rh.y-7, rh.x+4, rh.y-3, rh.x-4, rh.y-3);

    // 3. Draw Vertices (Interactive Dots)
    noStroke(); fill(strokeColor);
    for (let pt of p) {
      circle(pt.x, pt.y, 14);
      // Shine effect on vertex
      fill(255, 255, 255, 100);
      circle(pt.x-2, pt.y-2, 6);
      fill(strokeColor);
    }

    // Visibility Logic
    let showS = [false, false, false];
    let showA = [false, false, false];
    
    if (currentMode === "ALL") {
      showS = [true, true, true]; showA = [true, true, true];
    } else if (currentMode === "SSS") {
      showS = [true, true, true];
    } else if (currentMode === "SAS") {
      showS[0] = true; showA[1] = true; showS[1] = true;
    } else if (currentMode === "ASA") {
      showA[0] = true; showS[0] = true; showA[1] = true;
    } else if (currentMode === "AAS") {
      showA[0] = true; showA[1] = true; showS[1] = true; 
    } else if (currentMode === "RHS") {
      showS[0] = true; showA[1] = true; showS[2] = true;
    } else if (currentMode === "AAA") {
      showA = [true, true, true];
    } else if (currentMode === "ASS") {
      showA[0] = true; showS[0] = true; showS[1] = true;
    }

    // 4. Render Sides (Pushed Outward)
    fill(50); noStroke(); textStyle(BOLD); textSize(15);
    for (let i=0; i<3; i++) {
      if (!showS[i]) continue;
      let pStart = p[i];
      let pEnd = p[(i+1)%3];
      let mx = (pStart.x + pEnd.x)/2;
      let my = (pStart.y + pEnd.y)/2;
      
      let dirX = mx - c.x; 
      let dirY = my - c.y;
      let distVal = sqrt(dirX*dirX + dirY*dirY);
      
      // Push out by 35px
      let offset = 35;
      let textX = mx, textY = my;
      
      if (distVal > 0) {
        textX = mx + (dirX / distVal) * offset;
        textY = my + (dirY / distVal) * offset;
      }
      
      // Text Background pill for readability
      rectMode(CENTER);
      fill(255, 255, 255, 200);
      rect(textX, textY, 24, 20, 5);
      fill(50);
      text(data.sides[i], textX, textY + 1);
    }

    // 5. Render Angles (Pushed Inward)
    for (let i=0; i<3; i++) {
      if (!showA[i]) continue;
      let valStr = data.angles[i];
      let pV = p[i];
      
      noFill(); stroke(80); strokeWeight(2);
      
      if ((currentMode === 'RHS' && i === 1) || valStr === "90") {
         drawRightAngleSymbol(pV, p[(i+1)%3], p[(i+2)%3]);
      } else {
        arc(pV.x, pV.y, 40, 40, 0, TWO_PI);
      }

      fill(50); noStroke(); textSize(13); textStyle(NORMAL);
      
      let dx = c.x - pV.x; 
      let dy = c.y - pV.y;
      let dLen = sqrt(dx*dx + dy*dy);
      
      // Place text DEEP inside (50px)
      let textDist = 50; 
      let textX = pV.x, textY = pV.y;
      if (dLen > 0) {
        textX = pV.x + (dx/dLen) * textDist;
        textY = pV.y + (dy/dLen) * textDist;
      }
      text(valStr + "°", textX, textY);
    }
  }
}

function drawRightAngleSymbol(pCorner, pNext, pPrev) {
    let vNext = createVector(pNext.x - pCorner.x, pNext.y - pCorner.y).normalize().mult(15);
    let vPrev = createVector(pPrev.x - pCorner.x, pPrev.y - pCorner.y).normalize().mult(15);
    let p1 = createVector(pCorner.x + vNext.x, pCorner.y + vNext.y);
    let p2 = createVector(pCorner.x + vPrev.x, pCorner.y + vPrev.y);
    let p3 = createVector(p1.x + vPrev.x, p1.y + vPrev.y);
    
    stroke(200, 50, 50); strokeWeight(2);
    line(p1.x, p1.y, p3.x, p3.y);
    line(p2.x, p2.y, p3.x, p3.y);
}

// --- Status Check ---

function checkStatus() {
  let d1 = t1.getFormattedData();
  let d2 = t2.getFormattedData();
  const eq = (a, b) => a === b;

  let s1 = d1.sides; let a1 = d1.angles;
  let s2 = d2.sides; let a2 = d2.angles;

  let match = false;
  let rightAngle = false;
  let anglesMatch = false; 
  let assMatch = false;

  if (currentMode === "SSS" || currentMode === "ALL") {
     let set1 = s1.slice().sort();
     let set2 = s2.slice().sort();
     match = eq(set1[0], set2[0]) && eq(set1[1], set2[1]) && eq(set1[2], set2[2]);
  }
  else if (currentMode === "SAS") {
    match = eq(s1[0], s2[0]) && eq(a1[1], a2[1]) && eq(s1[1], s2[1]);
  }
  else if (currentMode === "ASA") {
    match = eq(a1[0], a2[0]) && eq(s1[0], s2[0]) && eq(a1[1], a2[1]);
  }
  else if (currentMode === "AAS") {
    match = eq(a1[0], a2[0]) && eq(a1[1], a2[1]) && eq(s1[1], s2[1]);
  }
  else if (currentMode === "RHS") {
    rightAngle = (a1[1] === "90" && a2[1] === "90");
    match = rightAngle && eq(s1[0], s2[0]) && eq(s1[2], s2[2]);
  }
  else if (currentMode === "AAA") {
     let set1 = a1.slice().sort();
     let set2 = a2.slice().sort();
     anglesMatch = eq(set1[0], set2[0]) && eq(set1[1], set2[1]) && eq(set1[2], set2[2]);
     match = false;
  }
  else if (currentMode === "ASS") {
     assMatch = eq(a1[0], a2[0]) && eq(s1[0], s2[0]) && eq(s1[1], s2[1]);
     match = false;
  }

  return { match, rightAngle, anglesMatch, assMatch };
}

function pointInTriangle(px, py, t) {
  let p0 = t.points[0]; let p1 = t.points[1]; let p2 = t.points[2];
  let area = 0.5 * (-p1.y * p2.x + p0.y * (-p1.x + p2.x) + p0.x * (p1.y - p2.y) + p1.x * p2.y);
  let s = 1 / (2 * area) * (p0.y * p2.x - p0.x * p2.y + (p2.y - p0.y) * px + (p0.x - p2.x) * py);
  let tr = 1 / (2 * area) * (p0.x * p1.y - p0.y * p1.x + (p0.y - p1.y) * px + (p1.x - p0.x) * py);
  return s > 0 && tr > 0 && (1 - s - tr) > 0;
}

function resetTriangles() {
  let cx = width / 2;
  let cy = height / 2;
  // Dynamic positioning based on screen size
  t1 = new Triangle(cx - 200, cy - 100, cx - 200, cy + 100, cx - 50, cy + 100); 
  t2 = new Triangle(cx + 50, cy - 100, cx + 50, cy + 100, cx + 200, cy + 100);
}

// --- Confetti System ---

function spawnConfetti() {
  for (let i = 0; i < 100; i++) {
    confettiSystem.push({
      x: width / 2,
      y: height / 2,
      vx: random(-5, 5),
      vy: random(-10, -2),
      size: random(5, 10),
      color: color(random(255), random(255), random(255)),
      life: 255
    });
  }
}

function drawConfetti() {
  noStroke();
  for (let i = confettiSystem.length - 1; i >= 0; i--) {
    let p = confettiSystem[i];
    fill(red(p.color), green(p.color), blue(p.color), p.life);
    circle(p.x, p.y, p.size);
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.2; // Gravity
    p.life -= 3;
    if (p.life <= 0) confettiSystem.splice(i, 1);
  }
}
