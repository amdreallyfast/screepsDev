
let ensureCreepBuildQueueExist = function (room) {
    if (!Memory.creepBuildQueues) {
        Memory.creepBuildQueues = {};
    }
    if (!Memory.creepBuildQueues[room.name]) {
        Memory.creepBuildQueues[room.name] = [];
    }

    if (!Memory.currentlyBuilding) {
        Memory.currentlyBuilding = {};
    }
    if (!Memory.currentlyBuilding[room.name]) {
        Memory.currentlyBuilding[room.name] = [];
    }
};

let haveBuildRequest = function (room) {
    return (Memory.creepBuildQueues[room.name].length > 0);
};

let requiredEnergyForNext = function (room) {
    let buildQueue = Memory.creepBuildQueues[room.name];
    if (buildQueue.length === 0) {
        return 0;
    }

    let buildRequest = buildQueue[0];
    let energyCost = 0;
    for (let index in buildRequest.body) {
        let part = buildRequest.body[index];
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
            console.log("don't recognize body part '" + part + "' from key '" + index + "'");
        }
        //console.log("energy needed after adding body part " + part + ": " + energyCost);
    }

    return energyCost;
};

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
    //??how do I check if a creep that is being built is finished??
    let creepBuildQueue = Memory.creepBuildQueues[room.name];
    for (let index in Memory.creepBuildQueues[room.name]) {
        let existingBuildRequest = creepBuildQueue[index];
        if (sameBuildRequest(existingBuildRequest, newBuildRequest)) {
            return true;
        }
    }
    return false;
}

let printBuildQueue = function (room) {
    let str = "";
    Memory.creepBuildQueues[room.name].forEach(function (buildRequest) {
        str += (buildRequest.name + "; ");
    });
    console.log(str);
}

//// Note: This function was introduced because, over the weekend of 9-2-2017 to 9-4-2017, there was an error and a bunch of stuff timed out, and my spawn was waiting for the 550-ish energy to spawn a worker, but all the workers were gone, so its limit was the amount of energy that the spawn itself could summon (300).
//// ??if that was only a problem because of a code error, would this really fix it??
//let notEnoughEnergyTimeout = function (room, requiredEnergy) {
//    if (!Memory.lastTimeEnergyAvailableToSpawn) {
//        Memory.lastTimeEnergyAvailableToSpawn = {};
//    }
//    if (!Memory.lastTimeEnergyAvailableToSpawn[room.name]) {
//        Memory.lastTimeEnergyAvailableToSpawn[room.name] = 0;
//    }

//    let counter = Memory.lastTimeEnergyAvailableToSpawn[room.name];
//    if (requiredEnergy < room.energyAvailable) {
//        counter++;
//        if (counter === 1000) {
//            // yeah, energy is not happening
//            return true;
//        }
//    }
//    else {
//        // energy available
//        counter = 0;
//    }

//    return false;
//}

// TODO: rename to room.creepPopulation.buildQueue
module.exports = {
    run: function (spawn) {
        let room = spawn.room;
        ensureCreepBuildQueueExist(room);

        if (spawn.spawning) {
            //console.log(spawn.name + " is busy spawning")
            return;
        }

        //Memory.creepBuildQueues[room.name].length = 0;

        if (!haveBuildRequest(room)) {
            //console.log("no build requests for creeps for " + room.name);
            return;
        }

        // in the event of disaster, reset the queue
        let requiredEnergy = requiredEnergyForNext(room);
        if (room.energyCapacityAvailable < requiredEnergy) {
            Memory.creepBuildQueues[room.name].length = 0
        }

        if (room.energyAvailable < requiredEnergy) {
            //console.log(spawn.name + ": not enough energy available to build next creep in room " + room.name + "; have " + room.energyAvailable + ", need " + requiredEnergyForNext(room));
            return;
        }

        let buildRequest = getNextBuildRequest(room);
        let result = spawn.createCreep(buildRequest.body, buildRequest.name, parseForAdditionalArguments(buildRequest));
        console.log(spawn.name + " attempting to spawn creep '" + buildRequest.name + "' in room " + room.name + "; result = " + result);
    },

    // expected "buildThis" format:
    // - body: [...]
    // - role: "..."
    // - name: "..."
    // - (additional arguments depend on the role)
    submit: function (buildThis, room) {
        ensureCreepBuildQueueExist(room);

        //Memory.creepBuildQueues[room.name].length = 0;
        //console.log("build request: " + buildThis.name);
        let result = checkForDuplicateBuildRequest(buildThis, room);
        if (result) {
            // duplicate creep build request
            //console.log("duplicate creep build request: " + buildThis.name);
            return false;
        }
        else {
            console.log("new creep build request: " + buildThis.name);
            printBuildQueue(room);
            Memory.creepBuildQueues[room.name].push(buildThis);
            //console.log("number of creep build requests in room '" + room.name + "': " + Memory.creepBuildQueues[room.name].length);
        }

        //console.log("number of creep build requests in room '" + room.name + "': " + Memory.creepBuildQueues[room.name].length);
        //return true;
    }
}
