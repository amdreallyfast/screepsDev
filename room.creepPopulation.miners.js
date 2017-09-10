
let creepBuildQueue = require("room.creepPopulation.buildQueue");
let creepEnergyRequired = require("creep.energyRequired");
let roomEnergyLevels = require("room.energyLevelMonitoring");


let ensureRoomEnergySourceRecordsExist = function (room) {
    if (!Memory.roomEnergySources) {
        Memory.roomEnergySources = {};
    }
    if (!Memory.roomEnergySources[room.name]) {
        Memory.roomEnergySources[room.name] = room.find(FIND_SOURCES);
    }
}

let workerBodyBasedOnAvailableEnergy = function (roomPotentialEnergy) {
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

// TODO: rename module to room.creepPopulation.miners
module.exports = {
    // Note: Multiple spawns can be created in a room as the RCL rises, but the number of workers is dependent on the number of energy sources in the room, which is a constant.  So take a room ID, not a spawn ID.
    queueCreeps: function (room) {
        ensureRoomEnergySourceRecordsExist(room);

        let miners = room.find(FIND_MY_CREEPS, {
            filter: (creep) => {
                return (creep.memory.role === 'miner');
            }
        });

        // ??how to streamline this? there are usually only 1 or 2 energy sources in a room
        let numEnergySources = Memory.roomEnergySources[room.name].length;
        if (miners.length >= numEnergySources) {
            // great
            return;
        }

        // recycle the miner numbers per room; easier to read and easier to dedect duplicate build requests
        let minerNumbers = [];
        for (let index in miners) {
            let minerCreep = miners[index];
            minerNumbers[minerCreep.memory.number] = true;
            // ??check for unassigned energySourceId or ignore because it is set on creation??
        }

        // exactly 1 miner per energy source
        let roomPotentialEnergy = roomEnergyLevels.maximumSupportedEnergy(room);
        for (let num = 0; num < numEnergySources; num++) {
            if (!minerNumbers[num]) {
                let newRole = "miner";
                let newBody = workerBodyBasedOnAvailableEnergy(roomPotentialEnergy);

                // Note: There will be exactly 1 miner for each energy source, and energy 
                // sources will be a constant, so it is acceptable to mod the number of energy 
                // sources by the miner number without checking which is bigger.  The number of 
                // energy sources will always be the larger number except for the last miner.
                // Also Note: The +1 is because num can be 0;
                //let energySourceIndex = numEnergySources % (num + 1);
                //let newEnergySourceId = Memory.roomEnergySources[room.name][energySourceIndex].id;
                let newEnergySourceId = Memory.roomEnergySources[room.name][num].id;
                let buildRequest = {
                    body: newBody,
                    name: room.name + newRole + num,
                    role: newRole,
                    number: num,
                    energySourceId: newEnergySourceId, 
                    originRoomName: room.name,
                    energyRequired: creepEnergyRequired.bodyCost(newBody),
                }

                //console.log("submitting miner creep build request: " + buildRequest.name);
                creepBuildQueue.submit(buildRequest, room);
            }
        }
    }
}
