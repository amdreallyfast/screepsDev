
let creepBuildQueue = require("room.creepPopulation.buildQueue");
let roomEnergyLevels = require("room.energyLevelMonitoring");

let bodyBasedOnAvailableEnergy = function (roomPotentialEnergy) {
    let body = [];

    // let their move parts be 1/2 of other parts in order to encourage the building of roads
    if (roomPotentialEnergy >= 600) {
        body = [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
    }
    if (roomPotentialEnergy >= 450) {
        body = [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
    }
    else if (roomPotentialEnergy >= 300) {
        body = [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE]
    }
    else {
        // uh oh; not even 300 energy?
    }

    return body;
}
