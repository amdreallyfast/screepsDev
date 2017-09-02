
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
                creep.say("⚡");
                if (creep.transfer(energyRefillTargets[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(energyRefillTargets[0], { visualizePathStyle: { stroke: "#ffffff" } });
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
