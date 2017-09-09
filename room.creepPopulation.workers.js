
let creepBuildQueue = require("room.creepPopulation.buildQueue");
let creepEnergyRequired = require("creep.energyRequired");
let roomEnergyLevels = require("room.energyLevelMonitoring");

// TODO: create creep specifically for refilling spawns, extensions, towers (and if nothing else, a container in the center of the base; if that's full, then try to find a storage container and dump it there so that the energy never goes to waste)
//  - justification: lots of WORK parts are needed for building, repairing, and upgrading, but only CARRY parts are needed for refilling, and time spent refilling is time not spent building, repairing, or upgrading
//  - use creepRoutine.refillEnergy and jobs.fillEnergy to tell it what to do
//  - create room.queueHaulers to create 1 for each energy source
// TODO: in jobs.roads
//  - every tick: look at every creep's position and determine if it is undeveloped land; if so, increment a Memory.traffic[pos] counter by 1
//  - every 100 ticks: if a traffic counter for a position is > 100,
//      - create construction site there for a road
//      - set Memory.traffic[pos] = null to flag for cleanup
// TODO: create jobs.baseBuilding
//  - get a rouch idea of what a base should look like for different RCLs, plan building jobs accordingly
// TODO: modify job system to store jobs by ID; instead of using an array with push-pop


let workerBodyBasedOnAvailableEnergy = function (room) {
    // TODO: perhaps all your workers got destroyed and now there is the spawn and a number of extensions, but only the spawn automatically fills back up, so the maximum reliable energy capcity is only 300
    let roomPotentialEnergy = roomEnergyLevels.maximumSupportedEnergy(room);
    console.log(room.name + ": maximum supported energy " + roomPotentialEnergy);

    roomPotentialEnergy = room.energyCapacityAvailable;
    let body = [];

    // Note: As the RCL increases, each level allows 5 more extensions; assume that, if there are any extensions, 
    if (roomPotentialEnergy === 300) {
        // only have the spawn
        body = [WORK, CARRY, MOVE];
    }
    else if (roomPotentialEnergy === 350) {
        body = [WORK, CARRY, MOVE, MOVE];
    }
    else if (roomPotentialEnergy === 400) {
        body = [WORK, WORK, CARRY, MOVE, MOVE, MOVE];
    }
    else if (roomPotentialEnergy === 550) {
        body = [WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE];
    }
    else if (roomPotentialEnergy >= 650) {
        body = [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
    }
    else {
        // uh oh
    }

    return body;
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
                let body = [];
                if (num === 0) {
                    // let this be the "emergency recovery" creep that can always be spawned if there is a spawn
                    body = [WORK, CARRY, MOVE, MOVE];   // 250 energy
                }
                else {
                    body = workerBodyBasedOnAvailableEnergy(room);
                }
                let newRole = "worker";
                let buildRequest = {
                    body: body,
                    name: newRole + num,
                    role: newRole,
                    number: num,
                }

                //console.log("submitting worker creep build request: " + buildRequest.name + ", " + buildRequest.body);
                creepBuildQueue.submit(buildRequest, room);
            }
        }
    }
}