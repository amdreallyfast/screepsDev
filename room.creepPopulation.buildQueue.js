
let roomEnergyLevels = require("room.energyLevelMonitoring");
let myConstants = require("myConstants");


/*------------------------------------------------------------------------------------------------
Description:
    Ensures that memory is defined before attempting to access it.  
Creator:    John Cox, 9/2017
------------------------------------------------------------------------------------------------*/
let ensureCreepBuildQueueExist = function (room) {
    if (!Memory.creepBuildQueues) {
        Memory.creepBuildQueues = {};
    }
    if (!Memory.creepBuildQueues[room.name]) {
        Memory.creepBuildQueues[room.name] = {
            lowPriority: [],
            medPriority: [],
            highPriority: [],
            criticalPriority: []
        };
    }
};

/*------------------------------------------------------------------------------------------------
Description:
    Uses the result of spawn.canCreateCreep(...) to determine if the next creep in the queue can 
    be constructed.  
    Thigns to consider:
    - If there was an oversimplified creep naming scheme, then a creep of the same name could 
        already exist and this build request cannot be satisfied.
    - If the required energy to build this creep is not available, and energy level monitoring 
        has determined that the energy will not be available in the foreseeable future, then 
        this build request cannot be satisfied.
    - If the build request has invalid arguments, then this build request cannot be satisfied.
    - If the room controller's level is too low to use this spawn 
        (??under what circumstances would this be??), then this build request cannot be satisfied.

    If a build request cannot be satisfied, dump the request.
Creator:    John Cox, 9/2017
------------------------------------------------------------------------------------------------*/
let canCreateCreepWithErrorChecking = function (spawn, queue) {
    // Note: Cost of canCreateCreep(...) is AVERAGE, so try not to use it every tick.
    while (queue.length > 0) {
        let nextCreep = queue[0];
        let result = spawn.canCreateCreep(nextCreep.body, nextCreep.name);

        if (result === OK) {
            return true;
        }
        else if (result === ERR_NAME_EXISTS) {
            // delete duplicates 
            // Note: Duplicates can slip in if the spawn is creating a creep.  The function 
            // duplicateBuildRequest(...) could conceivably look through all game spawns and 
            // isolate the ones in that room and then check some special memory that is recording 
            // which build requests are active, but it is easier to remove duplicates than to 
            // prevent them.
            console.log(spawn.name + ": creep " + nextCreep.name + " already exists; dumping spawn request");
            queue.shift();
            // next
        }
        else if (result === ERR_NOT_ENOUGH_ENERGY) {
            // keep waiting
            console.log(spawn.name + ": not enough energy available to build next creep");
            if (!roomEnergyLevels.canAffordEnergyLevel(spawn.room, nextCreep.energyRequired)) {
                console.log("room will not have " + nextCreep.energyRequired + " energy in the foreseeable future; dumping spawn request");
                queue.shift();
            }
            else {
                console.log("waiting for room to afford " + nextCreep.energyRequired + " energy")
            }
            break;
        }
        else if (result === ERR_INVALID_ARGS) {
            console.log(spawn.name + ": invalid arguments attempting to create creep '" + nextCreep.name + "'; dumping spawn request");
            queue.shift();
            // next
        }
        else if (result === ERR_RCL_NOT_ENOUGH) {
            console.log(spawn.name + ": creep build request submitted (" + nextCreep.name + " [" + nextCreep.body + "]), but RCL is not high enough; dumping spawn request");
            queue.shift();
            // next
        }
        else {
            // not owner, or some other error that I am not checking right now
        }
    }

    return false;
}


