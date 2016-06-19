



var bodiesVertexPositionBuffer = [];
var bodiesVertexColorBuffer = [];
var bodiesVertexIndexBuffer = [];

var centre = -50;

var particles = [];
var gravityMasses = [];
var origins = [];
var objects = [];
var types = [];



function type(name, mass, rotation, color, radius) {
  this.name = name;
  this.mass = mass;
  this.rotation = rotation;
  this.color = color;
  this.radius = radius;
}


function particle(mass, position, rotation, velocity, color, radius) {
  this.mass = mass;
  this.position = position;
  this.rotation = rotation;
  this.velocity = velocity;
  this.color = color;
  this.radius = radius;
}

function origin(mass, position, rotation, velocity, color, radius, spread) {
  this.mass = mass;
  this.position = position;
  this.rotation = rotation;
  this.velocity = velocity;
  this.color = color;
  this.radius = radius;
  this.spread = spread;
}

function gravityMass(mass, position, rotation, velocity, color, radius) {
  this.mass = mass;
  this.position = position;
  this.rotation = rotation;
  this.velocity = velocity;
  this.color = color;
  this.radius = radius;
}

types.push(new type("orbitalBodyOne", 100, [0 , 1, 0], [0 , 0, 1, 1], 0.2));
types.push(new type("orbitalBodyTwo", 100, [0 , 1, 0], [1 , 0, 1, 1], 0.5));
types.push(new type("massiveBodyOne", 100000, [0 , 1, 0], [1 , 1, 0, 1], 2));
types.push(new type("massiveBodyTwo", 1000000, [0 , 1, 0], [1 , 1, 0, 1], 2));


function newParticle() {
  var standardVel = [0.9 , 0, 0];
  var magnitude = Math.sqrt(Math.pow(standardVel[0], 2) + Math.pow(standardVel[1], 2) + Math.pow(standardVel[2], 2));
  var plusOrMinus = Math.random() < 0.5 ? -1 : 1;
  var spread = Math.PI / 10;
  var theta = Math.random() * plusOrMinus * spread / 2;
  var phi = (Math.PI / 2) - (Math.random() * plusOrMinus * spread / 2);
  var rho = 1;
  var cartesian = [Math.cos(theta) * Math.sin(phi), Math.sin(theta) * Math.sin(phi), Math.cos(phi)];
  var velocity = cartesian.map(function(n) {
    return n * magnitude;
  });

  particles.push(new particle(10000, [0, 5, -50], [0 , 1, 0], velocity, [1 , 0, 1, 1], 0.1));
  objects.push(new particle(10000, [0, 5, -50], [0 , 1, 0], velocity, [1 , 0, 1, 1], 0.1));
}

gravityMasses.push(new gravityMass(100000, [0, 0, centre], [0 , 1, 0], [1 , 1, 1], [1 , 1, 0, 1], 1));
objects.push(new gravityMass(100000, [0, 0, centre], [0 , 1, 0], [1 , 1, 1], [1 , 1, 0, 1], 1));
// gravityMasses.push(new gravityMass(1000000, [-1.5, 0, -15], [0 , 1, 0], [1 , 1, 1], [0 , 0, 0], [1 , 1, 0, 1], 2))

function createOrigins() {
  var mass = 1000;
  var position = [0, 2.5, -50];
  var rotation = [0 , 1, 0];
  var velocity = [1 , 0, 0]
  var color = [1 , 0, 1, 1];
  var radius = 0.1;
  var spread = Math.PI / 10;
  origins.push(new origin(mass, position, rotation, velocity, color, radius, spread));
}



function runParticles(particles,gravityMasses) {

  particles.forEach(function(particle) {
    calculateChangeOfPosition(particle,gravityMasses);
  })

}

//Calculate Particle Move Necessary

function calculateChangeOfPosition(particle, gravityMasses) {

  calculateVelocity(particle, gravityMasses);
  particle.position[0] += (particle.velocity[0]) * secondFraction;
  particle.position[1] += (particle.velocity[1]) * secondFraction;
  particle.position[2] += (particle.velocity[2]) * secondFraction;
  // console.log(particle.position);

}

function calculateVelocity(particle, gravityMasses) {

  gravityMasses.forEach(function(gravityMass) {

    var x = particle.position[0] - gravityMass.position[0];
    var y = particle.position[1] - gravityMass.position[1];
    var z = particle.position[2] - gravityMass.position[2];
    var magnitude = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2));

    var gravAccel = 6.674 * Math.pow(10, -11) * particle.mass * gravityMass.mass / Math.pow(magnitude, 2);

    var r = gravAccel / magnitude;
    var xAccel = r * x
    var yAccel = r * y
    var zAccel = r * z

    particle.velocity[0] -= xAccel;
    particle.velocity[1] -= yAccel;
    particle.velocity[2] -= zAccel;

  })
}


var rbody = 0;
var secondFraction = 0;
var lastEmission = 0;
var lastTime = 0;
var xCameraRotationPerSecond = Math.PI/10 ;
var xCameraRotation = 0;
var xTotalRotation = 0;

var yCameraRotation = 0;
var yTotalRotation = 0;

function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;
          rbody -= (75 * elapsed) / 1000.0;
          secondFraction = elapsed / 1000.0;
          xCameraRotation = xCameraRotationPerSecond * elapsed / 1000;
          xTotalRotation += xCameraRotation;
          // var yCameraRotationPerSecond = Math.random() * Math.PI / 50 ;
          // var plusOrMinus = Math.random() < 0.5 ? -1 : 1;
          // yCameraRotation = plusOrMinus * yCameraRotationPerSecond * elapsed / 1000;
          // yTotalRotation += yCameraRotation;


    }
    if (timeNow - lastEmission > 1000) {
      newParticle();
      lastEmission = timeNow;
    }
    lastTime = timeNow;
}

function tick() {
    requestAnimFrame(tick);
    runParticles(particles, gravityMasses);
    drawScene();
    animate();
}

createOrigins();
function webGLStart() {
    var canvas = document.getElementById("lesson04-canvas");
    initGL(canvas);
    initShaders()
    initBuffers();
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    tick();
}
