
var routineHarvest = require("creepRoutine.harvestEnergy");
var routineGetEnergy = require("creepRoutine.getEnergy");
var routineRefill = require("creepRoutine.refillEnergy");
var routineRepair = require("creepRoutine.repair");
var routineBuild = require("creepRoutine.build");
var routineUpgrade = require("creepRoutine.upgrade");

//var jobQueue = require("Jobs.WorkQueue");

// TODO: rename to creep.doTheThing
// this is the high-level role control for all creeps
module.exports = {
    run: function(creep) {
        if (creep.memory.role == "miner") {
            routineHarvest.run(creep);

            // miners don't do any jobs
            return;
        }
        
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
            //jobQueue.assignJobs(creep);
            //if (!creep.memory.refillEnergyJobId) {
            //    // energy refill takes presendence so that the spawn and extensions are ready to 
            //    // build and so that the turrets are ready to shoot
            //    creep.memory.priorityJob = "refill";
            //}
            //else if (!creep.memory.repairJobId) {
            //    // stop stuff from breaking down
            //    creep.memory.priorityJob = "repair";
            //}
            //else if (!creep.memory.constructionJobId) {
            //    // roads, bypasses (gotta build bypasses), whatever
            //    creep.memory.priorityJob = "construction";
            //}
            //else {
            //    // nothing else to do, so upgrade the controller
            //    creep.memory.priorityJob = "upgrade";
            //}
        }


        
        if (!creep.memory.working) {
            //console.log(creep.name + " getting energy");
            routineGetEnergy.run(creep);
        }
        else {
            if (!creep.memory.refillEnergyJobId) {
                //console.log(creep.name + " delivering");
                var energyRefillTargets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (
                            structure.structureType == STRUCTURE_EXTENSION ||
                            structure.structureType == STRUCTURE_SPAWN ||
                            structure.structureType == STRUCTURE_TOWER) && structure.energy < structure.energyCapacity;
                    }
                });
                if (energyRefillTargets.length > 0) {
                    let num = creep.memory.number;
                    let bigger = (energyRefillTargets.length > num) ? energyRefillTargets.length : num;
                    let smaller = (energyRefillTargets.length > num) ? num : energyRefillTargets.length;
                    smaller = (smaller <= 0) ? 1 : smaller;

                    //// space out the delivery requests using a mod (%) operator so that there isn't a traffic jam with everyone delivering to one place at the same time
                    //console.log(creep.name + " has number " + creep.memory.number + ", there are " + energyRefillTargets.length + " refill targets");
                    //console.log("bigger % smaller = " + bigger + " % " + smaller + " = " + (bigger % smaller));
                    //console.log(energyRefillTargets[bigger % smaller]);
                    creep.memory.refillEnergyJobId = energyRefillTargets[bigger % smaller].id;
                    //creep.memory.refillEnergyJobId = energyRefillTargets[0].id;
                }
            }

            if (creep.memory.number < 4 && creep.memory.refillEnergyJobId !== null) {   // fudging this: worker creeps 0-3 will be on refill duty (until I get the "refill jobs" running
                creep.say("⚡");
                let delivery = Game.getObjectById(creep.memory.refillEnergyJobId);
                let result = creep.transfer(delivery, RESOURCE_ENERGY);
                if (result === OK || result === ERR_FULL) {
                    creep.memory.refillEnergyJobId = null
                }
                else if (result === ERR_NOT_IN_RANGE) {
                    creep.moveTo(delivery, { visualizePathStyle: { stroke: "#ffffff" } });
                }
                else {
                    //??throw a fit??
                }
            }

                //// very useful
                //// http://unicode.org/emoji/charts/emoji-style.txt
            //if (creep.memory.priorityJob === "refill") {
            //    routineRefill.run(creep);
            //}
            //else if (creep.memory.priorityJob === "repair") {
            //    routineRepair.run(creep);
            //}
            //else if (creep.memory.priorityJob === "construction") {
            //    routineBuild.run(creep);
            //}
            else if (creep.memory.priorityJob === "upgrade") {
                routineUpgrade.run(creep);
            }
            else {
                // uh oh; problem
                creep.say(creep.name + " ❔");
                creep.memory.priorityJob = "upgrade";
            }
        }
    }
}
