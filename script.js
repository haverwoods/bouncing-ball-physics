// Get the canvas element and its 2D drawing context
const canvas = document.getElementById("canvas"); // Find the canvas element by its ID
const ctx = canvas.getContext("2d"); // Get the 2D drawing tools (like a paintbrush)
const width = canvas.width; // Store the canvas width (600px)
const height = canvas.height; // Store the canvas height (600px)

// Define 5 balls with properties: position (x, y), radius, velocity (vx, vy), and color
const balls = [  { x: width / 2 - 50, y: height / 2 - 50, radius: 15, vx: 7, vy: -7, color: "#ff4444" },
 // Red ball, starts northwest of center 
 { x: width / 2 + 50, y: height / 2 - 50, radius: 15, vx: -6, vy: -6, color: "#44ff44" }, 
 // Green ball, starts northeast  
 { x: width / 2, y: height / 2 + 50, radius: 15, vx: 5, vy: -5, color: "#4444ff" },
  // Blue ball, starts south 
 { x: width / 2 - 50, y: height / 2 + 50, radius: 15, vx: -7, vy: -4, color: "#ffff44" },
  // Yellow ball, starts southwest 
 { x: width / 2 + 50, y: height / 2 + 50, radius: 15, vx: 6, vy: -6, color: "#ff44ff" }, 
 // Magenta ball, starts southeast;
]

// Square properties
const square = {
    size: 30, // Size of the square (30px width and height)
    x: width / 2, // Current x position (starts at center)
    y: height / 2, // Current y position (starts at center)
    vx: 5, // Velocity x component (starts moving right)
    vy: -5, // Velocity y component (starts moving up)
    angle: 0, // Rotation angle (starts at 0)
    angularVelocity: 0.01, // Rotation speed (0.01 radians per frame)
    color: "#333333", // Square color (dark gray)
    radius: (30 * Math.sqrt(2)) / 2 // Half diagonal ≈ 21.21 for collision approximation
  };

// Physics constants that control how balls behave
const GRAVITY = 0.2; // Pulls balls down by 0.2 pixels per frame squared (simulates gravity)
const FRICTION = 0.999; // Reduces velocity by 0.1% each frame (1 = no friction, 0 = instant stop)
const BOUNCE = 0.999; // Keeps 99.9% of velocity after hitting a wall (1 = perfect bounce, 0 = no bounce)

// Hexagon properties
const hexagon = {
  centerX: width / 2, // Center of hexagon (300px horizontally)
  centerY: height / 2, // Center of hexagon (300px vertically)
  radius: 200, // Distance from center to each vertex (size of hexagon)
  angle: 0, // Rotation angle in radians (starts at 0)
  rotationSpeed: 0.02, // Rotates by 0.02 radians per frame (controls spin speed)
};



// Calculate hexagon vertices based on current rotation
function getHexagonVertices() {
  // Creates an array to store the 6 corner points of the hexagon
  const vertices = [];
  // Loop 6 times to calculate each vertex
  for (let i = 0; i < 6; i++) {
    // Calculate the angle for each vertex, spaced 60 degrees (π/3 radians) apart, adjusted by current rotation
    const angle = hexagon.angle + (Math.PI / 3) * i;
    // Add vertex coordinates using trigonometry: x = center + radius * cos(angle), y = center + radius * sin(angle)
    vertices.push({
      x: hexagon.centerX + hexagon.radius * Math.cos(angle),
      y: hexagon.centerY + hexagon.radius * Math.sin(angle),
    });
  }
  // Return the array of vertex positions
  return vertices;
}

// Draw the hexagon on the canvas
function drawHexagon() {
  // Get the current positions of the hexagon's vertices
  const vertices = getHexagonVertices();
  // Start a new drawing path
  ctx.beginPath();
  // Move the drawing pen to the first vertex
  ctx.moveTo(vertices[0].x, vertices[0].y);
  // Draw lines to each subsequent vertex
  for (let i = 1; i < vertices.length; i++) {
    ctx.lineTo(vertices[i].x, vertices[i].y);
  }
  // Connect the last vertex back to the first to close the shape
  ctx.closePath();
  // Set the outline color to black
  ctx.strokeStyle = "#000000";
  // Set the line thickness to 2 pixels
  ctx.lineWidth = 2;
  // Draw the hexagon outline
  ctx.stroke();
}

