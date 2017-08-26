
var routineHarvest = require("CreepRoutine.HarvestEnergy");
var routineGetEnergy = require("CreepRoutine.GetEnergy");
var jobQueue = require("Jobs.WorkQueue");
var routineUpgradeRoomController = require("CreepRoutine.Upgrade");

// this is the high-level role control for all creeps
var CreepRoutineWork {
    run: function(creep) {
        if (creep.memory.role == "miner") {
            routineHarvest.run(creep);

            // miners don't do any jobs
            return;
        }
        
        let energyEmpty = (creep.energy === 0);
        let energyFull = (creep.energy === creep.energyCapacity);
        let working = creep.memory.working;
        if (working && energyEmpty)
            creep.say("⚡ need energy");
            creep.memory.working = false;
        }
        if (!working && energyFull) {
            creep.memory.working = true;
        }
        
        if (!creep.memory.working) {
            routineGetEnergy.run(creep);
            return;
        }
        
        // get to work
        if (!creep.memory.job) {
            jobQueue.assignJobTo(creep);
        }
        
        if (!creep.memory.job) {
            // still no work available; default to upgrading the room controller
            routineUpgradeRoomController.run(creep);
        }
        
        // have a job
        
    }
}

module.exports = CreepRoutineWork;
