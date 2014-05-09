function getFittestOrganism()
{
	var org = items[0];
	for (var i = 0; i < items.length; i++)
	{
		if (items[i].energy > org.energy) { org = items[i]; }
	}
	
	return org;
}

function getRandomizedOrganism()
{
	var org = new Organism(0);
	org.x = randomInt(200, 1350);
	org.y = randomInt(50, 750);
	org.r = 15;
	org.speed = 10 / 10.0;
	org.dir.x = randomInt(-1, 1);
	org.dir.y = randomInt(-1, 1);
	org.energy = 1000;
	org.color = "4e6183";
	
	return org;
}

function Organism(id)
{
	var self = this;
	self.id = id;
	self.x = 100;
	self.y = 100;
	self.r = 5;
	self.color = "000";
	self.speed = 1;
	self.dir = new b2Vec2(0, 0);
	self.target = new b2Vec2(0, 0);
	self.thrustColor = "#0066FF";
	self.thrustPosR = new b2Vec2(0, 0);
	self.thrustPosL = new b2Vec2(0, 0);
	self.thrustR = new b2Vec2(0, 0);
	self.thrustL = new b2Vec2(0, 0);
	self.energy = 100;
	self.timesCopied = 0;
	self.timeBorn = new Date().getTime();
	
	self.initialize = function()
	{
		//The physical body.
		var fixDef = new b2FixtureDef;
        fixDef.density = 1.0;
        fixDef.friction = 0.5;
        fixDef.restitution = 0.9;
	
		var bodyDef = new b2BodyDef;
		bodyDef.type = b2Body.b2_dynamicBody;
		fixDef.shape = new b2CircleShape(self.r / PixelsPerMeter);
		bodyDef.position.x = self.x / PixelsPerMeter;
		bodyDef.position.y = self.y / PixelsPerMeter;
		self.body = world.CreateBody(bodyDef);
		self.body.CreateFixture(fixDef);
		
		self.body.SetUserData(self);
		
		//The eye.
		self.eye = new Eye(self.r * 5 / PixelsPerMeter);
		
		//The brain.
		getRandomizedBrain(self);
	}
	self.update = function()
	{	
		self.dir = angleToDirection(self.body.GetAngle() + Math.PI / 2);
		self.x = self.body.GetWorldCenter().x * PixelsPerMeter;
		self.y = self.body.GetWorldCenter().y * PixelsPerMeter;
		self.thrustPosR = new b2Vec2(self.x + - self.dir.y * self.r * .5, self.y + self.dir.x * self.r * .5);
		self.thrustPosL = new b2Vec2(self.x + + self.dir.y * self.r * .5, self.y - self.dir.x * self.r * .5);
		
		//Change the thrust color.
		var r = Math.min(Math.round(204 - Math.max(self.energy * .2, 0)), 255);
		var g = Math.min(Math.round(51 + Math.max(self.energy * .2, 0)), 255);
		var b = Math.min(Math.round(51 + Math.max(self.energy * .05, 0)), 255);
		self.healthColor = 'rgb(' + r + ', ' + g + ', ' + b + ')';
		
		self.move();
		
		var thrustNormR = Math.sqrt(self.thrustR.x * self.thrustR.x + self.thrustR.y * self.thrustR.y);
		var thrustNormL = Math.sqrt(self.thrustL.x * self.thrustL.x + self.thrustL.y * self.thrustL.y);
		self.thrustDirR = new b2Vec2(self.thrustR.x / thrustNormR, self.thrustR.y / thrustNormR);
		self.thrustDirL = new b2Vec2(self.thrustL.x / thrustNormL, self.thrustL.y / thrustNormL);
		r = Math.min(Math.round(50 + Math.max((Math.abs(self.thrustR.x) + Math.abs(self.thrustR.y)) * 30000, 0)), 255);
		g = r;
		b = 5;
		self.thrustColorR = 'rgb(' + r + ', ' + g + ', ' + b + ')';
		r = Math.min(Math.round(50 + Math.max((Math.abs(self.thrustL.x) + Math.abs(self.thrustL.y)) * 30000, 0)), 255);
		g = r;
		b = 5;
		self.thrustColorL = 'rgb(' + r + ', ' + g + ', ' + b + ')';
		
		self.eye.update(self.body.GetWorldCenter(), self.dir);
		var fraction = self.eye.raycast.fraction ? self.eye.raycast.fraction : 1;
		self.brain.inputNodes[0].recieveSignal(fraction, "sight");
		self.brain.inputNodes[1].recieveSignal(self.energy, "energy");
		self.brain.inputNodes[2].recieveSignal(self.body.GetAngularVelocity(), "rotVel");
		self.brain.inputNodes[3].recieveSignal(self.body.GetAngle() / 1000, "dir");
		self.brain.inputNodes[4].recieveSignal(self.body.GetLinearVelocity().x, "linVelX");
		self.brain.inputNodes[5].recieveSignal(self.body.GetLinearVelocity().y, "linVelY");
		self.brain.update();
	}
	self.draw = function()
	{
		if (self.id == 39)
		{
			var a = 0;
		}
	
		//Body.
		ctx.fillStyle = self.color;
		ctx.beginPath();
		ctx.arc(self.x, self.y, self.r, 0, 2 * Math.PI);
		ctx.fill();
		ctx.strokeStyle = "2e3a4e";
		ctx.beginPath();
		ctx.arc(self.x, self.y, self.r, 0, 2 * Math.PI);
		ctx.stroke();
		
		//Thrusters.
		ctx.fillStyle = self.healthColor;
		ctx.beginPath();
		ctx.arc(self.thrustPosR.x, self.thrustPosR.y, self.r * .12, 0, 2 * Math.PI);
		ctx.fill();
		ctx.beginPath();
		ctx.arc(self.thrustPosL.x, self.thrustPosL.y, self.r * .12, 0, 2 * Math.PI);
		ctx.fill();
		
		//Thruster power.
		ctx.fillStyle = self.thrustColorR;
		ctx.beginPath();
		ctx.arc(self.thrustPosR.x + self.thrustDirR.x * self.r * .3, self.thrustPosR.y + self.thrustDirR.y * self.r * .3, self.r * .1, 0, 2 * Math.PI);
		ctx.fill();
		ctx.fillStyle = self.thrustColorL;
		ctx.beginPath();
		ctx.arc(self.thrustPosL.x + self.thrustDirL.x * self.r * .3, self.thrustPosL.y + self.thrustDirL.y * self.r * .3, self.r * .1, 0, 2 * Math.PI);
		ctx.fill();
		
		if (self.id == 39)
		{
			var a = 0;
		}
		
		//Eye.
		self.eye.draw();
		
		//Draw debug text.
		ctx.font = "8px Arial";
		ctx.fillStyle = "#FF0000";
		ctx.fillText("#" + self.id + "     " + round(self.energy, 0), self.x - self.r, self.y - self.r - 3);
	}

	self.move = function()
	{
		//var thrust = new b2Vec2(randomInt(0, 100) * self.body.GetMass(), randomInt(0, 100) * self.body.GetMass());
		
		//if (Math.random() > .66)
		{
			self.body.ApplyForce(self.thrustR, new b2Vec2(self.thrustPosR.x / PixelsPerMeter, self.thrustPosR.y / PixelsPerMeter));
			self.body.ApplyForce(self.thrustL, new b2Vec2(self.thrustPosL.x / PixelsPerMeter, self.thrustPosL.y / PixelsPerMeter));
			var thrustE = 25 * (Math.abs(self.thrustR.x) + Math.abs(self.thrustR.y) + Math.abs(self.thrustL.x) + Math.abs(self.thrustL.y)) / 4;
			var rotE = Math.abs(self.body.GetAngularVelocity()) / 100;
			self.energy = Math.max(self.energy - thrustE - rotE, 0);
		}
	}
	self.setRightThrust = function(value)
	{
		value /= 10;
		self.thrustR = new b2Vec2(self.dir.x * value, self.dir.y * value);
	}
	self.setLeftThrust = function(value)
	{
		value /= 10;
		self.thrustL = new b2Vec2(self.dir.x * value, self.dir.y * value);
	}
	self.clone = function()
	{
		var org = new Organism();
		org.r = self.r;
		org.color = self.color;
		org.speed = self.speed;
		
		org.initialize();
		
		org.brain = self.brain.clone();
	}
	self.reset = function()
	{
		self.energy = 1000;
		self.body.SetAngularVelocity(0);
		self.timesCopied = 0;
		self.timeBorn = new Date().getTime();
	}
}

