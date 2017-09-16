
let creepJobQueues = require("jobs.workQueue");
let myConstants = require("myConstants");


module.exports = {
    /*--------------------------------------------------------------------------------------------
	Description:
        A miner is a simple creep.  It mines energy and drops it on the ground.
	Creator:    John Cox, 9/2017
	--------------------------------------------------------------------------------------------*/
    run: function (creep) {
        if (creep.memory.role !== myConstants.creepRoleMiner) {
            return;
        }

        // if miner is full, dump at nearest container (hopefully right next to it)
        let dropIt = false;
        let canHaul = (creep.carryCapacity > 0);
        let amFull = (creep.carry.energy === creep.carryCapacity);
        if (canHaul && amFull) {
            if (!creep.memory.dropOffContainerId) {
                // this "find" operation can be expensive, so store the result in memory
                let container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType === STRUCTURE_CONTAINER);
                    }
                });
                if (!container) {
                    // no containers anywhere
                    dropIt = true;
                }
                else if (container.room.id !== creep.room.id) {
                    // not in the same roome
                    dropIt = true;
                }
                else {
                    // have container in the same room
                    creep.memory.dropOffContainerId = container.id;
                }
            }

            let container = Game.getObjectById(creep.memory.dropOffContainerId);
            if (!container) {
                // huh; doesn't exist anymore
                creep.memory.dropOffContainerId = null;
                dropIt = true;
            }

            // have container in the same room
            let result = creep.transfer(container, RESOURCE_ENERGY);
            if (result === ERR_FULL) {
                // whatever; drop it next to it
                dropIt = true;
            }
            else if (result === ERR_NOT_IN_RANGE) {
                creep.moveTo(container);
            }

            if (dropIt) {
                creep.drop(RESOURCE_ENERGY);
            }
        }
        else if (creep.ticksToLive === 1) {
            creep.drop(RESOURCE_ENERGY);
        }
        else {
            let source = Game.getObjectById(creep.memory.energySourceId);

            let result = creep.harvest(source);
            if (result === OK) {
                creep.say("⛏️");
            }
            else if (result === ERR_NOT_IN_RANGE) {
                creep.say('📵');
                creep.moveTo(source, { visualizePathStyle: { stroke: "#ffffff" } });
            }
            else if (result === ERR_BUSY) {
                // still being spawned; ignore
            }
            else {
                // uh oh; problem
                creep.say("❔");
                console.log(creep.name + " harvesting energy source " + source + ": result " + result);
            }
        }
    }
}

