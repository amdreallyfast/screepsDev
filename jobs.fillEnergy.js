
let creepJobQueues = require("jobs.workQueue");

module.exports = {
    queueJobs: function (room) {
        let energyRefillTargets = room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                // not counting containers or storage structures; those are meant to store excess and not to be filled, so there is no point in assigning them a refill job
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