// Draw all the balls on the canvas
function drawBalls() {
  // Loop through each ball in the balls array
  balls.forEach((ball) => {
    // Check if the ball's position is invalid (NaN = Not a Number)
    if (isNaN(ball.x) || isNaN(ball.y)) {
      // Log an error to the console with the ball's details
      console.error("Invalid ball position:", ball);
      // Reset the ball to the hexagon's center
      ball.x = hexagon.centerX;
      ball.y = hexagon.centerY;
      // Stop the ball's movement
      ball.vx = 0;
      ball.vy = 0;
    }
    // Start a new path for drawing a circle
    ctx.beginPath();
    // Draw a circle at the ball's position with its radius
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    // Set the fill color to the ball's color
    ctx.fillStyle = ball.color;
    // Fill the circle with the chosen color
    ctx.fill();
    // Close the circle path
    ctx.closePath();
  });
}

// Draw the square on the canvas, accounting for rotation
function drawSquare() {
  // Save the current state of the canvas (position and rotation)
  ctx.save();
  // Move the canvas origin to the square's current position
  ctx.translate(square.x, square.y);
  // Rotate the canvas by the square's current angle
  ctx.rotate(square.angle);
  // Start a new path for the square
  ctx.beginPath();
  // Draw a square centered at (0, 0) after translation/rotation, using its size
  ctx.rect(-square.size / 2, -square.size / 2, square.size, square.size);
  // Set the fill color to the square's color
  ctx.fillStyle = square.color;
  // Fill the square with the chosen color
  ctx.fill();
  // Set the outline color to black
  ctx.strokeStyle = "#000000";
  // Set the outline thickness to 2 pixels
  ctx.lineWidth = 2;
  // Draw the square's outline
  ctx.stroke();
  // Restore the canvas to its previous state (undo translation/rotation)
  ctx.restore();
}

// Check if two lines intersect and return the intersection point
function lineIntersect(p0, p1, p2, p3) {
  // p0, p1 = first line (e.g., ball's path); p2, p3 = second line (e.g., hexagon wall)
  // Calculate coefficients for line equations: Ax + By = C
  const A1 = p1.y - p0.y; // Slope component y for line 1
  const B1 = p0.x - p1.x; // Slope component x for line 1
  const C1 = A1 * p0.x + B1 * p0.y; // Constant for line 1
  const A2 = p3.y - p2.y; // Slope component y for line 2
  const B2 = p2.x - p3.x; // Slope component x for line 2
  const C2 = A2 * p2.x + B2 * p2.y; // Constant for line 2
  // Calculate the determinant to check if lines are parallel
  const det = A1 * B2 - A2 * B1;
  // If determinant is near zero, lines are parallel and don't intersect
  if (Math.abs(det) < 1e-10) return null;
  // Solve for the intersection point (x, y)
  const x = (B2 * C1 - B1 * C2) / det;
  const y = (A1 * C2 - A2 * C1) / det;
  // Helper function to check if a value lies within a segment
  const onSegment = (val, min, max) => val >= Math.min(min, max) && val <= Math.max(min, max);
  // Check if the intersection lies within both line segments
  if (
    onSegment(x, p0.x, p1.x) &&
    onSegment(y, p0.y, p1.y) &&
    onSegment(x, p2.x, p3.x) &&
    onSegment(y, p2.y, p3.y)
  ) {
    // Return the intersection point if it's valid
    return { x, y };
  }
  // Return null if no valid intersection occurs
  return null;
}

