
let creepBuildQueue = require("room.creepPopulation.buildQueue");
let roomEnergyLevels = require("room.energyLevelMonitoring");

let bodyBasedOnAvailableEnergy = function (roomPotentialEnergy) {
    let body = [];

    // let their move parts be 1/2 of other parts in order to encourage the building of roads
    if (roomPotentialEnergy >= 600) {
        body = [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
    }
    if (roomPotentialEnergy >= 450) {
        body = [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
    }
    else if (roomPotentialEnergy >= 300) {
        body = [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE]
    }
    else {
        // uh oh; not even 300 energy?
    }

    return body;
}

module.exports = {
    // Note: Energy haulers are creeps that specialize in "refill energy" jobs.  They cannot work.
    // Also Note: The spawn room and the assigned room may be different if an energy hauler is intended to travel to an adjacent satellite room and bring back the energy to a container in the spawn room.
    queueCreeps: function (room) {
        let creepRole = "energyHauler";
        let energyHaulers = room.find(FIND_MY_CREEPS, {
            filter: (creep) => {
                return (creep.memory.role === creepRole);
            }
        });

        // recycle the energy hauler numbers per room
        let haulerNumbers = [];
        for (let index in energyHaulers) {
            let haulerCreep = energyHaulers[index];
            haulerNumbers[haulerCreep.memory.number] = true;
        }

        // just like the miners, exactly 1 miner per energy source
        let roomEnergySources = room.find(FIND_SOURCES);
        let roomPotentialEnergy = roomEnergyLevels.maximumSupportedEnergy(room);
        console.log("spawning energy haulers; room " + room.name + " potential energy: " + roomPotentialEnergy);
        for (let num = 0; num < roomEnergySources.length; num++) {
            if (!haulerNumbers[num]) {
                let newBody = bodyBasedOnAvailableEnergy(roomPotentialEnergy);
                // unlike miners, an energy hauler is not assigned to any particular energy source
                let buildRequest = {
                    body: newBody,
                    name: room.name + creepRole + num,
                    role: creepRole,
                    number: num,
                    originRoomName: room.name,
                    roomName: room.name,
                    energyRequired: creepEnergyRequired.bodyCost(newBody),
                }

                //console.log("submitting energy hauler build request: " + buildRequest.name);
                creepBuildQueue.submit(buildRequest, room);
            }
        }
    }
}