/*------------------------------------------------------------------------------------------------
Description:
    Calls the creep checking function for the various creep build queues in order of priority.
Creator:    John Cox, 9/2017
------------------------------------------------------------------------------------------------*/
let canCreateNextCreep = function (spawn) {
    // Note: Unlike duplicateBuildRequest(...), which is just looking for a duplicate in any of the queues, the "next creep" must take into the queue priorities.
    let roomBuildQueues = Memory.creepBuildQueues[spawn.room.name];
    if (roomBuildQueues.criticalPriority.length > 0) {
        return canCreateCreepWithErrorChecking(spawn, roomBuildQueues.criticalPriority);
    }
    else if (roomBuildQueues.highPriority.length > 0) {
        return canCreateCreepWithErrorChecking(spawn, roomBuildQueues.highPriority);
    }
    else if (roomBuildQueues.medPriority.length > 0) {
        return canCreateCreepWithErrorChecking(spawn, roomBuildQueues.medPriority);
    }
    else if (roomBuildQueues.lowPriority.length > 0) {
        return canCreateCreepWithErrorChecking(spawn, roomBuildQueues.lowPriority);
    }
    else {
        // all empty
        return false;
    }
}

/*------------------------------------------------------------------------------------------------
Description:
    Pops the next build request off the creep build queues in order of priority.
Creator:    John Cox, 9/2017
------------------------------------------------------------------------------------------------*/
let getNextBuildRequest = function (room) {
    // Note: Array.pop() removes the last element, but I want a FIFO queue
    let roomBuildQueues = Memory.creepBuildQueues[room.name];
    if (roomBuildQueues.criticalPriority.length > 0) {
        return roomBuildQueues.criticalPriority.shift();
    }
    else if (roomBuildQueues.highPriority.length > 0) {
        return roomBuildQueues.highPriority.shift();
    }
    else if (roomBuildQueues.medPriority.length > 0) {
        return roomBuildQueues.medPriority.shift();
    }
    else if (roomBuildQueues.lowPriority.length > 0) {
        return roomBuildQueues.lowPriority.shift();
    }
    else {
        // all empty
        return null;
    }
}

/*------------------------------------------------------------------------------------------------
Description:
    A convenience function that allows the creep population maintenance functions to request 
    creeps with whatever memory they want.  This function creates a new object out of the build 
    request with everything but the creep body and name, which are separate required arguments 
    to spawn.createCreep(...).
Creator:    John Cox, 9/2017
------------------------------------------------------------------------------------------------*/
let parseForAdditionalArguments = function (buildRequest) {
    let optionalArguments = {};
    for (let key in buildRequest) {
        if (key === "body" || key === "name") {
            continue;
        }
        optionalArguments[key] = buildRequest[key];
    }
    return optionalArguments;
}

/*------------------------------------------------------------------------------------------------
Description:
    Checks all creep build queues to see if the submitted build request already exists.

    Note: This checking could be eliminated if the build queues were moved to a hash-based 
    system instead of a FIFO queue, but then the benefits of a queue would be lost.  There is no 
    guaranteed order of operation "for (let key in object)", so it is possible that some creeps 
    may never be built because their hash is always at the end of the loop, but a FIFO queue 
    will always get to everything in time.  
    
    The downside of a queue is that it can be bloated with duplicate build requests without a 
    check like this function performs.
Creator:    John Cox, 9/2017
------------------------------------------------------------------------------------------------*/
let duplicateBuildRequest = function (newBuildRequest, room) {
    // there are not very many creeps per room, so this function is not very expensive despite 
    // the nested loop 
    // Note: This is also a little easier to use than an object with creep names as hashed keys 
    // because of the built-in FIFO mechanism via push-pop.
    let roomBuildQueues = Memory.creepBuildQueues[room.name];
    for (let key in roomBuildQueues) {
        let queue = roomBuildQueues[key];
        for (let index in queue) {
            let existingBuildRequest = queue[index];
            if (newBuildRequest.role === existingBuildRequest.role &&
                newBuildRequest.name === existingBuildRequest.name) {
                return true;
            }
        }
    }

    return false;
}

