
let creepBuildQueue = require("room.creepPopulation.buildQueue");
let creepEnergyRequired = require("creep.energyRequired");
let roomEnergyLevels = require("room.energyLevelMonitoring");
let myConstants = require("myConstants");


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


let bodyBasedOnAvailableEnergy = function (roomPotentialEnergy) {
    let body = [];

    if (roomPotentialEnergy >= 900) {
        body = [WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
    }
    else if (roomPotentialEnergy >= 800) {
        body = [WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
    }
    else if (roomPotentialEnergy >= 650) {
        body = [WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE];
    }
    else if (roomPotentialEnergy >= 450) {
        body = [WORK, WORK, WORK, CARRY, MOVE, MOVE];
    }
    else {
        // early workers do not have the benefit of roads
        body = [WORK, CARRY, MOVE, MOVE];
    }

    return body;
}

// TODO: rename module to room.creepPopulation.workers
module.exports = {
    // Note: Multiple spawns can be created in a room as the RCL rises, but the number of workers is dependent on the number of energy sources in the room, which is a constant.  So take a room, not a spawn.
    queueCreeps: function (room) {
        let currentWorkers = room.find(FIND_MY_CREEPS, {
            filter: (creep) => {
                return (creep.memory.role === myConstants.creepRoleWorker);
            }
        });

        // recycle the worker numbers per room; easier to read and easier to dedect duplicate build requests
        let workerNumbers = [];
        for (let index in currentWorkers) {
            let workerCreep = currentWorkers[index];
            workerNumbers[workerCreep.memory.number] = true;
            // ??check for unassigned energySourceId or ignore because it is set on creation??
        }
        
        // let there be 5 workers per energy resource (adjust with experience; 9-12-2017)
        let roomEnergySources = room.find(FIND_SOURCES);
        let roomPotentialEnergy = roomEnergyLevels.maximumSupportedEnergy(room);
        console.log("spawning workers; room " + room.name + " potential energy: " + roomPotentialEnergy);
        for (let num = 0; num < (roomEnergySources.length * 5); num++) {
            if (!workerNumbers[num]) {
                let newBody = [];
                let buildPriority = myConstants.creepBuildPriorityLow;
                if (num === 0) {
                    // let this be the "emergency recovery" creep that can always be spawned if there is a spawn
                    buildPriority = myConstants.creepBuildPriorityCritical;
                    newBody = [WORK, CARRY, MOVE, MOVE];   // 250 energy
                }
                else {
                    newBody = bodyBasedOnAvailableEnergy(roomPotentialEnergy);
                }

                let buildRequest = {
                    body: newBody,
                    name: room.name + myConstants.creepRoleWorker + num,
                    role: myConstants.creepRoleWorker,
                    number: num,
                    energyRequired: creepEnergyRequired.bodyCost(newBody),
                }

                //console.log("submitting worker creep build request: " + buildRequest.name + ", " + buildRequest.body);
                creepBuildQueue.submit(buildRequest, room, buildPriority);
            }
            else {
                console.log("worker " + num + " already exists");
            }
        }
    }
}
