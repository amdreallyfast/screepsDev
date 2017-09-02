let spawnBuildQueue = require("spawn.buildQueue");
let spawnQueueMiners = require("spawn.queueMiners");
let spawnQueueWorkers = require("spawn.queueWorkers");
let creepWorkRoutine = require("creepRoutine.work");

//var roleHarvester = require('role.harvester');
//var roleUpgrader = require('role.upgrader');
//var roleBuilder = require('role.builder');

module.exports.loop = function () {
    var spawn = Game.spawns['Spawn1'];

    let workersBuilding = 0;
    let workerNumbers = {};

    var energySources = spawn.room.find(FIND_SOURCES);

    // Note: FIND_MY_STRUCTURES does not find roads or containers for some reason.
    var repairTargets = spawn.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
            return (structure.hits < structure.hitsMax);
        }
    });

    var energyRefillTargets = spawn.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
            return (
                structure.structureType == STRUCTURE_EXTENSION ||
                structure.structureType == STRUCTURE_SPAWN ||
                structure.structureType == STRUCTURE_TOWER) && structure.energy < structure.energyCapacity;
        }
    });

    var buildTargets = spawn.room.find(FIND_CONSTRUCTION_SITES);


    for (var name in Game.creeps) {

        var creep = Game.creeps[name];

        creepWorkRoutine.run(creep);

        if (creep.memory.role === "worker") {
            workerNumbers[creep.memory.number] = true;
        }

        //let energyEmpty = (creep.carry.energy === 0);
        //let energyFull = (creep.carry.energy === creep.carryCapacity);
        //let working = creep.memory.working;
        //if (working && energyEmpty) {
        //    creep.memory.working = false;
        //}
        //if (!working && energyFull) {
        //    creep.memory.working = true;
        //}

        //if (!creep.memory.working) {
        //    creep.say("📵");
        //    if (!creep.memory.energySourceId) {
        //        creep.memory.energySourceId = energySources[energySources.length % creep.memory.number].id;
        //    }
        //    let energySource = Game.getObjectById(creep.memory.energySourceId);
        //    if (creep.harvest(energySource) == ERR_NOT_IN_RANGE) {
        //        creep.moveTo(energySource, { visualizePathStyle: { stroke: "#ffffff" } });
        //    }
        //}
        //else if (creep.memory.number === 0) {
        //    // one guy is always upgrading (until this new system gets under control)
        //    creep.say("⚙️");
        //    if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
        //        creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: "#ffffff" } });
        //    }
        //}
        //else {
        //    if (energyRefillTargets.length > 0) {
        //        creep.say("⚡");
        //        if (creep.transfer(energyRefillTargets[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        //            creep.moveTo(energyRefillTargets[0], { visualizePathStyle: { stroke: "#ffffff" } });
        //        }
        //        continue;
        //    }

        //    if (repairTargets.length > 0) {
        //        creep.say("🔧");
        //        if (creep.repair(repairTargets[0]) === ERR_NOT_IN_RANGE) {
        //            creep.moveTo(repairTargets[0], { visualizePathStyle: { stroke: "#ffffff" } });
        //        }
        //        continue;
        //    }

        //    if (buildTargets.length > 0 && workersBuilding < 2) {
        //        workersBuilding++;
        //        creep.say("🔨");
        //        if (creep.build(buildTargets[0]) === ERR_NOT_IN_RANGE) {
        //            creep.moveTo(buildTargets[0], { visualizePathStyle: { stroke: "#ffffff" } });
        //        }
        //        continue;
        //    }

        //    // nothing else to do; upgrade controller
        //    creep.say("⚙️");
        //    if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
        //        creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: "#ffffff" } });
        //    }
        //}
    }

    var spawn = Game.spawns['Spawn1'];
    if (!Memory.spawnUpdateTimer) {
        Memory.spawnUpdateTimer = 0;
    }

    // 50 ticks is long enough to build all my creeps right now (9-2-2017)
    if (Memory.spawnUpdateTimer++ > 50) {
        Memory.spawnUpdateTimer = 0;
        spawnQueueMiners.run(spawn.room);
        spawnQueueWorkers.run(spawn.room);
        spawnBuildQueue.run(spawn);
    }
}