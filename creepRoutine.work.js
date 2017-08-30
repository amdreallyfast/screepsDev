
var routineHarvest = require("creepRoutine.harvestEnergy");
var routineGetEnergy = require("creepRoutine.getEnergy");
var routineRefill = require("creepRoutine.refillEnergy");
var routineRepair = require("creepRoutine.repair");
var routineBuild = require("creepRoutine.build");
var routineUpgrade = require("creepRoutine.upgrade");

var jobQueue = require("Jobs.WorkQueue");

// this is the high-level role control for all creeps
module.exports = {
    run: function(creep) {
        if (creep.memory.role == "miner") {
            routineHarvest.run(creep);

            // miners don't do any jobs
            return;
        }
        
        let energyEmpty = (creep.carry.energy === 0);
        let energyFull = (creep.carry.energy === creep.energyCapacity);
        let working = creep.memory.working;
        if (working && energyEmpty) {
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
            jobQueue.assignJobs(creep);
        }

        // very useful
        // http://unicode.org/emoji/charts/emoji-style.txt
        if (creep.memory.refillEnergyJobId !== null) {
            // energy refill takes presendence so that the spawn and extensions are ready to 
            // build and so that the turrets are ready to shoot
            creep.say("⚡");
            routineRefill.run(creep);
        }
        else if (creep.memory.repairJobId !== null) {
            // stop stuff from breaking down
            creep.say("🔧");
            routineRepair.run(creep);
        }
        else if (creep.memory.constructionJobId !== null) {
            // roads, bypasses (gotta build bypasses), whatever
            creep.say("🔨");
            routineBuild.run(creep);
        }
        else {
            // nothing else to do, so upgrade the controller
            creep.say("⚙️");
            routineUpgrade.run(creep);
        }
    }
}
