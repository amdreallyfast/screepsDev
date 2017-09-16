
let roomEnergyLevels = require("room.energyLevelMonitoring");
let myConstants = require("myConstants");


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
            //lowPriority: {},
            //medPriority: {},
            //highPriority: {},
            //criticalPriority: {}
        };
    }
};

let haveBuildRequest = function (room) {
    let roomBuildQueues = Memory.creepBuildQueues[room.name];
    if (roomBuildQueues.criticalPriority.length > 0 ||
        roomBuildQueues.highPriority.length > 0 ||
        roomBuildQueues.medPriority.length > 0 ||
        roomBuildQueues.lowPriority.length > 0) {
        return true;
    }

    return false;
};

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
    //let roomBuildQueues = Memory.creepBuildQueues[room.name];
    //for (let key in roomBuildQueues) {
    //    let queue = roomBuildQueues[key];
    //    let existingBuildRequest = queue[newBuildRequest.name];
    //    if (existingBuildRequest !== null && existingBuildRequest !== undefined) {
    //        return true;
    //    }
    //}

    return false;
}

module.exports = {
    // in the event of disaster and creeps can't be built
    clear: function (room) {
        delete Memory.creepBuildQueues[room.name];
    },

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

        console.log("room " + room.name + " build queues: \n\t" +
            criticalPriorityQueueStr + "\n\t" +
            highPriorityQueueStr + "\n\t" + 
            medPriorityQueueStr + "\n\t" +
            lowPriorityQueueStr);
    },

    constructNextCreepInQueue: function (spawn) {
        let room = spawn.room;
        ensureCreepBuildQueueExist(room);

        if (spawn.spawning) {
            console.log(spawn.name + " is busy spawning")
            return;
        }

        if (!haveBuildRequest(room)) {
            console.log("no build requests for creeps for " + room.name);
            return;
        }

        if (!canCreateNextCreep(spawn)) {
            return false;
        }

        let buildRequest = getNextBuildRequest(room);

        let result = spawn.createCreep(buildRequest.body, buildRequest.name, parseForAdditionalArguments(buildRequest));
        console.log(spawn.name + " attempting to spawn creep '" + buildRequest.name + "' with body '" + buildRequest.body + "' in room " + room.name + "; result = " + result);
    },

    // expected "buildThis" format:
    // - body: [...]
    // - role: "..."
    // - name: "..."
    // - (additional arguments depend on the role)
    submit: function (buildThis, room, priority) {
        ensureCreepBuildQueueExist(room);

        let result = duplicateBuildRequest(buildThis, room);
        if (result) {
            console.log("duplicate creep build request: " + buildThis.name);
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
