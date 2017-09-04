
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

let checkForDuplicateBuildRequest = function (newBuildRequest, room) {
    //console.log("size of build queue for room " + room.name + ": " + Memory.creepBuildQueues[room.name].length);



    //??how do I check if a creep that is being built is finished??



    let haveDuplicate = false;
    Memory.creepBuildQueues[room.name].forEach(function (existingBuildRequest) {
        // for debugging
        //console.log("existing/new role: '" + existingBuildRequest.role + "'/'" + newBuildRequest.role + "', existing/new name: '" + existingBuildRequest.name + "'/'" + newBuildRequest.name + "'");

        if (existingBuildRequest.role === newBuildRequest.role &&
            existingBuildRequest.name === newBuildRequest.name) {
            haveDuplicate = true;
        }
    });

    return haveDuplicate;
}

// TODO: rename to room.creepPopulation.buildQueue
module.exports = {
    run: function (spawn) {
        let room = spawn.room;
        ensureCreepBuildQueueExist(room);

        if (spawn.spawning) {
            //console.log(spawn.name + " is busy spawning")
            return;
        }

        // for clearing out the queue in case of problems
        //Memory.creepBuildQueues[room.name].length = 0

        if (!haveBuildRequest(room)) {
            //console.log("no build requests for creeps for " + room.name);
            return;
        }
        //console.log("have creep build request for room " + room.name);

        if (room.energyAvailable < requiredEnergyForNext(room)) {
            //console.log("not enough energy available for next creep in room " + room.name + "; have " + room.energyAvailable + ", need " + requiredEnergyForNext(room));
            return;
        }

        // have build job and the required energy for it
        //Memory.currentlyBuilding[room.name]   

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
            Memory.creepBuildQueues[room.name].push(buildThis);
            //console.log("number of creep build requests in room '" + room.name + "': " + Memory.creepBuildQueues[room.name].length);
        }

        //console.log("number of creep build requests in room '" + room.name + "': " + Memory.creepBuildQueues[room.name].length);
        //return true;
    }
}
