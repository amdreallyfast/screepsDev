
let roomEnergyLevels = require("room.energyLevelMonitoring");


let ensureCreepBuildQueueExist = function (room) {
    if (!Memory.creepBuildQueues) {
        Memory.creepBuildQueues = {};
    }
    if (!Memory.creepBuildQueues[room.name]) {
        Memory.creepBuildQueues[room.name] = [];
    }
};

let haveBuildRequest = function (room) {
    return (Memory.creepBuildQueues[room.name].length > 0);
};

let canCreateNextCreep = function (spawn) {
    let buildQueue = Memory.creepBuildQueues[spawn.room.name];
    if (buildQueue.length === 0) {
        return false;
    }

    if (spawn.spawning) {
        return false
    }

    // Note: Cost of canCreateCreep(...) is AVERAGE, so try not to use it every tick.
    while (buildQueue.length > 0) {
        let nextCreep = buildQueue[0];
        let result = spawn.canCreateCreep(nextCreep.body, nextCreep.name);

        if (result === OK) {
            return true;
        }
        else if (result === ERR_NAME_EXISTS) {
            // delete duplicates 
            // Note: Duplicates can slip in if the spawn is creating a creep.  The function 
            // checkForDuplicateBuildRequest(...) could conceivably look through all game spawns and 
            // isolate the ones in that room and then check some special memory that is recording 
            // which build requests are active, but it is easier to remove duplicates than to 
            // prevent them.
            console.log(spawn.name + ": creep " + nextCreep.name + " already exists; dumping spawn request");
            buildQueue.shift();
            // next
        }
        else if (result === ERR_NOT_ENOUGH_ENERGY) {
            // keep waiting
            console.log(spawn.name + ": not enough energy available to build next creep");
            if (!roomEnergyLevels.canAffordEnergyLevel(spawn.room, nextCreep.energyRequired)) {
                console.log("room has " + spawn.room.energyAvailable + " energy; unable to afford " + nextCreep.energyRequired + " energy");
                buildQueue.shift();
            }
            else {
                console.log("waiting for room to afford " + nextCreep.energyRequired + " energy")
            }
            break;
        }
        else if (result === ERR_INVALID_ARGS) {
            console.log(spawn.name + ": invalid arguments attempting to create creep '" + nextCreep.name + "'");
            buildQueue.shift();
            // next
        }
        else if (result === ERR_RCL_NOT_ENOUGH) {
            console.log(spawn.name + ": creep build request submitted (" + nextCreep.name + " [" + nextCreep.body + "]), but RCL is not high enough");
            buildQueue.shift();
            // next
        }
        else {
            // not owner, or some other error that I am not checking right now
        }
    }

    return false;
}

let getNextBuildRequest = function (room) {
    let buildQueue = Memory.creepBuildQueues[room.name];
    if (buildQueue.length === 0) {
        return 0;
    }

    // array.pop() removes the last element, but I want a FIFO queue
    return buildQueue.shift();
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

let sameBuildRequest = function (buildRequestA, buildRequestB) {
    return (
        buildRequestA.role === buildRequestB.role &&
        buildRequestA.name === buildRequestB.name);
}

let checkForDuplicateBuildRequest = function (newBuildRequest, room) {
    let creepBuildQueue = Memory.creepBuildQueues[room.name];
    for (let index in Memory.creepBuildQueues[room.name]) {
        let existingBuildRequest = creepBuildQueue[index];
        if (sameBuildRequest(existingBuildRequest, newBuildRequest)) {
            return true;
        }
    }
    return false;
}

module.exports = {
    // in the event of disaster and creeps can't be built
    clear: function (room) {
        Memory.creepBuildQueues[room.name].length = 0;
    },

    print: function (room) {
        let str = "{ ";
        let queue = Memory.creepBuildQueues[room.name];
        queue.forEach(function (buildRequest) {
            str += (buildRequest.name + "; ");
        });
        str += "}";
        console.log("room " + room.name + " has " + queue.length + " creeps waiting to be built: " + str);
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
    submit: function (buildThis, room) {
        ensureCreepBuildQueueExist(room);

        let result = checkForDuplicateBuildRequest(buildThis, room);
        if (result) {
            //console.log("duplicate creep build request: " + buildThis.name);
            return false;
        }

        let str = "new creep build request: {";
        for (let key in buildThis) {
            str += key + ": " + buildThis[key] + ", ";
        }
        console.log(str);
        Memory.creepBuildQueues[room.name].push(buildThis);

        return true;
    }
}
