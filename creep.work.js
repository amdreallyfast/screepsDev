
let myConstants = require("myConstants");
let minerRoutine = require("creep.runMiner");
let energyHaulerRoutine = require("creep.runEnergyHauler");
let workerRoutine = require("creep.runWorker");


module.exports = {
    /*--------------------------------------------------------------------------------------------
	Description:
        This is the high-level role control for all creeps.  It doesn't do much, so there is a 
        good case for moving this to the "main" module.  This still exists as a relic from an 
        older design, but it may be still useful if more creep specialties are created, which 
        would make this function too crowded for me to feel comfortable putting it in the main 
        loop.
	Creator:    John Cox, 9/2017
	--------------------------------------------------------------------------------------------*/
    run: function (creep) {
        if (creep.memory.role === myConstants.creepRoleMiner) {
            minerRoutine.run(creep);
        }
        else if (creep.memory.role === myConstants.creepRoleEnergyHauler) {
            energyHaulerRoutine.run(creep);
        }
        else if (creep.memory.role === myConstants.creepRoleWorker) {
            workerRoutine.run(creep);
        }
        else {
            console.log(creep.name + ": unknown creep role '" + creep.memory.role + "'");
        }

        return;
    }
}
