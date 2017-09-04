
let creepBuildQueue = require("spawn.buildQueue");

//// a unique number is useful for performing a % operation to scatter the workers among limited resources like energy sources and energy containers 
//let NewNumber = function() {
//    let num = 0;
//    return function() {
//        return (num++);
//    }
//}();


// TODO: perhaps all your workers got destroyed and now there is the spawn and a number of extensions, but only the spawn automatically fills back up, so the maximum reliable energy capcity is only 300
// TODO: create myConstants module;
//  - memory constants
//  - MY_ERR_* constants
//  - spawn.buildQueue.submit(...) returns OK if all went well, MY_ERR_CREEP_SPAWN_REQUEST_DUPLICATE, or MY_ERR_CREEP_SPAWN_REQUEST_ENERGY_LEVEL_TIMEOUT
// TODO: in spawn.buildQueue.submit
//  - if okay to submit build request, push back an object { energyRequired: ..., blueprint: buildRequest }
// TODO: create room.energyLevelMonitoring module
//  - handle energy level timeouts there
//  - in 50-energy increments
//  - query for energy timeout (energy)
//  - looked up by spawn.buildQueue to figure out if the energy needed for a spawn build request is ever going to happen (if so, dump that creep spawn request)
//  - looked up by worker queue and by miner queue to determine if their 
// TODO: create creep.energyRequired module
//  - used by spawn.buildQueue to determine how much energy is needed for the build (??just carry energy required along with the build request??)
//  - used by spawn.queueWorkers to determine if it should shrink the energy needed for a particular module
//  - used by spawn.queueMiners to determine if the room is ready for miners or if it should still use general-purpose workers.


let workerBodyBasedOnAvailableEnergy = function(room) {
    let roomPotentialEnergy = room.energyCapacityAvailable;

    // NotE: As the RCL increases, each level allows 5 more extensions; assume that, if there are any extensions, 
    if (roomPotentialEnergy === 300) {
        // one spawn only
    }
    else {

    }

}

// TODO: rename module to room.creepPopulation.workers
module.exports = {
    // Note: Multiple spawns can be created in a room as the RCL rises, but the number of workers is dependent on the number of energy sources in the room, which is a constant.  So take a room, not a spawn.
    run: function (room) {
        let workerCreeps = room.find(FIND_MY_CREEPS, {
            filter: (creep) => {
                return (creep.memory.role === "worker");
            }
        });

        // recycle the worker numbers per room; easier to read and easier to dedect duplicate build requests
        let workerNumbers = [];
        for (let index in workerCreeps) {
            let workerCreep = workerCreeps[index];
            workerNumbers[workerCreep.memory.number] = true;
            // ??check for unassigned energySourceId or ignore because it is set on creation??
        }

        // TODO: ??change the number dynamically somehow? calculate per room based on available resources??
        let maxWorkersPerRoom = 10;
        for (let num = 0; num < maxWorkersPerRoom; num++) {
            if (!workerNumbers[num]) {
                let newRole = "worker";
                let buildRequest = {
                    //body: [WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE],
                    body: [WORK, CARRY, MOVE],
                    name: newRole + num,
                    role: newRole,
                    number: num,
                }

                console.log("submitting worker creep build request: " + buildRequest.name);
                creepBuildQueue.submit(buildRequest, room);
            }
        }
    }
}
