
let creepBuildQueue = require("room.creepPopulation.buildQueue");
let creepEnergyRequired = require("creep.energyRequired");
let roomEnergyLevels = require("room.energyLevelMonitoring");
let myConstants = require("myConstants");


let ensureRoomEnergySourceRecordsExist = function (room) {
    if (!Memory.roomEnergySources) {
        Memory.roomEnergySources = {};
    }
    if (!Memory.roomEnergySources[room.name]) {
        Memory.roomEnergySources[room.name] = room.find(FIND_SOURCES);
    }
}

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
    else if (roomPotentialEnergy >= 300) {
        body = [WORK, WORK, CARRY, MOVE];
    }
    else {
        // uh oh; not even 300 energy? 
    }

    return body;
}

module.exports = {
    // Note: Multiple spawns can be created in a room as the RCL rises, but the number of workers is dependent on the number of energy sources in the room, which is a constant.  So take a room ID, not a spawn ID.
    queueCreeps: function (room) {
        ensureRoomEnergySourceRecordsExist(room);

        let creepRole = "miner";
        let currentMiners = room.find(FIND_MY_CREEPS, {
            filter: (creep) => {
                return (creep.memory.role === creepRole);
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
        let roomPotentialEnergy = roomEnergyLevels.maxiumSupportedEnergy(room);
        console.log("spawning miners; room " + room.name + " potential energy: " + roomPotentialEnergy);
        for (let num = 0; num < roomEnergySources.length; num++) {
            if (!minerNumbers[num]) {
                let newBody = bodyBasedOnAvailableEnergy(roomPotentialEnergy);
                let newEnergySourceId = roomEnergySources[num].id;

                // really should have at least 1 miner
                let buildPriority = myConstants.creepBuildPriorityLow;
                if (currentMiners.length === 0) {
                    buildPriority = myConstants.creepBuildPriorityHigh;
                }

                let buildRequest = {
                    body: newBody,
                    name: room.name + creepRole + num,
                    role: creepRole,
                    number: num,
                    energySourceId: newEnergySourceId, 
                    originRoomName: room.name,
                    roomName: room.name,
                    energyRequired: creepEnergyRequired.bodyCost(newBody),
                }

                //console.log("submitting miner creep build request: " + buildRequest.name);
                creepBuildQueue.submit(buildRequest, room, buildPriority);
            }
        }
    }
}
