
let myConstants = require("myConstants");


/*------------------------------------------------------------------------------------------------
Description:
    A convenience function for distributing workers amongst energy drops and energy sources.
Creator:    John Cox, 8/2017
------------------------------------------------------------------------------------------------*/
let biggerModSmaller = function (A, B) {
    if (A > B) {
        if (B === 0) {
            return A % (B + 1);
        }
        return A % B;
    }
    else {
        if (A === 0) {
            return B % (A + 1);
        }
        return B % A;
    }
}

/*------------------------------------------------------------------------------------------------
Description:
    Cleans up run(...).  
Creator:    John Cox, 9/2017
------------------------------------------------------------------------------------------------*/
let pickupDroppedEnergy = function (creep) {
    let droppedEnergyObj = Game.getObjectById(creep.memory.energySourceId);
    let result = creep.pickup(droppedEnergyObj);
    if (result === OK) {
        creep.memory.energySourceId = null;
        creep.memory.energySourceType = null;
    }
    else if (result === ERR_NOT_IN_RANGE) {
        result = creep.moveTo(droppedEnergyObj, { visualizePathStyle: { stroke: "blue" } });
    }
    else {
        console.log("creepRoutine.getEnergy, pickupDroppedEnergy(...) for " + creep.name + ": unknown error " + result);
    }

    return result;
}

/*------------------------------------------------------------------------------------------------
Description:
    Cleans up run(...).  Encapsulates the withdrawing of energy from a container or storage 
    structure.
Creator:    John Cox, 9/2017
------------------------------------------------------------------------------------------------*/
let withdrawFromContainer = function (creep) {
    let container = Game.getObjectById(creep.memory.energySourceId);
    let result = creep.withdraw(container, RESOURCE_ENERGY);
    if (result === OK) {
        creep.memory.energySourceId = null;
        creep.memory.energySourceType = null;
    }
    else if (result === ERR_NOT_IN_RANGE) {
        result = creep.moveTo(container, { visualizePathStyle: { stroke: "blue" } });
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

/*------------------------------------------------------------------------------------------------
Description:
    Cleans up run(...).  
Creator:    John Cox, 9/2017
------------------------------------------------------------------------------------------------*/
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
        creep.moveTo(source, { visualizePathStyle: { stroke: "blue" } });
        if (creep.memory.energyPickupTimeout++ > 50) {
            creep.memory.energySourceId = null;
            creep.memory.energySourceType = null;
        }
    }
    else {
        console.log(creep.name + ": creepRoutine.getEnergy, harvestFromSource(...): unknown error " + result);
        creep.memory.energySourceId = null;
        creep.memory.energySourceType = null;
    }

    return result;
}

/*------------------------------------------------------------------------------------------------
Description:
    Cleans up run(...).  Almost identical to getFromStorage(...), but I wanted this to be 
    container-specific so that the container withdrawl and storage withdrawn could be given 
    different priorities.
Creator:    John Cox, 9/2017
------------------------------------------------------------------------------------------------*/
let getFromContainer = function (creep) {
    // no dropped energy, so check containers
    let energyContainers = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
            if (structure.structureType === STRUCTURE_CONTAINER) {
                if (structure.store[RESOURCE_ENERGY] > creep.carryCapacity) {
                    return true;
                }
            }
            return false;
        }
    });
    if (energyContainers.length > 0) {
        //let goToThis = cree
        let goToThis = energyContainers[0];
        creep.memory.energySourceId = goToThis.id;
        creep.memory.energySourceType = "container";
        return true;
    }
    return false;
}

/*------------------------------------------------------------------------------------------------
Description:
    Cleans up run(...).  
Creator:    John Cox, 9/2017
------------------------------------------------------------------------------------------------*/
let getFromStorage = function (creep) {
    // no dropped energy, so check containers
    let storage = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
            if (structure.structureType === STRUCTURE_STORAGE) {
                if (structure.store[RESOURCE_ENERGY] > creep.carryCapacity) {
                    return true;
                }
            }
            return false;
        }
    });
    if (storage.length > 0) {
        let goToThis = storage[0];
        creep.memory.energySourceId = goToThis.id;
        creep.memory.energySourceType = "storage";
        return true;
    }
    return false;
}

