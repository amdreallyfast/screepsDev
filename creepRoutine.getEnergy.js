
module.exports = {
    run: function (creep) {
        if (!creep.memory.energyPickup) {
            // find something
            let droppedEnergy = creep.room.find(FIND_DROPPED_ENERGY);
            if (droppedEnergy.length > 0) {
                // TODO: ??make this more distributed amongst multiple energy drops??
                creep.memory.energyPickup = droppedEnergy[0];
                creep.memory.energyPickupType = "dropped";
            }
            else {
                // no dropped energy, so check containers
                let energyContainers = creep.room.find(FIND_MY_STRUCTURES, {
                    filter: (structure) => {
                        return (
                            structure.structureType === STRUCTURE_CONTAINER &&
                            structure.energy > 0);
                    }
                });
                if (energyContainers.length > 0) {
                    // go to the one with the most energy (that is, the most likely to run out of space soon)
                    let goToThis = energyContainers[0];
                    for (let container in energyContainers) {
                        if (container.energy > goToThis.energy) {
                            goToThis = container;
                        }
                    }

                    creep.memory.energyPickup = goToThis;
                    creep.memory.energyPickupType = "container";
                }
                else {
                    // uh oh; no dropped energy and no containers with energy
                    console.log("CreepRoutineGetEnergy::run(...): " + creep.name + ": no energy available");
                    return;
                }
            }
        }

        // go to the energy pickup
        let result = OK;
        if (creep.memory.energyPickupType === "dropped") {
            result = creep.pickup(creep.memory.energyPickup);
        }
        else if (creep.memory.energyPickupType === "container") {
            result = creep.withdraw(creep.memory.energyPickup, RESOURCE_ENERGY);
        }
        else {
            console.log("CreepRoutineGetEnergy::run(...): " + creep.name + ": unknown energy pickup type '" + creep.memory.energyPickupType + "'");
            return;
        }

        if (result === OK) {
            // energy pickup and withdrawl happens in one tick, so move along if it was successful
            creep.memory.energyPickup = null;
            creep.memory.energyPickupType = null;
        }
        else if (result === ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.memory.energyPickup);
        }
        else {
            console.log("CreepRoutineGetEnergy::run(...): " + creep.name + " err '" + result + "'");
        }
    }
}
