
let ensureCreepBuildQueueExist = function(spawnId) {
    if (!Memory.creepBuildQueues[spawnId]) {
        Memory.creepBuildQueues[spawnId] = [];
    }
};

let haveBuildRequest = function(spawnId) {
    return (Memory.creepBuildQueues[spawnId].length > 0);
};

let requiredEnergyForNext = function (spawnId) {
    let buildQueue = Memory.creepBuildQueues[spawn.id];
    if (buildQueue.length === 0) {
        return 0;
    }

    let buildRequest = buildQueue[0];
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
};

let getNextBuildRequest = function(spawnId) {
    let buildQueue = Memory.creepBuildQueues[spawn.id];
    if (buildQueue.length === 0) {
        return 0;
    }

    // array.pop() removes the last element, but I want a FIFO queue
    return buildQueue.shift();
}

let parseForAdditionalArguments = function(buildRequest) {
    let optionalArguments = {};
    for (let key in buildRequest) {
        if (key === "body" || key === "name") {
            continue;
        }
        optionalArguments[key] = buildRequest[key];
    }
    return optionalArguments;
}

module.exports = {
    run: function(spawn) {
        if (!Memory.creepBuildQueues) {
            Memory.creepBuildQueues = {};
        }
        ensureCreepBuildQueueExist(spawn.id);

        if (!haveBuildRequest(spawn.id)) {
            console.log("no jobs for " + spawn);
            return;
        }
        console.log("have creep build request for spawn " + spawn);

        if (spawn.room.energyAvailable < requiredEnergyForNext(spawn.id)) {
            console.log("not enough energy available for next energy job for spawn " + spawn);
            return;
        }
        console.log("creating creep with spawn " + spawn);

        // have build job and the required energy for it
        let buildRequest = getNextBuildRequest(spawn.id);
        spawn.createCreep(buildRequest.body, buildRequest.name, parseForAdditionalArguments(buildRequest));
    },

    // expected "buildThis" format:
    // - body: [...]
    // - role: "..."
    // - name: "..."
    // - (additional arguments depend on the role)
    submit: function(buildThis, withThisSpawn) {
        ensureCreepBuildQueueExist(withThisSpawn.id);

        // ensure that it 
        Memory.creepBuildQueues[withThisSpawn.id].forEach(function(existingBuildRequest) {
            if (existingBuildRequest.role === buildThis.role &&
                existingBuildRequest.name === buildThis.name) {

                // duplicate creep build request
                return;
            }
        });

        Memory.creepBuildQueues[withThisSpawn.id].push(buildThis);
    },
}