module.exports = {
    /*--------------------------------------------------------------------------------------------
	Description:
        Convenience.  Creates a nicely formatted printout of all the creeps in all the build 
        queues.
	Creator:    John Cox, 9/2017
	--------------------------------------------------------------------------------------------*/
    print: function (room) {
        ensureCreepBuildQueueExist(room);
        let queue = [];

        queue = Memory.creepBuildQueues[room.name].criticalPriority;
        let criticalPriorityQueueStr = "critical: (" + queue.length + ") { ";
        queue.forEach(function (buildRequest) {
            criticalPriorityQueueStr += (buildRequest.name + "; ");
        });
        criticalPriorityQueueStr += "}";

        queue = Memory.creepBuildQueues[room.name].highPriority;
        let highPriorityQueueStr = "high: (" + queue.length + ") { ";
        queue.forEach(function (buildRequest) {
            highPriorityQueueStr += (buildRequest.name + "; ");
        });
        highPriorityQueueStr += "}";

        queue = Memory.creepBuildQueues[room.name].medPriority;
        let medPriorityQueueStr = "med: (" + queue.length + ") { ";
        queue.forEach(function (buildRequest) {
            medPriorityQueueStr += (buildRequest.name + "; ");
        });
        medPriorityQueueStr += "}";

        queue = Memory.creepBuildQueues[room.name].lowPriority;
        let lowPriorityQueueStr = "low: (" + queue.length + ") { ";
        queue.forEach(function (buildRequest) {
            lowPriorityQueueStr += (buildRequest.name + "; ");
        });
        lowPriorityQueueStr += "}";

        console.log("room " + room.name + " creep build queues: \n\t" +
            criticalPriorityQueueStr + "\n\t" +
            highPriorityQueueStr + "\n\t" + 
            medPriorityQueueStr + "\n\t" +
            lowPriorityQueueStr);
    },

    /*--------------------------------------------------------------------------------------------
	Description:
        All the supporting code is to allow spawns to agnostically acquire creep build requests 
        that are already prioritized and examined for whether or not they can be built.
	Creator:    John Cox, 9/2017
	--------------------------------------------------------------------------------------------*/
    constructNextCreepInQueue: function (spawn) {
        let room = spawn.room;
        ensureCreepBuildQueueExist(room);

        if (spawn.spawning) {
            console.log(spawn.name + " is busy spawning")
            return;
        }

        if (!canCreateNextCreep(spawn)) {
            // no build requests or not enough energy
            return false;
        }

        let buildRequest = getNextBuildRequest(room);

        let result = spawn.createCreep(buildRequest.body, buildRequest.name, parseForAdditionalArguments(buildRequest));
        console.log(spawn.name + " attempting to spawn creep '" + buildRequest.name + "' with body [" + buildRequest.body + "] in room " + room.name + "; result = " + result);
    },

    /*--------------------------------------------------------------------------------------------
	Description:
        The modules that maintain creep populations call this function to submit their creep 
        build requests.  This function checks for duplicate build requests before submitting 
        them to the queue of the requested priority.

        Expected "buildThis" format:
        - body: [...]
        - role: "..."
        - name: "..."
        - (additional arguments depend on the role)
	Creator:    John Cox, 9/2017
	--------------------------------------------------------------------------------------------*/
    submit: function (buildThis, room, priority) {
        ensureCreepBuildQueueExist(room);

        let result = duplicateBuildRequest(buildThis, room);
        if (result) {
            //console.log("duplicate creep build request: " + buildThis.name);
            return false;
        }

        let str = "new creep build request of priority " + priority +": {";
        for (let key in buildThis) {
            str += key + ": " + buildThis[key] + ", ";
        }
        console.log(str);
        if (priority === myConstants.creepBuildPriorityLow) {
            Memory.creepBuildQueues[room.name].lowPriority.push(buildThis);
        }
        else if (priority === myConstants.creepBuildPriorityMed) {
            Memory.creepBuildQueues[room.name].medPriority.push(buildThis);
        }
        else if (priority === myConstants.creepBuildPriorityHigh) {
            Memory.creepBuildQueues[room.name].highPriority.push(buildThis);
        }
        else if (priority === myConstants.creepBuildPriorityCritical) {
            Memory.creepBuildQueues[room.name].criticalPriority.push(buildThis);
        }
        else {
            console.log("unknown build priority '" + priority + "'; discarding creep build request");
        }

        return true;
    }
}
