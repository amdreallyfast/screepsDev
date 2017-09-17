
let creepBuildQueue = require("room.creepPopulation.buildQueue");
let creepEnergyRequired = require("creep.energyRequired");
let roomEnergyLevels = require("room.energyLevelMonitoring");
let myConstants = require("myConstants");


/*------------------------------------------------------------------------------------------------
Description:
    Self-explanatory
Creator:    John Cox, 9/2017
------------------------------------------------------------------------------------------------*/
let bodyBasedOnAvailableEnergy = function (roomPotentialEnergy) {
    let body = [];

    if (roomPotentialEnergy >= 700) {
        body = [WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE];
    }
    else if (roomPotentialEnergy >= 600) {
        body = [WORK, WORK, WORK, WORK, WORK, CARRY, MOVE];
    }
    else if (roomPotentialEnergy >= 500) {
        body = [WORK, WORK, WORK, WORK, CARRY, MOVE];
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
    /*--------------------------------------------------------------------------------------------
	Description:
        Scans the room for all miner creeps and submits creep build requests for any 
        that have expired.  Like the worker population, this uses a standard naming scheme to 
        reuse creep names.

        Note: There shall be 1 miner per energy resource, and each miner will be assigned to a 
        specific resource.

        Also Note: Miners are high priority.  The only thing higher priority is the 
        "bootstrapper" creep.
    Creator:    John Cox, 9/2017
	--------------------------------------------------------------------------------------------*/
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
        //let alreadySubmitted = false;
        console.log("spawning miners; room " + room.name + " potential energy: " + roomPotentialEnergy);
        for (let num = 0; num < roomEnergySources.length; num++) {
            if (!minerNumbers[num]) {
                let newBody = bodyBasedOnAvailableEnergy(roomPotentialEnergy);
                let newEnergySourceId = roomEnergySources[num].id;

                // really need at least 1 miner, and that before the energy hauler
                //let buildPriority = myConstants.creepBuildPriorityLow;
                let buildPriority = myConstants.creepBuildPriorityHigh;
                //if (!alreadySubmitted && currentMiners.length === 0) {
                //    buildPriority = myConstants.creepBuildPriorityHigh;
                //}

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
                //alreadySubmitted = true;
            }
        }
    }
}
