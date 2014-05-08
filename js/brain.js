function Brain()
{
	var self = this;
	self.nodes = [];
	self.inputNodes = [];
	self.outputNodes = [];
	self.maxTick = 10;
	self.b = true;
	
	self.setOutputNode = function(n, c)
	{
		var on = { node: n, callback: c }
		self.outputNodes.push(on);
	}
	self.update = function()
	{
		var signalsToSend = [];
		var nextBatch = [];
		var tick = 0;
		
		//Activate the input nodes.
		for (var i in self.inputNodes)
		{
			signalsToSend.push.apply(signalsToSend, self.inputNodes[i].createSignals());
		}
		
		//While there are signals left to send and not enough time has progressed.
		while (signalsToSend.length > 0 && tick <= self.maxTick)
		{
			for (var s in signalsToSend)
			{
				nextBatch.push.apply(nextBatch, signalsToSend[s].send(self.b));
			}
			
			signalsToSend = [];
			for (var i in nextBatch)
			{
			    signalsToSend[i] = nextBatch[i];
			}
			nextBatch = [];
			
			tick++;
		}
		
		self.b = false;
		
		//Send the output data back.
		for (var i in self.outputNodes)
		{
			self.outputNodes[i].callback(self.outputNodes[i].node.getValue());
		}
	}
	self.clone = function(mutate)
	{	
		var brain = new Brain();
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
			if (typeof self.outputNodes[i].node == 'undefined')
			{
				var a = 0;
			}
			
			brain.setOutputNode(brain.nodes[self.outputNodes[i].node.id], self.outputNodes[i].callback);
		}
		
		//Setup each node's connections.
		for (var n in brain.nodes)
		{
			for (var c in brain.nodes[n].connections)
			{
				var conn = self.nodes[n].connections[c];
				brain.nodes[n].addConnection(brain.nodes[conn.target.id], conn.weight * getRandomInt(-1, 1) * mutate);
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
	
	self.send = function(b)
	{
		//if (b) { console.log("Node #" + self.targetNode.id + " was sent a signal!"); }
		self.targetNode.recieveSignal(self.value, self.sourceNode);
		return self.targetNode.createSignals();
	}
}