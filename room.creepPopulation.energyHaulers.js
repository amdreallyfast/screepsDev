
let creepBuildQueue = require("room.creepPopulation.buildQueue");
let creepEnergyRequired = require("creep.energyRequired");
let roomEnergyLevels = require("room.energyLevelMonitoring");
let myConstants = require("myConstants");


let bodyBasedOnAvailableEnergy = function (roomPotentialEnergy) {
    let body = [];

    // let their move parts be 1/2 of other parts in order to encourage the building of roads
    if (roomPotentialEnergy >= 600) {
        body = [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
    }
    if (roomPotentialEnergy >= 450) {
        body = [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
    }
    else {
        // early creeps don't have the benefit of roads
        body = [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE]
    }

    return body;
}

module.exports = {
    // Note: Energy haulers are creeps that specialize in "refill energy" jobs.  They cannot work.
    // Also Note: The spawn room and the assigned room may be different if an energy hauler is intended to travel to an adjacent satellite room and bring back the energy to a container in the spawn room.
    queueCreeps: function (room) {
        let currentEnergyHaulers = room.find(FIND_MY_CREEPS, {
            filter: (creep) => {
                return (creep.memory.role === myConstants.creepRoleEnergyHauler);
            }
        });

        // recycle the energy hauler numbers per room
        let haulerNumbers = [];
        for (let index in currentEnergyHaulers) {
            let haulerCreep = currentEnergyHaulers[index];
            haulerNumbers[haulerCreep.memory.number] = true;
        }

        // just like the miners, exactly 1 miner per energy source
        let roomEnergySources = room.find(FIND_SOURCES);
        let roomPotentialEnergy = roomEnergyLevels.maximumSupportedEnergy(room);
        let alreadySubmitted = false;
        console.log("spawning energy haulers; room " + room.name + " potential energy: " + roomPotentialEnergy);
        for (let num = 0; num < roomEnergySources.length; num++) {
            if (!haulerNumbers[num]) {
                let newBody = bodyBasedOnAvailableEnergy(roomPotentialEnergy);
                // unlike miners, an energy hauler is not assigned to any particular energy source

                // really should have at least 1 hauler
                let buildPriority = myConstants.creepBuildPriorityLow;
                if (!alreadySubmitted && currentEnergyHaulers.length === 0) {
                    buildPriority = myConstants.creepBuildPriorityMed;
                }

                let buildRequest = {
                    body: newBody,
                    name: room.name + myConstants.creepRoleEnergyHauler + num,
                    role: myConstants.creepRoleEnergyHauler,
                    number: num,
                    originRoomName: room.name,
                    energyRequired: creepEnergyRequired.bodyCost(newBody),
                }

                //console.log("submitting energy hauler build request: " + buildRequest.name);
                creepBuildQueue.submit(buildRequest, room, buildPriority);
                alreadySubmitted = true;
            }
        }
    }
}