// Check and handle collisions between a ball and the hexagon walls
function checkCollisions(ball) {
  // Get the current hexagon vertices (walls)
  const vertices = getHexagonVertices();
  // Calculate the ball's next position based on its velocity
  const nextX = ball.x + ball.vx;
  const nextY = ball.y + ball.vy;
  // Loop through each of the 6 walls of the hexagon
  for (let i = 0; i < 6; i++) {
    // Define the start and end points of the current wall
    const v1 = vertices[i];
    const v2 = vertices[(i + 1) % 6]; // Wraps to 0 when i=5
    // Check if the ball's path intersects with this wall
    const intersection = lineIntersect(
      { x: ball.x, y: ball.y }, // Ball's current position
      { x: nextX, y: nextY }, // Ball's next position
      v1,
      v2 // Wall segment
    );
    // If an intersection is found
    if (intersection) {
      // Calculate the wall's normal vector (perpendicular to the wall)
      const dx = v2.x - v1.x;
      const dy = v2.y - v1.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1; // Length of wall, avoid division by zero
      let nx = -dy / len; // Normal x component
      let ny = dx / len; // Normal y component
      // Ensure the normal points inward toward the hexagon center
      const midX = (v1.x + v2.x) / 2; // Midpoint of the wall
      const midY = (v1.y + v2.y) / 2;
      const toCenterX = hexagon.centerX - midX; // Vector to center
      const toCenterY = hexagon.centerY - midY;
      const dotNormal = nx * toCenterX + ny * toCenterY;
      if (dotNormal < 0) {
        // If normal points outward, flip it inward
        nx = -nx;
        ny = -ny;
      }
      // Reflect the ball's velocity using the normal (bounce effect)
      const dotProduct = ball.vx * nx + ball.vy * ny; // Project velocity onto normal
      ball.vx = (ball.vx - 2 * dotProduct * nx) * BOUNCE; // Reflect x velocity
      ball.vy = (ball.vy - 2 * dotProduct * ny) * BOUNCE; // Reflect y velocity
      // Correct the ball's position to prevent it from going through the wall
      const dxToIntersection = intersection.x - ball.x;
      const dyToIntersection = intersection.y - ball.y;
      const distToIntersection = Math.sqrt(dxToIntersection * dxToIntersection + dyToIntersection * dyToIntersection);
      const penetration = ball.radius - distToIntersection;
      if (penetration > 0) { // If the ball overlaps the wall
        const correctionDist = ball.radius + 1; // Push out by radius plus a small buffer
        ball.x = intersection.x + nx * correctionDist;
        ball.y = intersection.y + ny * correctionDist;
      }
      // Return true to indicate a collision was handled
      return true;
    }
  }
  // Return false if no collision occurred
  return false;
}

// Check and handle collisions between the square and the hexagon walls
function checkSquareCollisions() {
  // Get the current hexagon vertices (walls)
  const vertices = getHexagonVertices();
  // Calculate the square's next position based on its velocity
  const nextX = square.x + square.vx;
  const nextY = square.y + square.vy;
  // Loop through each of the 6 walls of the hexagon
  for (let i = 0; i < 6; i++) {
    // Define the start and end points of the current wall
    const v1 = vertices[i];
    const v2 = vertices[(i + 1) % 6]; // Wraps to 0 when i=5
    // Check if the square's path intersects with this wall
    const intersection = lineIntersect(
      { x: square.x, y: square.y }, // Square's current position
      { x: nextX, y: nextY }, // Square's next position
      v1,
      v2 // Wall segment
    );
    // If an intersection is found
    if (intersection) {
      // Calculate the wall's normal vector (perpendicular to the wall)
      const dx = v2.x - v1.x;
      const dy = v2.y - v1.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1; // Length of wall, avoid division by zero
      let nx = -dy / len; // Normal x component
      let ny = dx / len; // Normal y component
      // Ensure the normal points inward toward the hexagon center
      const midX = (v1.x + v2.x) / 2; // Midpoint of the wall
      const midY = (v1.y + v2.y) / 2;
      const toCenterX = hexagon.centerX - midX; // Vector to center
      const toCenterY = hexagon.centerY - midY;
      const dotNormal = nx * toCenterX + ny * toCenterY;
      if (dotNormal < 0) {
        // If normal points outward, flip it inward
        nx = -nx;
        ny = -ny;
      }
      // Reflect the square's velocity using the normal (bounce effect)
      const dotProduct = square.vx * nx + square.vy * ny; // Project velocity onto normal
      square.vx = (square.vx - 2 * dotProduct * nx) * BOUNCE; // Reflect x velocity
      square.vy = (square.vy - 2 * dotProduct * ny) * BOUNCE; // Reflect y velocity
      // Correct the square's position to prevent it from going through the wall
      const penetration = square.radius - Math.sqrt(
        (intersection.x - square.x) ** 2 + (intersection.y - square.y) ** 2
      );
      if (penetration > 0) { // If the square overlaps the wall
        square.x = intersection.x + nx * (square.radius + 1); // Push out by radius plus buffer
        square.y = intersection.y + ny * (square.radius + 1);
      }
      // Return true to indicate a collision was handled
      return true;
    }
  }
  // Return false if no collision occurred
  return false;
}

