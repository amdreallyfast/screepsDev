
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

    // let their move parts be 1/2 of other parts in order to encourage the building of roads
    if (roomPotentialEnergy >= 750) {
        body = [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
    }
    else if (roomPotentialEnergy >= 600) {
        body = [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
    }
    else if (roomPotentialEnergy >= 450) {
        body = [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
    }
    else {
        // early creeps don't have the benefit of roads
        body = [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE]
    }

    return body;
}

module.exports = {
    /*--------------------------------------------------------------------------------------------
	Description:
        Scans the room for all energy hauler creeps and submits creep build requests for any 
        that have expired.  Like the worker population, this uses a standard naming scheme to 
        reuse creep names.

        Note: There shall be 1 energy hauler per energy resource.  Seems about right.

        Also Note: Energy haulers are higher priority than workers and are important for 
        allowing workers to do their repair/construct/upgrade thing and not having to worry 
        about energy refills.  They cannot harvest energy though, so they are lower priority 
        than miners.
    Creator:    John Cox, 9/2017
	--------------------------------------------------------------------------------------------*/
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
        //let alreadySubmitted = false;
        console.log("spawning energy haulers; room " + room.name + " potential energy: " + roomPotentialEnergy);
        for (let num = 0; num < roomEnergySources.length; num++) {
            if (!haulerNumbers[num]) {
                let newBody = bodyBasedOnAvailableEnergy(roomPotentialEnergy);
                // unlike miners, an energy hauler is not assigned to any particular energy source

                // really should have at least 1 hauler
                //let buildPriority = myConstants.creepBuildPriorityLow;
                let buildPriority = myConstants.creepBuildPriorityMed;
                //if (!alreadySubmitted && currentEnergyHaulers.length === 0) {
                //    buildPriority = myConstants.creepBuildPriorityMed;
                //}

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
                //alreadySubmitted = true;
            }
        }
    }
}
