
let jobQueues = require("jobs.workQueue");


module.exports = {
    run: function (tower) {
        if (tower.memory.attackTargetId === null || tower.memory.attackTargetId === undefined) {
            let enemies = tower.room.find(FIND_HOSTILE_CREEPS);
            if (enemies.length > 0) {
                tower.memory.attackTargetId = enemies[0].id;
            }
        }

        // Note: This scan can be expensive, but there aren't many turrets, so hopefully it won't
        // be a big deal.
        if (tower.memory.healTargetId === null || tower.memory.healTargetId === undefined) {
            let creepsNeedingHealing = tower.room.find(FIND_MY_CREEPS, {
                filter: function(creep) {
                    return creep.hits < creep.hitsMax;
                }
            });
            if (creepsNeedingHealing.length > 0) {
                tower.memory.healTargetId = creepsNeedingHealing[0];
            }
        }

        // the tower will be quite useful for repairing all the roads that are constantly 
        // decaying, letting the workers deal with more important matters like room controller 
        // upgrading
        if (tower.memory.repairJobId === null || tower.memory.repairJobId === undefined) {
            jobQueues.getRepairJobFor(tower);
        }

        let haveAttackTarget = (tower.memory.attackTargetId !== null && tower.memory.attackTargetId !== undefined);
        let haveHealTarget = (tower.memory.healTargetId !== null && tower.memory.healTargetId !== undefined);
        let haveRepairJob = (tower.memory.repairJobId !== null && tower.memory.repairJobId !== undefined);
        
        if (haveAttackTarget) {
            // SHOOT HIM!
            let target = Game.getObjectById(tower.memory.attackTargetId);
            if (target === null || target === undefined) {
                // target is gone
                tower.memory.attackTargetId = null;
            }
            else {
                tower.attack(target);
                return;
            }
        }

        if (haveHealTarget) {
            let creep = Game.getObjectById(tower.memory.healTargetId);
            if (creep === null || creep === undefined) {
                // creep destroyed
                tower.memory.healTargetId = null;
            }
            else {
                tower.heal(creep);
                return;
            }
        }

        if (haveRepairJob) {
            let structure = Game.getObjectById(tower.memory.repairJobId);
            if (structure === null || structure == undefined) {
                // uh oh; structure destroyed (or decayed) before you could get to it
                tower.memory.repairJobId;
            }
            else {
                tower.repair(structure);
            }
        }
    }
}