function Eye(length)
{
	var self = this;
	self.position = new b2Vec2(0, 0);
	self.dir = new b2Vec2(0, 0);
	self.length = length;
	self.target = new b2Vec2(0, 0);
	self.sight = new b2Vec2(0, 0);
	self.raycast = null;
	
	self.update = function(position, dir)
	{
		self.position = position;
		self.dir = dir;
		
		//Do the raycast.
		self.raycast = new RayCastCallback();
		self.target = new b2Vec2(self.position.x + self.dir.x * self.length, self.position.y + self.dir.y * self.length);
		self.raycast.point.x = self.target.x;
		self.raycast.point.y = self.target.y;
		world.RayCast(self.raycast.reportFixture, self.position, self.target);
		
		//Get the sight area point.
		self.sight = new b2Vec2(self.raycast.point.x * PixelsPerMeter - self.dir.x * 2, self.raycast.point.y * PixelsPerMeter - self.dir.y * 2);
		
		//Get the pixel data at the raycast intersection point.
		if (self.raycast.point.x != -1)
		{
			//var imgd = ctx.getImageData(self.sight.x, self.sight.y, 5, 5);
			//var pix = imgd.data;
		}
	}
	self.draw = function()
	{
		var x = self.position.x * PixelsPerMeter;
		var y = self.position.y * PixelsPerMeter;
		
		//Full sight line.
		ctx.beginPath();
		ctx.strokeStyle = "#458B00";
		ctx.moveTo(x, y);
		ctx.lineTo(self.target.x * PixelsPerMeter, self.target.y * PixelsPerMeter);
		ctx.stroke();
		
		//Free sight line.
		ctx.beginPath();
		ctx.strokeStyle = "#FF0000";
		ctx.moveTo(x, y);
		ctx.lineTo(self.sight.x + self.dir.x * 2, self.sight.y + self.dir.y * 2);
		ctx.stroke();
		
		//Sight area.
		ctx.fillStyle = "#FF0000";
		ctx.beginPath();
		ctx.arc(self.sight.x + self.dir.x * 2 - 1 * self.dir.x, self.sight.y + self.dir.y * 2 - 1 * self.dir.y, 2, 0, 2 * Math.PI);
		ctx.fill();
	}
}