
let creepJobQueues = require("jobs.workQueue");

module.exports = {
    /*--------------------------------------------------------------------------------------------
	Description:
        Looks for structures that can store energy and submits a "refill" request if they aren't 
        full.

        Note: Ignores containers and storage structures.  Those are meant to store excess and 
        can't do anything with the energy like spawns and towers can.
	Creator:    John Cox, 9/2017
	--------------------------------------------------------------------------------------------*/
    queueJobs: function (room) {
        let energyRefillTargets = room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                // not counting containers or storage structures; those are meant to store 
                // excess and not to be filled, so there is no point in assigning them a refill job
                let canStoreEnergy =
                    structure.structureType == STRUCTURE_EXTENSION ||
                    structure.structureType == STRUCTURE_SPAWN ||
                    structure.structureType == STRUCTURE_TOWER;
                let needsEnergy = (structure.energy < structure.energyCapacity);

                return (canStoreEnergy && needsEnergy);
            }
        });

        energyRefillTargets.forEach(function (structure) {
            creepJobQueues.submitRefillEnergyJob(structure);
        });
    }
};
