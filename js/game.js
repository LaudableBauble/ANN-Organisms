var c = document.getElementById("gameCanvas");
var ctx = c.getContext("2d");

var b2Vec2 = Box2D.Common.Math.b2Vec2, b2AABB = Box2D.Collision.b2AABB,	b2BodyDef = Box2D.Dynamics.b2BodyDef,
b2Body = Box2D.Dynamics.b2Body,	b2FixtureDef = Box2D.Dynamics.b2FixtureDef,	b2Fixture = Box2D.Dynamics.b2Fixture,
b2World = Box2D.Dynamics.b2World, b2MassData = Box2D.Collision.Shapes.b2MassData, b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape,b2CircleShape = Box2D.Collision.Shapes.b2CircleShape, b2DebugDraw = Box2D.Dynamics.b2DebugDraw,
b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef;

var PixelsPerMeter = 100;
var started = 0;

var world;
var ground;
var items = new Array();
var tick = 0;
var time = 0;
var respawns = 0;
var inContact = [];
var fittest = null;
var selected = null;

function setup()
{
	//The mouse events.
	c.addEventListener("mousedown", selectOrganism, false);
	
	//Save the start time.
	started = new Date().getTime();
	
	//Initialize the world.	
	world = new b2World(new b2Vec2(0, 0), true);
	
	//Enable collisions to alter the organisms' energy.
	var listener = new Box2D.Dynamics.b2ContactListener;
	world.SetContactListener(listener);
	listener.BeginContact = function(contact)
	{
		if (contact.GetFixtureA().GetBody().GetUserData())
		{
			inContact[items.indexOf(contact.GetFixtureA().GetBody().GetUserData())] = true;
		}
		if (contact.GetFixtureB().GetBody().GetUserData())
		{
			inContact[items.indexOf(contact.GetFixtureB().GetBody().GetUserData())] = true;
		}
	}
	listener.EndContact = function(contact)
	{
		if (contact.GetFixtureA().GetBody().GetUserData())
		{
			inContact[items.indexOf(contact.GetFixtureA().GetBody().GetUserData())] = false;
		}
		if (contact.GetFixtureB().GetBody().GetUserData())
		{
			inContact[items.indexOf(contact.GetFixtureB().GetBody().GetUserData())] = false;
		}
	}
	
	var fixDef = new b2FixtureDef;
	fixDef.density = 1.0;
	fixDef.friction = 0.5;
	fixDef.restitution = 0.2;
	 
	var bodyDef = new b2BodyDef;
	 
	//Create the ground, walls and ceiling.
	bodyDef.type = b2Body.b2_staticBody;
	fixDef.shape = new b2PolygonShape;
	
	//Horizontal.
	fixDef.shape.SetAsBox(1400 / PixelsPerMeter, 20 / PixelsPerMeter);
	bodyDef.position.Set(0 / PixelsPerMeter, 820 / PixelsPerMeter);
	world.CreateBody(bodyDef).CreateFixture(fixDef);
	bodyDef.position.Set(0 / PixelsPerMeter, -20 / PixelsPerMeter);
	world.CreateBody(bodyDef).CreateFixture(fixDef);
	
	//Vertical.
	fixDef.shape.SetAsBox(20 / PixelsPerMeter, 800 / PixelsPerMeter);
	bodyDef.position.Set(150 / PixelsPerMeter, 0 / PixelsPerMeter);
	world.CreateBody(bodyDef).CreateFixture(fixDef);
	bodyDef.position.Set(1420 / PixelsPerMeter, 0 / PixelsPerMeter);
	world.CreateBody(bodyDef).CreateFixture(fixDef);

	for (var i = 0; i < 40; i++)
	{
		items[i] = getRandomizedOrganism();
	}
	
	//Initialize all items.
	for (var i = 0; i < items.length; i++)
	{
		items[i].initialize();
		items[i].id = i;
	}
	
	fittest = items[0];
	selected = items[0];
	
	//Setup debug draw.
	var debugDraw = new b2DebugDraw();
	debugDraw.SetSprite(ctx);
	debugDraw.SetDrawScale(PixelsPerMeter);
	debugDraw.SetFillAlpha(0.5);
	debugDraw.SetLineThickness(1.0);
	debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
	world.SetDebugDraw(debugDraw);

	gameLoop();
}

