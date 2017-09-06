
module.exports = {
    run: function (creep) {
        if (creep.spawning) {
            return;
        }

        //creep.memory.energyPickupId = null;

        // the queue for miner creeps should have already defined this
        //var energySources = creep.room.find(FIND_SOURCES);
        let energySources = Memory.roomEnergySources[creep.room.name];
        creep.say("📵");
        if (!creep.memory.energyPickupId) {
            // find something
            let energyPickupStatusStr = (creep.name + ": finding energy pickup");
            let droppedEnergy = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, RESOURCE_ENERGY);
            if (droppedEnergy) {
                energyPickupStatusStr += ("; found energy drop");
                // TODO: ??make this more distributed amongst multiple energy drops??
                creep.memory.energyPickupId = droppedEnergy.id;
                creep.memory.energyPickupType = "dropped";
            }
            else {
                // no dropped energy, so check containers
                let energyContainers = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        if (structure.structureType === STRUCTURE_CONTAINER) {
                            if (structure.store[RESOURCE_ENERGY] > 0) {
                                return true;
                            }
                        }
                        return false;
                    }
                });
                if (energyContainers.length > 0) {
                    //// pick the first one with energy (there will likely be only one such container
                    //let goToThis = null;
                    //for (let index in energyContainers) {
                    //    let container = energyContainers[index];
                    //    if (container.store[RESOURCE_ENERGY] > 0) {
                    //        goToThis = container;
                    //        break;
                    //    }
                    //}

                    let goToThis = energyContainers[0];
                    //if (goToThis !== null) {
                    energyPickupStatusStr += ("; found container with '" + goToThis.store[RESOURCE_ENERGY] + "' energy in it");
                        creep.memory.energyPickupId = goToThis.id;
                        creep.memory.energyPickupType = "container";
                    //}
                }
                else {
                    // no dropped energy and no containers with energy; do I have do everything myself?
                    energyPickupStatusStr += ("harvesting");
                    let num = creep.memory.number;
                    let bigger = (energySources.length > num) ? energySources.length : num;
                    let smaller = (energySources.length > num) ? num : energySources.length;
                    smaller = (smaller <= 0) ? 1 : smaller;

                    // space out the harvesting requests using a mod (%) operator so that there isn't a traffic jam 
                    creep.memory.energyPickupId = energySources[bigger % smaller].id;
                    creep.memory.energyPickupType = "harvest";

                    // Note: Harvesting requires multiple ticks, while energy pickup only needs 
                    // one.  If, in the course of events, a creep is trying to harvest but there 
                    // is someone in the way (perhaps a new miner creep has come in to provide 
                    // dedidcated energy mining and is hogging the mining spot) for a sufficient 
                    // amount of time, reset the energy pickup ID and look for a new energy 
                    // source.  Perhaps an energy drop is now available.  Or maybe it is just a 
                    // traffic jam and this loop will begin again.
                    creep.memory.energyPickupTimeout = 0;
                }
            }

            console.log(energyPickupStatusStr);
        }
        else {
            //console.log(creep.name + ": have energy pickup object (" + creep.memory.energyPickupId + ")");
        }

        let obj = Game.getObjectById(creep.memory.energyPickupId);
        if (!obj) {
            // not a valid game object (perhaps a dropped energy source that disappeared)
            console.log(creep.name + ": not a valid energy pickup object (" + creep.memory.energyPickupId + ")");
            creep.memory.energyPickupId = null;
            creep.memory.energyPickupType = null;
            return;
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
            //console.log(creep.name + "trying to harvest; energy " + creep.carry.energy + "/" + creep.carryCapacity);
            thing = Game.getObjectById(creep.memory.energyPickupId);
            result = creep.harvest(thing);
            if (result === ERR_NOT_IN_RANGE) {
                if (creep.memory.energyPickupTimeout++ > 50) {
                    // you've had enough time to get across the room; must be a traffic jam or there is a miner forever hogging the source
                    creep.memory.energyPickupId = null;
                    return;
                }
            }
        }
        else {
            creep.say("pickup❔");
            console.log(creep.name + ": energy pickup type: " + creep.memory.energyPickupType);
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
