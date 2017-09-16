
let creepBuildQueue = require("room.creepPopulation.buildQueue");
let creepEnergyRequired = require("creep.energyRequired");
let roomEnergyLevels = require("room.energyLevelMonitoring");
let myConstants = require("myConstants");


let bodyBasedOnAvailableEnergy = function (roomPotentialEnergy) {
    let body = [];

    if (roomPotentialEnergy >= 750) {
        body = [WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE];
    }
    else if (roomPotentialEnergy >= 600) {
        body = [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE];
    }
    else if (roomPotentialEnergy >= 450) {
        body = [WORK, WORK, WORK, CARRY, CARRY, MOVE];
    }
    else if (roomPotentialEnergy >= 350) {
        body = [WORK, WORK, WORK, MOVE];
    }
    else {
        body = [WORK, WORK, MOVE];
    }

    return body;
}

module.exports = {
    // Note: Multiple spawns can be created in a room as the RCL rises, but the number of workers is dependent on the number of energy sources in the room, which is a constant.  So take a room ID, not a spawn ID.
    queueCreeps: function (room) {
        let currentMiners = room.find(FIND_MY_CREEPS, {
            filter: (creep) => {
                return (creep.memory.role === myConstants.creepRoleMiner);
            }
        });

        // recycle the miner numbers per room; easier to read and easier to dedect duplicate build requests
        let minerNumbers = [];
        for (let index in currentMiners) {
            let minerCreep = currentMiners[index];
            minerNumbers[minerCreep.memory.number] = true;
            // ??check for unassigned energySourceId or ignore because it is set on creation??
        }

        // exactly 1 miner per energy source
        let roomEnergySources = room.find(FIND_SOURCES);
        let roomPotentialEnergy = roomEnergyLevels.maximumSupportedEnergy(room);
        let alreadySubmitted = false;
        console.log("spawning miners; room " + room.name + " potential energy: " + roomPotentialEnergy);
        for (let num = 0; num < roomEnergySources.length; num++) {
            if (!minerNumbers[num]) {
                let newBody = bodyBasedOnAvailableEnergy(roomPotentialEnergy);
                let newEnergySourceId = roomEnergySources[num].id;

                // really need at least 1 miner, and that before the energy hauler
                let buildPriority = myConstants.creepBuildPriorityLow;
                if (!alreadySubmitted && currentMiners.length === 0) {
                    buildPriority = myConstants.creepBuildPriorityHigh;
                }

                let buildRequest = {
                    body: newBody,
                    name: room.name + myConstants.creepRoleMiner + num,
                    role: myConstants.creepRoleMiner,
                    number: num,
                    energySourceId: newEnergySourceId, 
                    originRoomName: room.name,
                    energyRequired: creepEnergyRequired.bodyCost(newBody),
                }

                //console.log("submitting miner creep build request: " + buildRequest.name);
                creepBuildQueue.submit(buildRequest, room, buildPriority);
                alreadySubmitted = true;
            }
        }
    }
}