function gameLoop()
{
	//Clear the canvas.
	ctx.fillStyle = "#FFF";
	ctx.fillRect(0,0,1400,800);
	
	//Alter the graviy.
	/*if (tick >= 0 && tick < 100) { world.SetGravity(new b2Vec2(0, .1)); }
	else if (tick >= 500 && tick < 600) { world.SetGravity(new b2Vec2(0, -.1)); }
	else { world.SetGravity(new b2Vec2(0, 0)); }*/

	//Update the world.
	var timeStep = 1.0/60;
	var iteration = 1;
	world.Step(timeStep, iteration);
	world.ClearForces();
	
	//Update and draw all items.
	for (var i = 0; i < items.length; i++)
	{
		items[i].update();
		items[i].draw();
		
		if (inContact[i]) { items[i].energy = Math.max(items[i].energy - 2, 0); }
	}
	
	//Evolution.
	for (var i in items)
	{
		if (items[i].energy <= 0)
		{
			var brain = getRandomAliveBrain();
			fittest = brain.organism;
			fittest.timesCopied++;
			items[i].brain = brain.clone(items[i], .1);
			items[i].reset();
			respawns++;
		}
	}
	/*if (tick >= 1000)
	{
		fittest = getFittestOrganism();
		for (var i in items)
		{
			items[i].brain = fittest.brain.clone(items[i], .1);
			items[i].energy = 1000;
		}
		items[items.length - 1].brain = fittest.brain.clone(items[items.length - 1], .8);
		
		tick = 0;
		generations++;
	}
	tick++;*/
	
	world.DrawDebugData();
	
	//Draw debug text.
	var now = new Date().getTime();
	ctx.font = "12px Arial";
	ctx.fillStyle = "#FF0000";
	ctx.fillText("Respawns: " + respawns, 10, 25);
	time = round((now - started) / 1000, 1);
	ctx.fillText("Time: " + time + " s", 10, 40);
	var t = 0;
	for (var i in items)
	{
		t += (now - items[i].timeBorn);
	}
	t = round(t / items.length / 1000, 0);
	ctx.fillText("MeanTimeAlive: " + t + " s", 10, 55);
	for (var i in items)
	{
		var e = round(items[i].energy, 0);
		var t = round((now - items[i].timeBorn) / 1000, 0);
		var c = items[i].timesCopied;
		ctx.fillText("#" + i + " - E" + e + " T" + t + " C" + c, 10, 75 + 15 * i);
	}
	ctx.fillText("Ancestor: #" + fittest.id, 10, 75 + 15 * items.length + 20);
	
	ctx.fillText("Selected: #" + selected.id, 10, 75 + 15 * items.length + 60);
	ctx.fillText("TR: (" + round(selected.thrustR.x, 4) + ", " + round(selected.thrustR.y, 4) + ")", 15, 75 + 15 * items.length + 75);
	ctx.fillText("TL: (" + round(selected.thrustL.x, 4) + ", " + round(selected.thrustL.y, 4) + ")", 15, 75 + 15 * items.length + 90);
	
	//Paint the brain.
	
	requestAnimationFrame(gameLoop);
}

function selectOrganism(event)
{
	for (var i in items)
	{
		var x = items[i].x;
		var y = items[i].y;
		var r = items[i].r;
		
		if (event.pageX > x - r && event.pageX < x + r && event.pageY > y - r && event.pageY < y + r)
		{
			selected = items[i];
		}
	}
}

function round(number, decimals)
{
	var newnumber = new Number(number + '').toFixed(parseInt(decimals));
	return parseFloat(newnumber);
}

function getRandomAliveBrain()
{
	var alive = [];
	for (var i in items)
	{
		alive.push(items[i]);
	}
	
	return alive[randomInt(0, alive.length - 1)].brain;
}

