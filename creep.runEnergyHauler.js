
let creepJobQueues = require("jobs.workQueue");
let routineGetEnergy = require("creep.workRoutine.getEnergy");
let routineRefill = require("creep.workRoutine.refillEnergy");
let myConstants = require("myConstants");


module.exports = {
	/*--------------------------------------------------------------------------------------------
	Description:
        Governs when an energy hauling creep should get energy and when it should carry that 
        energy to a destination, whether that be a refill job or a container or storage.
	Creator:    John Cox, 9/2017
	--------------------------------------------------------------------------------------------*/
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

            if (creep.carry.energy < (0.3 * creep.carryCapacity)) {
                // go fill up; don't run all the way to a container with only a partial load
                creep.memory.working = false;
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
                //let refillObject = containers[0];
                let refillObject = creep.pos.findClosestByPath(containers);
                let result = creep.transfer(refillObject, RESOURCE_ENERGY);
                if (result === ERR_NOT_IN_RANGE) {
                    creep.moveTo(refillObject, { visualizePathStyle: { stroke: "yellow" } });
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
                    creep.moveTo(refillObject, { visualizePathStyle: { stroke: "yellow" } });
                }
            }

            // no storage either; just sit here
        }

    }
}
