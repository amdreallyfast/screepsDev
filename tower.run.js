
let jobQueues = require("jobs.workQueue");
let isDefined = require("utilityFunctions.isDefined");


/*------------------------------------------------------------------------------------------------
Description:
    Ensures that memory is defined before attempting to access it.  
Creator:    John Cox, 9/2017
------------------------------------------------------------------------------------------------*/
let ensureMemoryExists = function (tower) {
    if (!isDefined(Memory.towers)) {
        Memory.towers = {};
    }
    if (!isDefined(Memory.towers[tower.id])) {
        Memory.towers[tower.id] = {};
    }
}


module.exports = {
    run: function (tower) {
        ensureMemoryExists(tower);

        // Note: The module room.commonSearches defines this so that each tower doesn't have to 
        // make a duplicate search.
        let roomSearches = Memory.commonSearches[tower.room.name];
        let towerMemory = Memory.towers[tower.id];

        if (!isDefined(towerMemory.attackTargetId)) {
            if (roomSearches.hostileCreeps.length > 0) {
                towerMemory.attackTargetId = roomSearches.hostileCreeps[0].id;
            }
        }

        // Note: This scan can be expensive, but there aren't many turrets, so hopefully it won't
        // be a big deal.
        if (!isDefined(towerMemory.healTargetId)) {
            if (roomSearches.creepsThatNeedHealing.length > 0) {
                towerMemory.healTargetId = creepsNeedingHealing[0];
            }
        }

        // the tower will be quite useful for repairing all the roads that are constantly 
        // decaying, letting the workers deal with more important matters like room controller 
        // upgrading
        if (!isDefined(towerMemory.repairJobId)) {
            towerMemory.repairJobId = jobQueues.getRepairJob(tower.room);
            if (isDefined(towerMemory.repairJobId)) {
                console.log("tower now has repair job for " + Game.getObjectById(towerMemory.repairJobId));
            }
            else {
                console.log("tower has bad repair job: " + towerMemory.repairJobId);
            }
            
        }

        //let haveAttackTarget = isDefined((towerMemory.attackTargetId !== null && towerMemory.attackTargetId !== undefined);
        //let haveHealTarget = (towerMemory.healTargetId !== null && towerMemory.healTargetId !== undefined);
        //let haveRepairJob = (towerMemory.repairJobId !== null && towerMemory.repairJobId !== undefined);
        
        if (isDefined(towerMemory.attackTargetId)) {
            // SHOOT HIM!
            let target = Game.getObjectById(towerMemory.attackTargetId);
            if (target === null || target === undefined) {
                // target is gone
                towerMemory.attackTargetId = null;
            }
            else {
                tower.attack(target);
                return;
            }
        }

        if (isDefined(towerMemory.healTargetId)) {
            let creep = Game.getObjectById(towerMemory.healTargetId);
            if (creep === null || creep === undefined) {
                // creep destroyed
                towerMemory.healTargetId = null;
            }
            else {
                tower.heal(creep);
                return;
            }
        }

        if (isDefined(towerMemory.repairJobId)) {
            let structure = Game.getObjectById(towerMemory.repairJobId);
            if (isDefined(structure)) {
                if (structure.hits < structure.hitsMax) {
                    console.log("tower repairing")
                    tower.repair(structure);
                }
                else {
                    towerMemory.repairJobId = null;
                }
            }
            else {
                // uh oh; structure destroyed (or decayed) before you could get to it
                towerMemory.repairJobId = null;
            }
        }
    }
}
