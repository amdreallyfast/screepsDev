
let biggerModSmaller = function (array, num) {
    let bigger = (array.length > num) ? array.length : num;
    let smaller = (array.length > num) ? num : array.length;
    smaller = (smaller <= 0) ? 1 : smaller;
    return (bigger % smaller);
}

let pickupDroppedEnergy = function (creep) {
    let droppedEnergyObj = Game.getObjectById(creep.memory.energySourceId);
    let result = creep.pickup(droppedEnergyObj);
    if (result === OK) {
        creep.memory.energySourceId = null;
        creep.memory.energySourceType = null;
    }
    else if (result === ERR_NOT_IN_RANGE) {
        result = creep.moveTo(droppedEnergyObj, { visualizePathStyle: { stroke: "#ffffff" } });
    }
    else {
        console.log("creepRoutine.getEnergy, pickupDroppedEnergy(...) for " + creep.name + ": unknown error " + result);
    }

    return result;
}

let withdrawFromContainer = function (creep) {
    let container = Game.getObjectById(creep.memory.energySourceId);
    let result = creep.withdraw(container);
    if (result === OK) {
        creep.memory.energySourceId = null;
        creep.memory.energySourceType = null;
    }
    else if (result === ERR_NOT_IN_RANGE) {
        result = creep.moveTo(container, { visualizePathStyle: { stroke: "#ffffff" } });
    }
    else if (result === ERR_NOT_ENOUGH_RESOURCES) {
        // must have been a race condition to a container with very little energy and it was emptied before you got there; get a new energy pickup
        creep.memory.energySourceId = null;
        creep.memory.energySourceType = null;
    }
    else {
        console.log("creepRoutine.getEnergy, withdrawFromContainer(...) for " + creep.name + ": unknown error " + result);
    }

    return result;
}

let harvestFromSource = function (creep) {
    // do as the miners do
    let source = Game.getObjectById(creep.memory.energySourceId);
    result = creep.harvest(source);
    if (result === OK) {
        // harvesting requires multiple ticks to fill (unlike pickup up an energy drop or withdrawing from a container), so only reset the energy source once the creep is done
        if (creep.carry.energy === creep.carryCapacity) {
            creep.memory.energySourceId = null;
            creep.memory.energySourceType = null;
        }
    }
    else if (result === ERR_NOT_IN_RANGE) {
        creep.moveTo(source, { visualizePathStyle: { stroke: "#ffffff" } });
        if (creep.memory.energyPickupTimeout++ > 50) {
            creep.memory.energySourceId = null;
            creep.memory.energySourceType = null;
        }
    }
    else {
        console.log("creepRoutine.getEnergy, harvestFromSource(...) for " + creep.name + ": unknown error " + result);
    }

    return result;
}

module.exports = {
    run: function (creep) {
        if (creep.spawning) {
            return;
        }

        //delete creep.energySourceId;
        //delete creep.energySourceType;
        //delete creep.memory.energySourceId;
        //delete creep.memory.energySourceType;

        // the queue for miner creeps should have already defined this
        //var energySources = creep.room.find(FIND_SOURCES);
        let energySources = Memory.roomEnergySources[creep.room.name];
        creep.say("📵");
        if (!creep.memory.energySourceId) {
            // find something
            let energyPickupStatusStr = (creep.name + ": finding energy pickup; ");
            let droppedEnergy = creep.room.find(FIND_DROPPED_RESOURCES, RESOURCE_ENERGY);
            if (droppedEnergy.length > 0) {
                energyPickupStatusStr += "found energy drop";
                creep.memory.energySourceId = droppedEnergy[biggerModSmaller(droppedEnergy, creep.memory.number)].id;
                if (!Game.getObjectById(creep.memory.energySourceId)) {
                    console.log(droppedEnergy)
                }
                creep.memory.energySourceType = "dropped";
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
                    let goToThis = energyContainers[0];
                    creep.memory.energySourceId = goToThis.id;
                    creep.memory.energySourceType = "container";
                    energyPickupStatusStr += ("found container with '" + goToThis.store[RESOURCE_ENERGY] + "' energy in it");
                }
                else {
                    // no dropped energy and no containers with energy; do I have do everything myself?
                    // Note: Space out the harvesting requests using a mod (%) operator so that there isn't a traffic jam.
                    creep.memory.energySourceId = energySources[biggerModSmaller(energySources, creep.memory.number)].id;
                    creep.memory.energySourceType = "harvest";
                    energyPickupStatusStr += ("harvesting from energy source " + creep.memory.energySourceId);

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
            //console.log(creep.name + ": have energy pickup object (" + creep.memory.energySourceId + ")");
        }

        let obj = Game.getObjectById(creep.memory.energySourceId);
        if (!obj) {
            // not a valid game object (perhaps a dropped energy source that disappeared)
            console.log(creep.name + ": not a valid energy pickup object (" + creep.memory.energySourceId + "): " + obj);
            creep.memory.energySourceId = null;
            creep.memory.energySourceType = null;
            return;
        }

        let result = OK;
        if (creep.memory.energySourceType === "dropped") {
            result = pickupDroppedEnergy(creep);
        }
        else if (creep.memory.energySourceType === "container") {
            result = withdrawFromContainer(creep);
        }
        else if (creep.memory.energySourceType === "harvest") {
            result = harvestFromSource(creep);
        }
        else {
            creep.say("pickup❔");
            console.log(creep.name + ": energy source type: " + creep.memory.energySourceType);

            // don't know what went wrong, but whatever it was, get energy from a new source
            creep.memory.energySourceId = null;
            creep.memory.energySourceType = null;
        }
    }
}
