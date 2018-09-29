
let creepJobQueues = require("jobs.workQueue");
let routineGetEnergy = require("creep.workRoutine.getEnergy");
let routineRefill = require("creep.workRoutine.refillEnergy");
let routineRepair = require("creep.workRoutine.repair");
let routineBuild = require("creep.workRoutine.build");
let routineUpgrade = require("creep.workRoutine.upgrade");
let myConstants = require("myConstants");
let isDefined = require("utilityFunctions.isDefined");


module.exports = {
    /*--------------------------------------------------------------------------------------------
	Description:
        Governs when a creep should perform a particular work routine and when it should get 
        energy.  A worker creep have multiple jobs on its plate,e ach with different priorities.  
        This routine creeps the creep move around efficiently and not running from low priority 
        work like upgrading the RCL to a refill job just because higher priority work popped up.
	Creator:    John Cox, 9/2017
	--------------------------------------------------------------------------------------------*/
    run: function (creep) {
        if (creep.memory.role !== myConstants.creepRoleWorker) {
            return;
        }

        let energyEmpty = (creep.carry.energy === 0);
        let energyFull = (creep.carry.energy === creep.carryCapacity);
        let working = creep.memory.working;
        if (working && energyEmpty) {
            creep.memory.working = false;
        }
        else if (!working && energyFull) {
            // get to work
            creep.memory.working = true;

            if (creep.memory.number === 0) {
                // bootstrapper only refills and upgrades
                if (!isDefined(creep.memory.refillEnergyJobId)) {
                    creep.memory.refillEnergyJobId = creepJobQueues.getRefillEnergyJob(creep.room);
                }
            }
            else {
                // the other workers let the energy haulers do the refilling while they concentrate on repairing, building, and upgrading
                if (!isDefined(creep.memory.repairJobId)) {
                    creep.memory.repairJobId = creepJobQueues.getRepairJob(creep.room);
                }
                if (!isDefined(creep.memory.constructionJobId)) {
                    creep.memory.constructionJobId = creepJobQueues.getConstructionJob(creep.room);
                }
            }

            //console.log(creep.name + ": refill job is " + creep.memory.refillEnergyJobId);
        }

        if (!creep.memory.working) {
            routineGetEnergy.run(creep);
        }
        else {
            // very useful for visual indication of what the creep is doing
            // http://unicode.org/emoji/charts/emoji-style.txt
            // or here: https://apps.timwhitlock.info/emoji/tables/unicode

            // Note: The "bootstrapper" creep is the first creep spawned and is responsible for 
            // refilling the spawn long enough to start spawning other creeps.  If there is 
            // nothing that needs refilling, it will also upgrade the controller (or at least 
            // stall its decay timer).  This is why there are "creep.memory.number" checks for 
            // repair and construction.
            if (isDefined(creep.memory.refillEnergyJobId)) {
                // energy refill takes presendence so that the spawn and extensions are ready to 
                if (!routineRefill.run(creep)) {
                    // refill something else
                    //console.log(creep.name + ": getting another refill job");
                    creep.memory.refillEnergyJobId = creepJobQueues.getRefillEnergyJob(creep.room);
                }
            }
            else if (isDefined(creep.memory.repairJobId) && creep.memory.number > 0) {
                // stop stuff from breaking down
                if (!routineRepair.run(creep)) {
                    creep.memory.repairJobId = creepJobQueues.getRepairJob(creep.room);
                }
            }
            else if (isDefined(creep.memory.constructionJobId) && creep.memory.number > 0) {
                // roads, bypasses (gotta build bypasses), whatever
                routineBuild.run(creep);
            }
            else if (creep.carry.energy < (0.5 * creep.carryCapacity)) {
                // refill; don't bother running all the way to the RCL with less than half energy
                creep.memory.working = false;
            }
            else {
                // nothing else to do, so upgrade the controller
                routineUpgrade.run(creep);
            }
        }

    }
}
