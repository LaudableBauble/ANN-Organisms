function Brain(org)
{
	var self = this;
	self.organism = org;
	self.nodes = [];
	self.inputNodes = [];
	self.outputNodes = [];
	self.maxTick = 10;
	
	self.setOutputNode = function(nme, nde, clbk)
	{
		var on = { name: nme, node: nde, callback: clbk }
		self.outputNodes.push(on);
	}
	self.update = function()
	{
		var signalsToSend = [];
		
		//Get all signals to send.
		for (var i in self.nodes)
		{
			signalsToSend.push.apply(signalsToSend, self.nodes[i].createSignals());
		}
		
		//Send the output data back.
		for (var i in self.outputNodes)
		{
			self.outputNodes[i].callback(self.outputNodes[i].node.getValue());
		}
		
		//Send all signals forward one step.
		for (var i in signalsToSend)
		{
			signalsToSend[i].send();
		}
	}
	self.clone = function(org, mutate)
	{	
		var brain = new Brain(org);
		brain.maxTick = self.maxTick;
		
		//Create the nodes.
		for (var i in self.nodes)
		{
			brain.nodes.push(self.nodes[i].clone());
		}		
		for (var i in self.inputNodes)
		{
			brain.inputNodes.push(brain.nodes[self.inputNodes[i].id]);
		}	
		for (var i in self.outputNodes)
		{
			var callback = {};
			switch (self.outputNodes[i].name)
			{
				case "thrustR" : { callback = org.setRightThrust; break; }
				case "thrustL" : { callback = org.setLeftThrust; break; }
			}
			brain.setOutputNode(self.outputNodes[i].name, brain.nodes[self.outputNodes[i].node.id], callback);
		}
		
		//Setup each node's connections.
		for (var n in brain.nodes)
		{
			for (var c in self.nodes[n].connections)
			{
				var conn = self.nodes[n].connections[c];
				brain.nodes[n].addConnection(brain.nodes[conn.target.id], conn.weight + randomInt(-1, 1) * mutate);
			}
		}
		
		return brain;
	}
}

function Node(id)
{
	var self = this;
	self.id = id;
	self.bias = 0;
	self.values = [];
	self.connections = [];
	
	self.addConnection = function(targetNode, w)
	{
		var c = { target: targetNode, weight: w }
		self.connections.push(c);
	}
	self.recieveSignal = function(val, sourceNode)
	{
		if (isNaN(val)) { throw "Value is not a number!"; }
	
		var v = { value: val, source: sourceNode }
		self.values["Node" + sourceNode.id] = v;
	}
	self.createSignals = function()
	{
		//Get the value.
		var value = self.getValue();
		
		//Create all signals.
		var signals = [];
		for (var i in self.connections)
		{
			signals.push(new Signal(value * self.connections[i].weight, self, self.connections[i].target));
		}
		
		return signals;
	}
	self.getValue = function()
	{
		var value = self.combinationFunction();
		value = self.activationFunction(value);
		if (isNaN(value)) { throw "Value is not a number!"; }
		return value;
	}
	self.combinationFunction = function()
	{
		//Sum all incoming values.
		var value = 0;
		for (var i in self.values)
		{
			value += self.values[i].value;
		}
		
		//Subtract the bias.
		value -= self.bias;
		
		return value;
	}
	self.activationFunction = function(x)
	{
		return (1 - Math.pow(Math.E, -x))/(1 + Math.pow(Math.E, -x));
	}
	self.clone = function()
	{
		var node = new Node(self.id);
		node.bias = self.bias;
		
		return node;
	}
}

function Signal(value, sourceNode, targetNode)
{
	var self = this;
	self.value = value;
	self.sourceNode = sourceNode;
	self.targetNode = targetNode;
	
	self.send = function()
	{
		//if (b) { console.log("Node #" + self.targetNode.id + " was sent a signal!"); }
		self.targetNode.recieveSignal(self.value, self.sourceNode);
		return self.targetNode.createSignals();
	}
}