function getRandomizedBrain(org)
{
	//The brain.
	var brain = new Brain(org);
	for (var i = 0; i < 13; i++)
	{
		brain.nodes.push(new Node(i));
	}
	
	brain.inputNodes.push(brain.nodes[0]);
	brain.inputNodes.push(brain.nodes[1]);
	brain.inputNodes.push(brain.nodes[2]);
	brain.inputNodes.push(brain.nodes[3]);
	brain.inputNodes.push(brain.nodes[4]);
	brain.inputNodes.push(brain.nodes[5]);
	brain.setOutputNode("thrustR", brain.nodes[11], org.setRightThrust);
	brain.setOutputNode("thrustL", brain.nodes[12], org.setLeftThrust);
	
	//Input.
	brain.nodes[0].addConnection(brain.nodes[6], randomInt(-10, 10) / 10);
	brain.nodes[0].addConnection(brain.nodes[7], randomInt(-10, 10) / 10);
	brain.nodes[0].addConnection(brain.nodes[8], randomInt(-10, 10) / 10);
	brain.nodes[1].addConnection(brain.nodes[6], randomInt(-10, 10) / 10);
	brain.nodes[1].addConnection(brain.nodes[7], randomInt(-10, 10) / 10);
	brain.nodes[1].addConnection(brain.nodes[8], randomInt(-10, 10) / 10);
	brain.nodes[2].addConnection(brain.nodes[6], randomInt(-10, 10) / 10);
	brain.nodes[2].addConnection(brain.nodes[7], randomInt(-10, 10) / 10);
	brain.nodes[2].addConnection(brain.nodes[8], randomInt(-10, 10) / 10);
	brain.nodes[3].addConnection(brain.nodes[6], randomInt(-10, 10) / 10);
	brain.nodes[3].addConnection(brain.nodes[7], randomInt(-10, 10) / 10);
	brain.nodes[3].addConnection(brain.nodes[8], randomInt(-10, 10) / 10);
	brain.nodes[4].addConnection(brain.nodes[6], randomInt(-10, 10) / 10);
	brain.nodes[4].addConnection(brain.nodes[7], randomInt(-10, 10) / 10);
	brain.nodes[4].addConnection(brain.nodes[8], randomInt(-10, 10) / 10);
	brain.nodes[5].addConnection(brain.nodes[6], randomInt(-10, 10) / 10);
	brain.nodes[5].addConnection(brain.nodes[7], randomInt(-10, 10) / 10);
	brain.nodes[5].addConnection(brain.nodes[8], randomInt(-10, 10) / 10);
	
	//First hidden layer.
	brain.nodes[6].addConnection(brain.nodes[9], randomInt(-10, 10) / 10);
	brain.nodes[6].addConnection(brain.nodes[10], randomInt(-10, 10) / 10);
	brain.nodes[7].addConnection(brain.nodes[9], randomInt(-10, 10) / 10);
	brain.nodes[7].addConnection(brain.nodes[10], randomInt(-10, 10) / 10);
	brain.nodes[8].addConnection(brain.nodes[9], randomInt(-10, 10) / 10);
	brain.nodes[8].addConnection(brain.nodes[10], randomInt(-10, 10) / 10);
	
	//Second hidden layer.
	brain.nodes[9].addConnection(brain.nodes[11], randomInt(-10, 10) / 10);
	brain.nodes[9].addConnection(brain.nodes[12], randomInt(-10, 10) / 10);
	brain.nodes[10].addConnection(brain.nodes[11], randomInt(-10, 10) / 10);
	brain.nodes[10].addConnection(brain.nodes[12], randomInt(-10, 10) / 10);
	
	org.brain = brain;
}

function RayCastCallback()
{
	self = this;
	self.fixture = null;
	self.point = new b2Vec2(0, 0);
	self.normal = null;
	self.fraction = null;
	
	self.reportFixture = function(fixture, point, normal, fraction)
	{        
		self.fixture = fixture;
		self.point = point;
		self.normal = normal;
		self.fraction = fraction;
		return fraction;
	}
}

function randomInt(min, max)
{
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function angleToDirection(angle)
{
	return new b2Vec2(Math.sin(angle), -Math.cos(angle));
}

function Food()
{
	var self = this;
	self.x = 100;
	self.y = 100;
	self.r = 5;
	self.color = "FF0000";
	self.speed = .05;
	self.dirX = 1;
	self.dirY = 1;
	self.energy = 100;
	
	self.update = function()
	{
		self.x += self.dirX * self.speed;
		self.y += self.dirY * self.speed;
	}
	self.draw = function()
	{
		ctx.fillStyle = self.color;
		ctx.beginPath();
		ctx.arc(self.x - self.r / 2, self.y - self.r / 2, self.r, 0, 2 * Math.PI);
		ctx.fill();
	}
}