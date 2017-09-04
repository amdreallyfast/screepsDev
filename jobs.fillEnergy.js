
let creepJobQueues = require("jobs.workQueue");

module.exports = {
    run: function (room) {
        let energyRefillTargets = room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                // not counting containers or storage structures; those are meant to not be easily filled
                let canStoreEnergy =
                    structure.structureType == STRUCTURE_EXTENSION ||
                    structure.structureType == STRUCTURE_SPAWN ||
                    structure.structureType == STRUCTURE_TOWER;
                let needsEnergy = (structure.energy < structure.energyCapacity);

                return (canStoreEnergy && needsEnergy);
            }
        });

        console.log("number of energy refill targets: " + energyRefillTargets.length);

        energyRefillTargets.forEach(function (structure) {
            if (structure.structureType === STRUCTURE_EXTENSION) {
                // extensions are small and only store 50 energy; 1 worker is more than enough
                creepJobQueues.submitRefillEnergyJob(structure);
            }
            else if (structure.structureType === STRUCTURE_SPAWN) {
                // spawns can hold 300
                let lessThanHalfEnergy = (structure.energy < (structure.energyCapacity * 0.5));
                if (lessThanHalfEnergy) {
                    creepJobQueues.submitRefillEnergyJob(structure);
                    creepJobQueues.submitRefillEnergyJob(structure);
                    creepJobQueues.submitRefillEnergyJob(structure);
                }
                else {
                    // just needs to be topped off
                    creepJobQueues.submitRefillEnergyJob(structure);
                }
            }
            else if (structure.structureType === STRUCTURE_TOWER) {
                // towers can store a whopping 1000 energy, so parse out how much energy it and react accordingly
                let halfEnergy = (structure.energyCapacity * 0.50);
                let threeQuarterEnergy = (structure.energyCapacity * 0.75);
                if (structure.energy < halfEnergy) {
                    // get the band together
                    creepJobQueues.submitRefillEnergyJob(structure);
                    creepJobQueues.submitRefillEnergyJob(structure);
                    creepJobQueues.submitRefillEnergyJob(structure);
                    creepJobQueues.submitRefillEnergyJob(structure);
                    creepJobQueues.submitRefillEnergyJob(structure);
                    creepJobQueues.submitRefillEnergyJob(structure);
                    creepJobQueues.submitRefillEnergyJob(structure);
                    creepJobQueues.submitRefillEnergyJob(structure);
                    creepJobQueues.submitRefillEnergyJob(structure);
                    creepJobQueues.submitRefillEnergyJob(structure);
                }
                else if (structure.energy < threeQuarterEnergy) {
                    creepJobQueues.submitRefillEnergyJob(structure);
                    creepJobQueues.submitRefillEnergyJob(structure);
                    creepJobQueues.submitRefillEnergyJob(structure);
                    creepJobQueues.submitRefillEnergyJob(structure);
                    creepJobQueues.submitRefillEnergyJob(structure);
                    creepJobQueues.submitRefillEnergyJob(structure);
                }
                else if (structure.energy < structure.energyCapacity) {
                    // >75%, so a few guys will work
                    creepJobQueues.submitRefillEnergyJob(structure);
                    creepJobQueues.submitRefillEnergyJob(structure);
                    creepJobQueues.submitRefillEnergyJob(structure);
                }
            }
        });
    }
};
