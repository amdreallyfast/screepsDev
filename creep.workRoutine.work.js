
let creepJobQueues = require("jobs.workQueue");

var routineHarvest = require("creep.workRoutine.harvestEnergy");
var routineGetEnergy = require("creep.workRoutine.getEnergy");
var routineRefill = require("creep.workRoutine.refillEnergy");
var routineRepair = require("creep.workRoutine.repair");
var routineBuild = require("creep.workRoutine.build");
var routineUpgrade = require("creep.workRoutine.upgrade");


//var jobQueue = require("Jobs.WorkQueue");

// TODO: rename to creep.doTheThing
// this is the high-level role control for all creeps
module.exports = {
    run: function (creep) {
        if (creep.memory.role == "miner") {
            routineHarvest.run(creep);

            // miners don't do any jobs
            return;
        }

        //creep.moveTo(Game.spawns['Spawn1']);
        //return;

        let energyEmpty = (creep.carry.energy === 0);
        let energyFull = (creep.carry.energy === creep.carryCapacity);
        let working = creep.memory.working;
        //console.log(creep.name + ": working? " + working + ", empty? " + energyEmpty + ", full? " + energyFull);
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
            creepJobQueues.getRefillEnergyJobFor(creep);
            creepJobQueues.getRepairJobFor(creep);
            creepJobQueues.getConstructionJobFor(creep);
        }


        //console.log(creep.name + ": refill job (" + creep.memory.refillEnergyJobId + "), repair job (" + creep.memory.repairJobId + "), construction job (" + creep.memory.constructionJobId + ")");

        if (!creep.memory.working) {
            //console.log(creep.name + " getting energy");
            routineGetEnergy.run(creep);
        }
        else {
            // very useful for vizual indication of what the creep is doing
            // http://unicode.org/emoji/charts/emoji-style.txt
            let haveRefillJob = (creep.memory.refillEnergyJobId !== null && creep.memory.refillEnergyJobId !== undefined);
            let haveRepairJob = (creep.memory.repairJobId !== null && creep.memory.repairJobId !== undefined);
            let haveConstructionJob = (creep.memory.constructionJobId !== null && creep.memory.constructionJobId != undefined);

            if (haveRefillJob) {
                // energy refill takes presendence so that the spawn and extensions are ready to 
                // build and so that the turrets are ready to shoot
                if (!routineRefill.run(creep)) {
                    // already working on refills, the code got here, so you're not empty yet, so refill something else
                    //console.log(creep.name + ": getting another refill job");
                    creepJobQueues.getRefillEnergyJobFor(creep);
                }
            }
            else if (haveRepairJob) {
                // stop stuff from breaking down
                routineRepair.run(creep);
            }
            else if (haveConstructionJob) {
                // roads, bypasses (gotta build bypasses), whatever
                routineBuild.run(creep);
            }
            else {
                // nothing else to do, so upgrade the controller
                routineUpgrade.run(creep);
            }
        }
    }
}
