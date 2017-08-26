
var harvestRoutine = require("HarvestRoutine");
var fillEnergyStorageRoutine = require("FillEnergyStorageRoutine");
var jobSystem = require("JobSystem");

var workerRoutine = function(creep) {
    if (creep.energy === 0) {
        harvestRoutine.run(creep);
        
        return;
    }
    
    // filling containers takes priority
    if (fillEnergyStorageRoutine.run(creep)) {
        // filling containers take priority
        return;
    }
    else {
        // all containers full
    }
    
    // containers are full and the creep has energy; it needs something to do
    if (creep.memory.buildThisId === null) {
        jobSystem.assignBuildJobTo(creep);
    }

    if (creep.memory.currentBuildJob === null) {
        // no jobs available; go upgrade the room controller
        if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: "#ffffff"}});
        }
        
        return;
    }
    
    // have job; do it
    var workObject = Game.getObjectById(creep.memory.buildThisId);
    var buildStatus = creep.build(workObject);
    if (buildStatus === ERR_NOT_IN_RANGE) {
        creep.moveTo(workObject, {visualizePathStyle: {stroke: "#ffffff"}});
    }
    else if (buildStatus === ERR_INVALID_TARGET) {
        // no longer a construction site, so it is done building
        creep.memory.buildThisId = null;
    }
}
