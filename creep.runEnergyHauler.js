
let creepJobQueues = require("jobs.workQueue");
let routineGetEnergy = require("creep.workRoutine.getEnergy");
let routineRefill = require("creep.workRoutine.refillEnergy");
let myConstants = require("myConstants");


/*------------------------------------------------------------------------------------------------
Description:
    Previously there was high level control for all creeps, but as I came to understand the game 
    better I realized the need for specialty creeps, such as miners and energy haulers and not 
    just generic drones.  Bees and ants figured this out long ago.  So here we are.
Creator:    John Cox, 9/2017
------------------------------------------------------------------------------------------------*/
module.exports = {
    run: function (creep) {
        if (creep.memory.role !== myConstants.creepRoleEnergyHauler) {
            return;
        }

        let energyEmpty = (creep.carry.energy === 0);
        let energyFull = (creep.carry.energy === creep.carryCapacity);
        let working = creep.memory.working;
        if (working && energyEmpty) {
            creep.memory.working = false;
        }
        else if (!working && energyFull) {
            // get to work
            creep.memory.working = true;
            creepJobQueues.getRefillEnergyJobFor(creep);
        }

        if (!creep.memory.working) {
            routineGetEnergy.run(creep);
        }
        else {
            // very useful for visual indication of what the creep is doing
            // http://unicode.org/emoji/charts/emoji-style.txt
            // or here: https://apps.timwhitlock.info/emoji/tables/unicode
            //console.log(creep.name + ": have refill job?" + haveRefillJob + " - " + creep.memory.refillEnergyJobId);
            if (!routineRefill.run(creep)) {
                creepJobQueues.getRefillEnergyJobFor(creep);
            }

            let haveRefillJob = (creep.memory.refillEnergyJobId !== null && creep.memory.refillEnergyJobId !== undefined);
            if (haveRefillJob) {
                // carry on
                return;
            }

            // have energy but still don't have a job; find somewhere to dump it
            let containers = creep.room.find(FIND_STRUCTURES, {
                filter: function (structure) {
                    if (structure.structureType === STRUCTURE_CONTAINER) {
                        if (structure.store[RESOURCE_ENERGY] < structure.storeCapacity) {
                            return true;
                        }
                    }
                    return false;
                }
            });
            if (containers.length > 0) {
                let refillObject = containers[0];
                let result = creep.transfer(refillObject, RESOURCE_ENERGY);
                if (result === ERR_NOT_IN_RANGE) {
                    creep.moveTo(refillObject, { visualizePathStyle: { stroke: "#111111" } });
                }
                return;
            }

            // no containers (or all containers full); how about storage?
            let storage = creep.room.find(FIND_STRUCTURES, {
                filter: function (structure) {
                    if (structure.structureType === STRUCTURE_STORAGE) {
                        // don't bother checking the storage capacity; this thing can store 1M energy
                        return true;
                    }
                    return false;
                }
            });
            if (storage.length > 0) {
                let refillObject = storage[0];
                let result = creep.transfer(refillObject, RESOURCE_ENERGY);
                if (result == ERR_NOT_IN_RANGE) {
                    creep.moveTo(refillObject, { visualizePathStyle: { stroke: "#222222" } });
                }
            }

            // no storage either; just sit here
        }

    }
}
