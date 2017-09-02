
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
        else if (!working && energyFull) {
            // get to work
            // Note: Only switch jobs after getting more energy so that a creep doesn't try to 
            // run all the way across the room when it was already busy just because a higher 
            // priority job popped up.  Creeps are not fast, so have them work until they run 
            // out of energy, get more energy, THEN look for more work.
            creep.memory.working = true;
            jobQueue.assignJobs(creep);
            if (!creep.memory.refillEnergyJobId) {
                // energy refill takes presendence so that the spawn and extensions are ready to 
                // build and so that the turrets are ready to shoot
                creep.memory.priorityJob = "refill";
            }
            else if (!creep.memory.repairJobId) {
                // stop stuff from breaking down
                creep.memory.priorityJob = "repair";
            }
            else if (!creep.memory.constructionJobId) {
                // roads, bypasses (gotta build bypasses), whatever
                creep.memory.priorityJob = "construction";
            }
            else {
                // nothing else to do, so upgrade the controller
                creep.memory.priorityJob = "upgrade";
            }
        }
        
        if (!creep.memory.working) {
            routineGetEnergy.run(creep);
        }
        else {
            // very useful
            // http://unicode.org/emoji/charts/emoji-style.txt
            if (creep.memory.priorityJob === "refill") {
                creep.say("⚡");
                routineRefill.run(creep);
            }
            else if (creep.memory.priorityJob === "repair") {
                creep.say("🔧");
                routineRepair.run(creep);
            }
            else if (creep.memory.priorityJob === "construction") {
                creep.say("🔨");
                routineBuild.run(creep);
            }
            else if (creep.memory.priorityJob === "upgrade") {
                creep.say("⚙️");
                routineUpgrade.run(creep);
            }
            else {
                // uh oh; problem
                creep.say("❔");
            }
        }
    }
}
