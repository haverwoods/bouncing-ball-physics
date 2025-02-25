
        // Get the canvas element and its 2D drawing context
        const canvas = document.getElementById('canvas'); // Finds the canvas by its ID
        const ctx = canvas.getContext('2d');             // Gets the 2D drawing tools (like a paintbrush)
        const width = canvas.width;                      // Stores canvas width (600px)
        const height = canvas.height;                    // Stores canvas height (600px)

        // Define 5 balls with properties: position (x, y), radius, velocity (vx, vy), and color
        const balls = [
            { x: width / 2 - 50, y: height / 2 - 50, radius: 15, vx: 7, vy: -7, color: '#ff4444' }, // Red ball, starts northwest of center
            { x: width / 2 + 50, y: height / 2 - 50, radius: 15, vx: -6, vy: -6, color: '#44ff44' }, // Green ball, starts northeast
            { x: width / 2, y: height / 2 + 50, radius: 15, vx: 5, vy: -5, color: '#4444ff' },      // Blue ball, starts south
            { x: width / 2 - 50, y: height / 2 + 50, radius: 15, vx: -7, vy: -4, color: '#ffff44' }, // Yellow ball, starts southwest
            { x: width / 2 + 50, y: height / 2 + 50, radius: 15, vx: 6, vy: -6, color: '#ff44ff' }   // Magenta ball, starts southeast
        ];
        // Each ball has:
        // - x, y: starting position (pixels from top-left of canvas)
        // - radius: size (15px radius = 30px diameter)
        // - vx, vy: velocity (pixels per frame, negative vy means upward)
        // - color: hex code for visual distinction

        // Physics constants that control how balls behave
        const GRAVITY = 0.7;    // Pulls balls down by 0.2 pixels per frame squared (simulates gravity)
        const FRICTION = 0.999; // Reduces velocity by 0.5% each frame (1 = no friction, 0 = instant stop)
        const BOUNCE = 0.99;    // Keeps 95% of velocity after hitting a wall (1 = perfect bounce, 0 = no bounce)

        // Hexagon properties
        const hexagon = {
            centerX: width / 2,   // Center of hexagon (300px horizontally)
            centerY: height / 2,  // Center of hexagon (300px vertically)
            radius: 200,         // Distance from center to each vertex (size of hexagon)
            angle: 0,            // Rotation angle in radians (starts at 0)
            rotationSpeed: 0.05  // Rotates by 0.02 radians per frame (controls spin speed)
        };

        // Function to calculate the 6 vertices of the hexagon based on its current angle
        function getHexagonVertices() {
            const vertices = []; // Empty array to store the 6 corner points
            for (let i = 0; i < 6; i++) { // Loop 6 times for a hexagon’s 6 sides
                const angle = hexagon.angle + (Math.PI / 3) * i; // Angle for each vertex (60° apart)
                vertices.push({
                    x: hexagon.centerX + hexagon.radius * Math.cos(angle), // x = center + radius * cos(angle)
                    y: hexagon.centerY + hexagon.radius * Math.sin(angle)  // y = center + radius * sin(angle)
                }); // Uses trigonometry to place vertices in a circle around the center
            }
            return vertices; // Returns array of {x, y} objects
        }

        // Function to draw the hexagon on the canvas
        function drawHexagon() {
            const vertices = getHexagonVertices(); // Get current vertex positions
            ctx.beginPath();                      // Start a new drawing path
            ctx.moveTo(vertices[0].x, vertices[0].y); // Move pen to first vertex
            for (let i = 1; i < vertices.length; i++) { // Loop through remaining vertices
                ctx.lineTo(vertices[i].x, vertices[i].y); // Draw line to next vertex
            }
            ctx.closePath();       // Connect last vertex back to first
            ctx.strokeStyle = '#000000'; // Set line color to black
            ctx.lineWidth = 2;           // Set line thickness to 2px
            ctx.stroke();                // Actually draw the outline
        }

        // Function to draw all 5 balls
        function drawBalls() {
            balls.forEach(ball => { // Loop through each ball
                if (isNaN(ball.x) || isNaN(ball.y)) { // Check for invalid positions
                    console.error('Invalid ball position:', ball); // Log error if position is NaN
                    ball.x = hexagon.centerX; // Reset to center
                    ball.y = hexagon.centerY;
                    ball.vx = 0; // Stop movement
                    ball.vy = 0;
                }
                ctx.beginPath(); // Start a new circle
                ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2); // Draw circle at (x, y) with radius
                ctx.fillStyle = ball.color; // Set fill color to ball’s color
                ctx.fill();                // Fill the circle
                ctx.closePath();           // End the circle path
            });
        }

        // Function to check if a line (ball’s path) intersects another line (hexagon wall)
        function lineIntersect(p0, p1, p2, p3) {
            // p0, p1 = ball’s current and next position; p2, p3 = wall’s endpoints
            const A1 = p1.y - p0.y; // Slope components for line 1
            const B1 = p0.x - p1.x;
            const C1 = A1 * p0.x + B1 * p0.y; // Line equation constant
            const A2 = p3.y - p2.y; // Slope components for line 2
            const B2 = p2.x - p3.x;
            const C2 = A2 * p2.x + B2 * p2.y;
            const det = A1 * B2 - A2 * B1; // Determinant to check if lines intersect

            if (Math.abs(det) < 1e-10) return null; // If lines are parallel (det near 0), no intersection

            const x = (B2 * C1 - B1 * C2) / det; // Solve for intersection x
            const y = (A1 * C2 - A2 * C1) / det; // Solve for intersection y

            // Check if intersection lies within both line segments
            const onSegment = (val, min, max) => val >= Math.min(min, max) && val <= Math.max(min, max);
            if (onSegment(x, p0.x, p1.x) && onSegment(y, p0.y, p1.y) &&
                onSegment(x, p2.x, p3.x) && onSegment(y, p2.y, p3.y)) {
                return { x, y }; // Return intersection point if valid
            }
            return null; // No intersection within segments
        }

        // Function to handle collisions for a single ball
        function checkCollisions(ball) {
            const vertices = getHexagonVertices(); // Get current hexagon walls
            const nextX = ball.x + ball.vx; // Where ball wants to go next
            const nextY = ball.y + ball.vy;

            for (let i = 0; i < 6; i++) { // Check each of the 6 walls
                const v1 = vertices[i]; // Start of wall
                const v2 = vertices[(i + 1) % 6]; // End of wall (wraps to 0 at i=5)
                
                const intersection = lineIntersect(
                    { x: ball.x, y: ball.y }, // Ball’s current position
                    { x: nextX, y: nextY },   // Ball’s next position
                    v1, v2                   // Wall segment
                );

                if (intersection) { // If ball’s path hits the wall
                    // Calculate wall’s normal vector (perpendicular line)
                    const dx = v2.x - v1.x;
                    const dy = v2.y - v1.y;
                    const len = Math.sqrt(dx * dx + dy * dy) || 1; // Length of wall, avoid div by 0
                    let nx = -dy / len; // Normal x (perpendicular to wall)
                    let ny = dx / len;  // Normal y

                    // Ensure normal points inward (toward hexagon center)
                    const midX = (v1.x + v2.x) / 2;
                    const midY = (v1.y + v2.y) / 2;
                    const toCenterX = hexagon.centerX - midX;
                    const toCenterY = hexagon.centerY - midY;
                    const dotNormal = nx * toCenterX + ny * toCenterY;
                    if (dotNormal < 0) { // If normal points outward, flip it
                        nx = -nx;
                        ny = -ny;
                    }

                    // Reflect velocity (bounce) using the normal
                    const dotProduct = ball.vx * nx + ball.vy * ny; // Project velocity onto normal
                    ball.vx = (ball.vx - 2 * dotProduct * nx) * BOUNCE; // Reflect and apply bounce
                    ball.vy = (ball.vy - 2 * dotProduct * ny) * BOUNCE;

                    // Correct position to prevent going through wall
                    const dxToIntersection = intersection.x - ball.x;
                    const dyToIntersection = intersection.y - ball.y;
                    const distToIntersection = Math.sqrt(dxToIntersection * dxToIntersection + dyToIntersection * dyToIntersection);
                    const penetration = ball.radius - distToIntersection;
                    if (penetration > 0) { // If ball overlaps wall
                        const correctionDist = ball.radius + 1; // Push out by radius + buffer
                        ball.x = intersection.x + nx * correctionDist;
                        ball.y = intersection.y + ny * correctionDist;
                    }

                    return true; // Collision handled, stop checking other walls
                }
            }
            return false; // No collision with this ball
        }

        // Function to update physics for all balls
        function update() {
            balls.forEach(ball => { // Process each ball
                // Apply gravity and friction
                ball.vy += GRAVITY; // Increase downward speed
                ball.vx *= FRICTION; // Slow horizontal speed slightly
                ball.vy *= FRICTION; // Slow vertical speed slightly

                // Clamp velocities to prevent runaway speeds
                if (isNaN(ball.vx) || isNaN(ball.vy)) { // Reset if invalid
                    ball.vx = 0;
                    ball.vy = 0;
                }
                if (Math.abs(ball.vx) > 20) ball.vx = Math.sign(ball.vx) * 20; // Cap at 20
                if (Math.abs(ball.vy) > 20) ball.vy = Math.sign(ball.vy) * 20;

                // Calculate next position
                const nextX = ball.x + ball.vx;
                const nextY = ball.y + ball.vy;

                // Check for collisions; if none, move to next position
                if (!checkCollisions(ball)) {
                    ball.x = nextX;
                    ball.y = nextY;
                }

                // Extra containment check based on distance from center
                const dx = ball.x - hexagon.centerX;
                const dy = ball.y - hexagon.centerY;
                const dist = Math.sqrt(dx * dx + dy * dy); // Distance from center
                const maxDist = hexagon.radius - ball.radius; // Max allowed distance
                if (dist > maxDist) { // If ball is too far out
                    const scale = maxDist / dist; // Scale back to boundary
                    ball.x = hexagon.centerX + dx * scale;
                    ball.y = hexagon.centerY + dy * scale;
                    const nx = dx / dist; // Normal toward center
                    const ny = dy / dist;
                    const dot = ball.vx * nx + ball.vy * ny;
                    ball.vx = (ball.vx - 2 * dot * nx) * BOUNCE; // Bounce inward
                    ball.vy = (ball.vy - 2 * dot * ny) * BOUNCE;
                }
            });

            // Rotate the hexagon
            hexagon.angle += hexagon.rotationSpeed; // Increase angle for continuous spin
        }

        // Main animation loop
        function animate() {
            ctx.clearRect(0, 0, width, height); // Erase previous frame
            
            update();         // Update physics (move balls, check collisions)
            drawHexagon();    // Draw the hexagon
            drawBalls();      // Draw all balls
            
            requestAnimationFrame(animate); // Schedule next frame (runs ~60 times/sec)
        }

        // Start the animation if canvas context exists
        if (ctx) {
            animate(); // Begin the loop
        } else {
            console.error('Canvas context not found!'); // Alert if canvas fails
        }
  