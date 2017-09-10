
let creepJobQueues = require("jobs.workQueue");

let routineHarvest = require("creep.workRoutine.harvestEnergy");
let routineGetEnergy = require("creep.workRoutine.getEnergy");
let routineRefill = require("creep.workRoutine.refillEnergy");
let routineRepair = require("creep.workRoutine.repair");
let routineBuild = require("creep.workRoutine.build");
let routineUpgrade = require("creep.workRoutine.upgrade");

// this is the high-level role control for all creeps
module.exports = {
    run: function (creep) {
        if (creep.memory.role == "miner") {
            routineHarvest.run(creep);

            // miners don't do any jobs
            return;
        }

        // ??how to draw a "fatigue halo" a la bonzAI's creep AI??

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
            if (creep.memory.number === 0) {
                // worker 0 is the emergency refill guy; dedicate refiller
                creepJobQueues.getRefillEnergyJobFor(creep);
            }
            else {
                creepJobQueues.getRefillEnergyJobFor(creep);
                creepJobQueues.getRepairJobFor(creep);
                creepJobQueues.getConstructionJobFor(creep);
            }
        }


        //console.log(creep.name + ": refill job (" + creep.memory.refillEnergyJobId + "), repair job (" + creep.memory.repairJobId + "), construction job (" + creep.memory.constructionJobId + ")");

        if (!creep.memory.working) {
            //console.log(creep.name + " getting energy");
            routineGetEnergy.run(creep);
        }
        else {
            // very useful for vizual indication of what the creep is doing
            // http://unicode.org/emoji/charts/emoji-style.txt
            // or here: https://apps.timwhitlock.info/emoji/tables/unicode
            let haveRefillJob = (creep.memory.refillEnergyJobId !== null && creep.memory.refillEnergyJobId !== undefined);
            let haveRepairJob = (creep.memory.repairJobId !== null && creep.memory.repairJobId !== undefined);
            let haveConstructionJob = (creep.memory.constructionJobId !== null && creep.memory.constructionJobId != undefined);

            if (haveRefillJob) {
                // energy refill takes presendence so that the spawn and extensions are ready to 
                // build and so that the turrets are ready to shoot
                //while (!routineRefill.run(creep)) {
                //    // already working on refills, the code got here, so you're not empty yet, so refill something else
                //    //console.log(creep.name + ": getting another refill job");
                //    creepJobQueues.getRefillEnergyJobFor(creep);
                //}
                if (!routineRefill.run(creep)) {
                    // already working on refills, the code got here, so you're not empty yet, so refill something else
                    //console.log(creep.name + ": getting another refill job");
                    creepJobQueues.getRefillEnergyJobFor(creep);
                }
            }
            else if (haveRepairJob && creep.memory.number > 0) {
                // stop stuff from breaking down
                //while (!routineRepair.run(creep)) {
                //    // got a bad one (or maybe there were duplicates that built up in the job queue)
                //    creepJobQueues.getRepairJobFor(creep);
                //}
                if (!routineRepair.run(creep)) {
                    // got a bad one (or maybe there were duplicates that built up in the job queue)
                    creepJobQueues.getRepairJobFor(creep);
                }
            }
            else if (haveConstructionJob && creep.memory.number > 0) {
                // roads, bypasses (gotta build bypasses), whatever
                //while (!routineBuild.run(creep)) {
                //    // got a bad one (or maybe there were duplicates that built up in the job queue)
                //    creepJobQueues.getConstructionJobFor(creep);
                //}
                routineBuild.run(creep);
            }
            else {
                // nothing else to do, so upgrade the controller
                routineUpgrade.run(creep);
            }
        }
    }
}
