
module.exports = {
    run: function (creep) {
        if (creep.spawning) {
            return;
        }

        var energySources = creep.room.find(FIND_SOURCES);
        creep.say("📵");

        //if (creep.name === "worker0") {
            //console.log(creep.name + ": pickup id '" + creep.memory.energyPickupId + "'");
            //let container = Game.getObjectById(creep.memory.energyPickupId);
            //console.log(container.structureType);
            if (!creep.memory.energyPickupId) {
                // find something
                console.log(creep.name + ": finding energy pickup");
                let droppedEnergy = null;//creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, RESOURCE_ENERGY);
                if (droppedEnergy) {
                    console.log(creep.name + ": found energy drop");
                    // TODO: ??make this more distributed amongst multiple energy drops??
                    creep.memory.energyPickupId = droppedEnergy.id;
                    creep.memory.energyPickupType = "dropped";
                }
                else {
                    // no dropped energy, so check containers
                    let energyContainers = creep.room.find(FIND_STRUCTURES, {
                        filter: (structure) => {
                            console
                            return (
                                structure.structureType === STRUCTURE_CONTAINER);
                        }
                    });
                    if (energyContainers.length > 0) {
                        // go to the one with the most energy (that is, the most likely to run out of space soon)
                        let goToThis = null;
                        for (let index in energyContainers) {
                            let container = energyContainers[index];
                            if (container.store[RESOURCE_ENERGY] > 0) {
                                goToThis = container;
                                break;
                            }
                        }

                        if (goToThis !== null) {
                            //console.log("found container: '" + goToThis.structureType + '"');
                            creep.memory.energyPickupId = goToThis.id;
                            creep.memory.energyPickupType = "container";
                        }

                    }
                    else {
                        // uh oh; no dropped energy and no containers with energy
                        console.log("CreepRoutineGetEnergy::run(...): " + creep.name + ": no energy available");
                        //creep.moveTo(Game.spawns['Spawn1']);
                        return;
                    }
                }
            }
            else {
                //creep.memory.energyPickup = null;
                //creep.memory.energyPickupId = null;
                //creep.memory.energyPickupType = null;
            }


            //console.log(creep.name + " hi there");
            if (creep.memory.energyPickupType === "dropped") {
                let energyDrop = Game.getObjectById(creep.memory.energyPickupId);
                //console.log(creep.name + ": energy drop '" + energyDrop.resourceType + "'");
                if (energyDrop) {
                    let result = creep.pickup(energyDrop);
                    if (result === OK) {
                        creep.memory.energyPickupId = null;
                        creep.memory.energyPickupType = null;
                    }
                    else if (result === ERR_NOT_IN_RANGE) {
                        result = creep.moveTo(energyDrop, { vizualizePathStyle: { stroke: "#ffffff" } });
                    }
                    else {
                        console.log("CreepRoutineGetEnergy::run(...): " + creep.name + " err '" + result + "'");
                    }
                }
            }
            else if (creep.memory.energyPickupType === "container") {
                let container = Game.getObjectById(creep.memory.energyPickupId);
                //console.log(creep.name + ": container has '" + container.store[RESOURCE_ENERGY] + "' energy in it");
                if (container) {
                    let result = creep.withdraw(container, RESOURCE_ENERGY);
                    if (result === OK) {
                        creep.memory.energyPickupId = null;
                        creep.memory.energyPickupType = null;
                    }
                    else if (result === ERR_NOT_IN_RANGE) {
                        result = creep.moveTo(container, { visualizePathStyle: { stroke: "#ffffff" } });
                    }
                    else {
                        console.log("CreepRoutineGetEnergy::run(...): " + creep.name + " err '" + result + "'");
                    }
                }
            }
        //}
        //else {
        //    if (!creep.memory.energySourceId) {
        //        creep.memory.energySourceId = energySources[energySources.length % creep.memory.number].id;
        //    }
        //    let energySource = Game.getObjectById(creep.memory.energySourceId);
        //    if (creep.harvest(energySource) == ERR_NOT_IN_RANGE) {
        //        creep.moveTo(energySource, { visualizePathStyle: { stroke: "#ffffff" } });
        //    }
        //}




        //// go to the energy pickup
        //let result = OK;
        //if (creep.memory.energyPickupType === "dropped") {
        //    let energyDrop = Game.getObjectById(creep.memory.energyPickupId);
        //    result = creep.pickup(energyDrop);
        //}
        //else if (creep.memory.energyPickupType === "container") {
        //    let container = Game.getObjectById(creep.memory.energyPickupId);
        //    result = creep.withdraw(container, RESOURCE_ENERGY);
        //}
        //else {
        //    console.log("CreepRoutineGetEnergy::run(...): " + creep.name + ": unknown energy pickup type '" + creep.memory.energyPickupType + "'");
        //    return;
        //}

        //if (result === OK) {
        //    creep.memory.energyPickup = null;
        //    creep.memory.energyPickupType = null;
        //}
        //else if (result === ERR_NOT_IN_RANGE) {
        //    creep.moveTo(creep.memory.energyPickup);
        //}
        //else {
        //    console.log("CreepRoutineGetEnergy::run(...): " + creep.name + " err '" + result + "'");
        //}
    }
}
