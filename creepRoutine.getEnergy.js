
module.exports = {
    run: function (creep) {
        if (creep.spawning) {
            return;
        }

        // the queue for miner creeps should have already defined this
        //var energySources = creep.room.find(FIND_SOURCES);
        let energySources = Memory.roomEnergySources[creep.room.name];
        creep.say("📵");
        if (!creep.memory.energyPickupId) {
            // find something
            //console.log(creep.name + ": finding energy pickup");
            let droppedEnergy = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, RESOURCE_ENERGY);
            if (droppedEnergy) {
                //console.log(creep.name + ": found energy drop");
                // TODO: ??make this more distributed amongst multiple energy drops??
                creep.memory.energyPickupId = droppedEnergy.id;
                creep.memory.energyPickupType = "dropped";
            }
            else {
                // no dropped energy, so check containers
                let energyContainers = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType === STRUCTURE_CONTAINER);
                    }
                });
                if (energyContainers.length > 0) {
                    // pick the first one with energy (there will likely be only one such container
                    let goToThis = null;
                    for (let index in energyContainers) {
                        let container = energyContainers[index];
                        if (container.store[RESOURCE_ENERGY] > 0) {
                            goToThis = container;
                            break;
                        }
                    }

                    if (goToThis !== null) {
                        //console.log("found container with '" + goToThis.store[RESOURCE_ENERGY] + "' energy in it");
                        creep.memory.energyPickupId = goToThis.id;
                        creep.memory.energyPickupType = "container";
                    }
                }
                else {
                    // no dropped energy and no containers with energy; do I have do everything myself?
                    //console.log("CreepRoutineGetEnergy::run(...): " + creep.name + ": no energy available");
                    let num = creep.memory.number;
                    let bigger = (energySources.length > num) ? energySources.length : num;
                    let smaller = (energySources.length > num) ? num : energySources.length;
                    smaller = (smaller <= 0) ? 1 : smaller;

                    // space out the harvesting requests using a mod (%) operator so that there isn't a traffic jam 
                    creep.memory.energyPickupId = energySources[bigger % smaller].id;
                    creep.memory.energyPickupType = "harvest";
                }
            }
        }
        else {
            let obj = Game.getObjectById(creep.memory.energyPickupId);
            if (!obj) {
                // not a valid game object (perhaps a dropped energy source that disappeared)
                creep.memory.energyPickupId = null;
                creep.memory.energyPickupType = null;
                return;
            }
        }

        let result = OK;
        let thing = null;
        if (creep.memory.energyPickupType === "dropped") {
            thing = Game.getObjectById(creep.memory.energyPickupId);
            result = creep.pickup(thing);
        }
        else if (creep.memory.energyPickupType === "container") {
            thing = Game.getObjectById(creep.memory.energyPickupId);
            result = creep.withdraw(thing, RESOURCE_ENERGY);
        }
        else if (creep.memory.energyPickupType === "harvest") {
            thing = Game.getObjectById(creep.memory.energyPickupId);
            result = creep.harvest(thing);
        }
        else {
            creep.say(creep.name + ": ❔can haz energy❔");
        }

        if (result === OK) {
            if (creep.carry.energy === creep.carryCapacity) {
                // pick up from a new source next time (keeps things flexible)
                creep.memory.energyPickupId = null;
                creep.memory.energyPickupType = null;
            }
        }
        else if (result === ERR_NOT_IN_RANGE) {
            result = creep.moveTo(thing, { visualizePathStyle: { stroke: "#ffffff" } });
        }
        else {
            console.log("creepRoutine.getEnergy::run(...): " + creep.name + " err '" + result + "'");
        }
    }
}