/*------------------------------------------------------------------------------------------------
Description:
    Cleans up run(...).  
Creator:    John Cox, 9/2017
------------------------------------------------------------------------------------------------*/
let getFromEnergyDrop = function (creep) {
    let droppedEnergy = creep.room.find(FIND_DROPPED_RESOURCES, RESOURCE_ENERGY);
    if (droppedEnergy.length > 0) {
        let index = biggerModSmaller(droppedEnergy.length, creep.memory.number);
        creep.memory.energySourceId = droppedEnergy[index].id;
        if (!Game.getObjectById(creep.memory.energySourceId)) {
            console.log(droppedEnergy)
        }
        creep.memory.energySourceType = "dropped";
        return true;
    }
    return false;
}

/*------------------------------------------------------------------------------------------------
Description:
    If there is no other option, run this to identify an energy source in the room.  The worker 
    will harvest from it.  This is common when a room is still young and there are no containers 
    yet or the ones that are present are empty.
Creator:    John Cox, 9/2017
------------------------------------------------------------------------------------------------*/
let getFromHarvest = function (creep) {
    // Note: Space out the harvesting requests using a mod (%) operator so that there isn't a traffic jam.
    let energySources = creep.room.find(FIND_SOURCES);
    let index = biggerModSmaller(energySources.length, creep.memory.number);
    creep.memory.energySourceId = energySources[index].id;
    creep.memory.energySourceType = "harvest";

    // Note: Harvesting requires multiple ticks, while energy pickup only needs one.  If, in the 
    // course of events, a creep is trying to harvest but there is someone in the way for a 
    // sufficient amount of time (perhaps a new miner creep has come in to provide dedicated 
    // energy mining and is hogging the mining spot), reset the energy pickup ID and look for a 
    // new energy source.  Perhaps an energy drop is now available.  Or maybe it is just a 
    // traffic jam and this loop will begin again.
    creep.memory.energyPickupTimeout = 0;
}

module.exports = {
    /*--------------------------------------------------------------------------------------------
	Description:
        Runs high-level logic for determining energy acquisition priorities, then runs the 
        routines to obtain the energy from that source.

        The logic is split into "identify pickup" and "obtain from pickup".  The creep will very 
        likely spend time moving to the energy pickup location, so it should only identify when 
        it begins to move.
	Creator:    John Cox, 8/2017
	--------------------------------------------------------------------------------------------*/
    run: function (creep) {
        if (creep.spawning) {
            return;
        }


        // TODO: have workers search for energy pickups and containers and storage, append the arrays together, then look through them for the closest by path


        creep.say("📵");
        if (!creep.memory.energySourceId) {
            // find something
            let energyPickupStatusStr = (creep.name + ": finding energy pickup; ");
            if (creep.memory.role === myConstants.creepRoleEnergyHauler) {
                // Note: Energy haulers' job is to refill spawns and extensions, then take any 
                // excess and move it to a container or storage structure.  IF there is nothing 
                // dropped, then go to an energy storing structure and pull from there.
                if (getFromEnergyDrop(creep)) {
                    energyPickupStatusStr += "found energy drop";
                }
                else if (getFromContainer(creep)) {
                    energyPickupStatusStr += "found container";
                }
                else if (getFromStorage(creep)) {
                    energyPickupStatusStr += "found storage";
                }
                else {
                    energyPickupStatusStr += "no energy source available";
                }

            }
            else {
                if (getFromContainer(creep)) {
                    energyPickupStatusStr += "found container";
                }
                else if (getFromStorage(creep)) {
                    energyPickupStatusStr += "found storage";
                }
                else if (getFromEnergyDrop(creep)) {
                    energyPickupStatusStr += "found energy drop";
                }
                else if (getFromHarvest(creep)) {
                    energyPickupStatusStr += ("harvesting from energy source " + creep.memory.energySourceId);
                }
                else {
                    energyPickupStatusStr += "no energy source available";
                }
            }
            
            //console.log(energyPickupStatusStr);
        }
        else {
            //console.log(creep.name + ": have energy pickup object (" + creep.memory.energySourceId + ")");
        }

        let obj = Game.getObjectById(creep.memory.energySourceId);
        if (!obj) {
            // not a valid game object (perhaps a dropped energy source that disappeared)
            //console.log(creep.name + ": not a valid energy pickup object ( id: " + creep.memory.energySourceId + ", obj: " + obj + " ): " + obj);
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