// Update the physics for balls and the square
function update() {
  // Update each ball's position and velocity
  balls.forEach((ball) => {
    // Apply gravity by increasing downward velocity
    ball.vy += GRAVITY;
    // Apply friction to slow down horizontal and vertical velocities
    ball.vx *= FRICTION;
    ball.vy *= FRICTION;
    // Check for invalid velocities (NaN)
    if (isNaN(ball.vx) || isNaN(ball.vy)) {
      ball.vx = 0; // Reset to zero if invalid
      ball.vy = 0;
    }
    // Cap velocity to prevent excessive speed
    if (Math.abs(ball.vx) > 20) ball.vx = Math.sign(ball.vx) * 20;
    if (Math.abs(ball.vy) > 20) ball.vy = Math.sign(ball.vy) * 20;
    // Calculate the ball's next position
    const nextX = ball.x + ball.vx;
    const nextY = ball.y + ball.vy;
    // Move the ball if no collision occurs
    if (!checkCollisions(ball)) {
      ball.x = nextX;
      ball.y = nextY;
    }
    // Ensure the ball stays within the hexagon using distance from center
    const dx = ball.x - hexagon.centerX;
    const dy = ball.y - hexagon.centerY;
    const dist = Math.sqrt(dx * dx + dy * dy); // Distance from center
    const maxDist = hexagon.radius - ball.radius; // Maximum allowed distance
    if (dist > maxDist) { // If ball is outside the boundary
      const scale = maxDist / dist; // Scale factor to pull it back
      ball.x = hexagon.centerX + dx * scale; // Adjust position
      ball.y = hexagon.centerY + dy * scale;
      const nx = dx / dist; // Normal vector toward center
      const ny = dy / dist;
      const dot = ball.vx * nx + ball.vy * ny; // Project velocity onto normal
      ball.vx = (ball.vx - 2 * dot * nx) * BOUNCE; // Bounce inward
      ball.vy = (ball.vy - 2 * dot * ny) * BOUNCE;
    }
  });

  // Update the square's position and velocity
  const nextX = square.x + square.vx; // Calculate next position
  const nextY = square.y + square.vy;
  // Move the square if no collision occurs
  if (!checkSquareCollisions()) {
    square.x = nextX;
    square.y = nextY;
  }
  // Update the square's rotation
  square.angle += square.angularVelocity;
  // Ensure the square stays within the hexagon
  const dx = square.x - hexagon.centerX;
  const dy = square.y - hexagon.centerY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxDist = hexagon.radius - square.radius;
  if (dist > maxDist) { // If square is outside the boundary
    const angle = Math.atan2(dy, dx); // Angle from center
    square.x = hexagon.centerX + Math.cos(angle) * maxDist; // Adjust position
    square.y = hexagon.centerY + Math.sin(angle) * maxDist;
    const nx = dx / dist; // Normal vector toward center
    const ny = dy / dist;
    const dot = square.vx * nx + square.vy * ny; // Project velocity onto normal
    square.vx = (square.vx - 2 * dot * nx) * 0.8; // Bounce with some energy loss
    square.vy = (square.vy - 2 * dot * ny) * 0.8;
  }

  // Rotate the hexagon itself
  hexagon.angle += hexagon.rotationSpeed;
}

// Main animation loop to update and draw everything
function animate() {
  // Clear the entire canvas to prepare for the next frame
  ctx.clearRect(0, 0, width, height);
  // Update the physics for all objects
  update();
  // Draw the hexagon outline
  drawHexagon();
  // Draw all the balls
  drawBalls();
  // Draw the square
  drawSquare();
  // Request the next animation frame (runs about 60 times per second)
  requestAnimationFrame(animate);
}

// Start the animation if the canvas context is available
if (ctx) {
  // Begin the animation loop
  animate();
} else {
  // Log an error if the canvas context couldn't be found
  console.error("Canvas context not found!");
}