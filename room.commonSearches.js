
let myConstants = require("myConstants");


/*------------------------------------------------------------------------------------------------
Description:
    Ensures that memory is defined before attempting to access it.  
Creator:    John Cox, 9/2017
------------------------------------------------------------------------------------------------*/
let ensureMemoryExists = function (room) {
    if (!Memory.commonSearches) {
        Memory.commonSearches = {};
    }
    if (!Memory.commonSearches[room.name]) {
        Memory.commonSearches[room.name] = {};
    }
}


/*------------------------------------------------------------------------------------------------
Description:
    This is useful for getting specific lists of things that need to do work.  

    ??do I need to split creeps into their roles or is it ok to simply iterate over all creeps??
Creator:    John Cox, 5/2017
------------------------------------------------------------------------------------------------*/
module.exports = {
    run: function (room) {
        ensureMemoryExists(room);

        let roomSearches = Memory.commonSearches[room.name];

        //let myCreeps = room.find(FIND_MY_CREEPS);
        //roomSearches.myMinerCreepIds = [];
        //roomSearches.myEnergyHaulerCreepIds = [];
        //roomSearches.myWorkerCreepIds = [];
        //myCreeps.forEach(function (creep) {
        //    if (creep.memory.role === myConstants.creepRoleMiner) {
        //        roomSearches.myMinerCreepIds.push(creep.id);
        //    }
        //    else if (creep.memory.role === myConstants.creepRoleEnergyHauler) {
        //        roomSearches.myEnergyHaulerCreepIds.push(creep.id);
        //    }
        //    else if (creep.memory.role === myConstants.creepRoleWorker) {
        //        roomSearches.myWorkerCreepIds.push(creep.id);
        //    }
        //    else {
        //        console.log("common room searches for " + room.name + ": unknown creep role '" + creep.memory.role + "'");
        //    }
        //})

        roomSearches.creepsThatNeedHealing = room.find(FIND_MY_CREEPS, {
            filter: function (creep) {
                return (creep.hits < creep.hitsMax);
            }
        })

        roomSearches.hostileCreeps = room.find(FIND_HOSTILE_CREEPS);


        roomSearches.myTowers = room.find(FIND_STRUCTURES, {
            filter: { structureType: STRUCTURE_TOWER }
        });

    }
}