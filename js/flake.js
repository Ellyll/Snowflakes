"use strict";

var flakeApp = (function circles() {
  var sin = Math.sin;
  var cos = Math.cos;
  var PI = Math.PI;
  var random = Math.random;
  
  function _init() {
    var canvas = document.getElementById('flakeCanvas');
    var context = canvas.getContext('2d');
    _maximiseCanvas(canvas);

    var snowflakes = [];
    for (var i=0 ; i < 50 ; i++) {
      snowflakes.push(_makeNewSnowflake(canvas));
    }
    
    requestAnimationFrame(function (currentTime) { _draw(currentTime, currentTime, snowflakes, context ); });
  }
  
  function _makeNewSnowflake(canvas) {
      var radius = random() * Math.min(canvas.width, canvas.height) / 32;
      var x = random() * canvas.width;
      var y = - (random()*canvas.height);
      var velocity = [ 0, 0.05 + random()*0.05 ];
      var windVelocity = [ 0.0125 - random()*0.025, 0 ];
      return new Snowflake(x, y, radius, random()*PI/6, velocity, windVelocity, _generateFrondLengths);    
  }
  
  function Snowflake(x, y, radius, angle, velocity, windVelocity, frondGenerator) {
    this._x = x;
    this._y = y;
    this._radius = radius;
    this._angle = angle;
    this._frondLengths = frondGenerator(radius);
    this._velocity = velocity;
    this._windVelocity = windVelocity;
  }
  Snowflake.prototype = {
    get x() { return this._x; },
    get y() { return this._y; },
    get radius() { return this._radius; },
    get angle() { return this._angle; },
    get velocity() { return this._velocity; },
    get windVelocity() { return this._windVelocity; },
    get frondLengths() { return this._frondLengths; },
    get location() { return [ this._x, this._y ]; }
  };
    
  function _generateFrondLengths(radius) {
    var frondLengths = [];
    var numberOfFronds = 5;
    for (var i=0 ; i<numberOfFronds ; i++) {
      var maxLength = radius - (i+1)*(radius/(numberOfFronds+1));
      var frondLength = random() * maxLength;
      frondLengths.push(frondLength);
    }
    
    return frondLengths;
  }
  
  function _draw(currentTime, lastTime, snowflakes, context) {
    var deltaTime = currentTime - lastTime;
       
    var numberOfSnowflakes = snowflakes.length;
    
    var movedSnowflakes = snowflakes.map(function (snowflake) {
      var velocity = snowflake.velocity;

      var newWindSpeed = snowflake.windVelocity[0] + (0.002 - random()*0.004);
      var maxWindSpeed = 0.01;
      if (newWindSpeed > maxWindSpeed) newWindSpeed = maxWindSpeed;
      if (newWindSpeed < -maxWindSpeed) newWindSpeed = -maxWindSpeed;
      var windVelocity = [ newWindSpeed, snowflake.windVelocity[1] ];

      var location = _applyVelocityToLocation( [snowflake.x, snowflake.y], velocity, windVelocity, deltaTime);

      return new Snowflake(location[0], location[1], snowflake.radius, snowflake.angle, velocity, windVelocity, function() { return snowflake.frondLengths; });
    }).filter(function (snowflake) { return _isOnScreen(context, snowflake); });
    
    while(movedSnowflakes.length < numberOfSnowflakes) {
      movedSnowflakes.push(_makeNewSnowflake(context.canvas));
    }

    _clearCanvas(context);
    _drawSnowflakes(movedSnowflakes, context);

    var newLastTime = currentTime;
    requestAnimationFrame(function (newCurrentTime) { _draw(newCurrentTime, newLastTime, movedSnowflakes, context); });
  }
  
  function _drawSnowflakes(snowflakes, context) {
    for (var i=0 ; i<snowflakes.length ; i++) {
      _drawSnowflake(snowflakes[i], context);
    }
  }
  
  function _drawSnowflake(snowflake, context) {
    for (var angle = snowflake.angle ; angle < (PI*2)+snowflake.angle ; angle += PI*2/6)  {
      var x = snowflake.x + snowflake.radius * sin(angle);
      var y = snowflake.y + snowflake.radius * cos(angle);
      _drawLine(context, 'white', snowflake.x, snowflake.y, x, y);
      _drawFronds(snowflake.x, snowflake.y, snowflake.radius, angle, snowflake.frondLengths, context);
    }
  }
  
  function _drawFronds(cx, cy, radius, angle, frondLengths, context) {
    var numberOfFronds = frondLengths.length;
    
    for (var i=0 ; i<frondLengths.length ; i++) {
      var distanceFromCentre = (radius/(numberOfFronds+1))*(i+1);
      var x1 = cx + distanceFromCentre*sin(angle);
      var y1 = cy + distanceFromCentre*cos(angle);
      var x2 = x1 + frondLengths[i]*sin(angle - PI/6);
      var y2 = y1 + frondLengths[i]*cos(angle - PI/6);
      var x3 = x1 + frondLengths[i]*sin(angle + PI/6);
      var y3 = y1 + frondLengths[i]*cos(angle + PI/6);
      
      _drawLine(context, 'white', x1, y1, x2, y2);
      _drawLine(context, 'white', x1, y1, x3, y3);
    }
  }    
  
  function _drawLine(context, strokeStyle, x1, y1, x2, y2) {
      context.beginPath();
      context.strokeStyle = 'white';
      context.moveTo(x1, y1);    
      context.lineTo(x2, y2);
      context.stroke();    
  }
   
  function _applyVelocityToLocation(location, velocity, windVelocity, deltaTime) {
    if (deltaTime === 0) return location;
    
    return [
      location[0] += (velocity[0]+windVelocity[0]) * deltaTime,
      location[1] += (velocity[1]+windVelocity[1]) * deltaTime
    ];
  }
  
  function _isOnScreen(context, snowflake) {
    if ( 
          (snowflake.x - snowflake.radius > context.canvas.width) ||
          (snowflake.x + snowflake.radius < 0) ||
          (snowflake.y - snowflake.radius > context.canvas.height) ||
          (snowflake.y + snowflake.radius < -context.canvas.height) // (so can start snowflakes above screen)
      ) {
        return false;
    }
    
    return true;
  }
  
  function _maximiseCanvas(canvas) {
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
  }
  
  function _clearCanvas(context) {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);    
  }
  
  return {
	  init: _init
  };
})();
