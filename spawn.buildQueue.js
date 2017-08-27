
var creepBuildQueues = {}

var SpawnBuildQueue = {
    submit: function(buildThis) {
        if (!creepBuildQueues[spawn]) {
            // must be a new spawn; make a build queue
            creepBuildQueues[spawn] = [];
        }
        
        // check if it already exists
        for (var buildRequest in creepBuildQueues) {
            if (buildRequest === buildThis) {
                return;
            }
        }
        
        // don't have this job, so make it happen
        creepBuildQueues[spawn].push(buildThis);
    },
    
    haveBuildJob: function(spawn) {
        if (!creepBuildQueues[spawn]) {
            // don't even have a build queue
            return false;
        }
        
        return (creepBuildQueues[spawn].length > 0);
    },
    
    requiredEnergyForNext: function(spawn) {
        if (!creepBuildQueues[spawn]) {
            // don't even have a build queue
            return 0;
        }
        
        let buildRequest = creepBuildQueues[spawn];
        let energyCost = 0;
        for (let part in buildRequest.body) {
            if (part === WORK) {
                energyCost += 100;
            }
            else if (part === MOVE) {
                energyCost += 50;
            }
            else if (part === CARRY) {
                energyCost += 50;
            }
            else {
                // TODO: other body parts
            }
        }
        
        return energyCost;
    },
    
    getNext: function(spawn) {
        if (!creepBuildQueues[spawn]) {
            // don't even have a build queue
            return null;
        }
        else if (creepBuildQueues[spawn].length === 0) {
            return null;
        }
        
        // array.pop() removes the last element, but I want a FIFO queue
        return creepBuildQueues.shift();
    }
}

module.exports = SpawnBuildQueue;
