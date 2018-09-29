
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

module.exports = {
    /*--------------------------------------------------------------------------------------------
	Description:
        Scans the room for all worker creeps and submits creep build requests for any that have 
        expired.  Uses a standard naming scheme to reuse creep names and thus avoid having to 
        periodically have to go through the global Memory object and clean out unused creep 
        names.

        Note: The number of workers is dependent on the number of energy sources in the room and 
        the room controller level.  It was discovered during some testing that having many 
        creeps that have very few WORK parts during the early stages overwhelmed the miners and 
        energy sources, so the number of workers is low during early stages and increases to a 
        maximum as the room matures.

        Also Note: Workers have two priorities:
        - The "bootstrapper" creep is a simple creep that can be afforded by a lone spawn, can 
            harvest energy, can refill the spawn, and can upgrade the room controller.  It's a 
            "do everything" creep that is critical to the early stages of a room (or when 
            something bad happens and the energy and spawn capability of the room is reduced to 
            the level of a new room).
        - All other workers are low build priority.  They are vital to the long-term 
        improvement of the room, but they are not vital for energy acquisition.
    Creator:    John Cox, 9/2017
	--------------------------------------------------------------------------------------------*/
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
        
        // let the worker population be based on available energy sources (adjust with experience; 9-12-2017)
        let roomEnergySources = room.find(FIND_SOURCES);
        let roomPotentialEnergy = roomEnergyLevels.maximumSupportedEnergy(room);
        let workersPerEnergySource = 3;
        //let controllerLevel = room.controller.level;
        //if (controllerLevel === 1) {
        //    // can't harvest much
        //    workersPerEnergySource = 2;
        //}
        //else if (controllerLevel === 2) {
        //    workersPerEnergySource = 3;
        //}
        //else if (controllerLevel >= 3) {
        //    workersPerEnergySource = 4;
        //}

        console.log("spawning workers; room " + room.name + " potential energy: " + roomPotentialEnergy);
        for (let num = 0; num < (roomEnergySources.length * workersPerEnergySource) ; num++) {
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
                //console.log("worker " + num + " already exists");
            }
        }
    }
}
