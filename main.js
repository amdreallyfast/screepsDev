﻿let spawnBuildQueue = require("spawn.buildQueue");
let queueMinerCreeps = require("spawn.queueMiners");
let queueWorkerCreeps = require("spawn.queueWorkers");
let creepWorkRoutine = require("creepRoutine.work");

let queueFillEnergyJobs = require("jobs.fillEnergy");
let queueRepairJobs = require("jobs.repair");
let queueManualConstructionJobs = require("jobs.manualConstruction")

//var roleHarvester = require('role.harvester');
//var roleUpgrader = require('role.upgrader');
//var roleBuilder = require('role.builder');


// TODO: go through all keys in Memory and see what you don't need; delete those that you don't



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
    //let str = "";
    //repairTargets.forEach(function (target) {
    //    str += (target.structureType + " " + target.hits + "/" + target.hitsMax + ";");
    //});
    //console.log(str);

    var energyRefillTargets = spawn.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
            return (
                structure.structureType == STRUCTURE_EXTENSION ||
                structure.structureType == STRUCTURE_SPAWN ||
                structure.structureType == STRUCTURE_TOWER) && structure.energy < structure.energyCapacity;
        }
    });

    var buildTargets = spawn.room.find(FIND_CONSTRUCTION_SITES);

    let creepAges = "";
    for (var name in Game.creeps) {

        var creep = Game.creeps[name];
        creepAges += (creep.name + "(" + creep.ticksToLive + "); ");
        

        //creepWorkRoutine.run(creep);

        if (creep.memory.role === "worker") {
            workerNumbers[creep.memory.number] = true;
        }

        let energyEmpty = (creep.carry.energy === 0);
        let energyFull = (creep.carry.energy === creep.carryCapacity);
        let working = creep.memory.working;
        if (working && energyEmpty) {
            creep.memory.working = false;
        }
        if (!working && energyFull) {
            creep.memory.working = true;
        }

        if (!creep.memory.working) {
            creep.say("📵");
            if (!creep.memory.energySourceId) {
                //creep.memory.energySourceId = energySources[energySources.length % creep.memory.number].id;
                creep.memory.energySourceId = energySources[0].id;
            }
            let energySource = Game.getObjectById(creep.memory.energySourceId);
            if (creep.harvest(energySource) === ERR_NOT_IN_RANGE) {
                creep.moveTo(energySource, { visualizePathStyle: { stroke: "#ffffff" } });
            }
        }
        //else if (creep.memory.number === 0) {
        //    // one guy is always upgrading (until this new system gets under control)
        //    creep.say("⚙️");
        //    if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
        //        creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: "#ffffff" } });
        //    }
        //}
        else {
            //if (energyRefillTargets.length > 0) {
            //    creep.say("⚡");
            //    if (creep.transfer(energyRefillTargets[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            //        creep.moveTo(energyRefillTargets[0], { visualizePathStyle: { stroke: "#ffffff" } });
            //    }
            //    continue;
            //}

            //if (repairTargets.length > 0) {
            //    creep.say("🔧");
            //    if (creep.repair(repairTargets[0]) === ERR_NOT_IN_RANGE) {
            //        creep.moveTo(repairTargets[0], { visualizePathStyle: { stroke: "#ffffff" } });
            //    }
            //    continue;
            //}

            //if (buildTargets.length > 0 && workersBuilding < 2) {
            //    workersBuilding++;
            //    creep.say("🔨");
            //    if (creep.build(buildTargets[0]) === ERR_NOT_IN_RANGE) {
            //        creep.moveTo(buildTargets[0], { visualizePathStyle: { stroke: "#ffffff" } });
            //    }
            //    continue;
            //}

            // nothing else to do; upgrade controller
            creep.say("⚙️");
            if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: "#ffffff" } });
            }
        }
    }

    //if (!Memory.spawnUpdateTimer) {
    //    Memory.spawnUpdateTimer = 0;
    //}

    //console.log(creepAges);
    

    // 50 ticks is long enough to build all my creeps right now (9-2-2017)
    //console.log(Memory.spawnUpdateTimer);
    //if (Memory.spawnUpdateTimer++ > 50) {
    console.log("that time yet? " + (Game.time % 50));
    let currentTick = Game.time;
    if (currentTick % 50 === 0) {
        //Memory.spawnUpdateTimer = 0;
        queueMinerCreeps.run(spawn.room);
        queueWorkerCreeps.run(spawn.room);
        spawnBuildQueue.constructNextCreepInQueue(spawn);

        queueRepairJobs.run(spawn.room);
        queueManualConstructionJobs.run(spawn.room);

        // the energy is used upon spawning, but it isn't gone until the next tick
        Memory.refillEnergy = true;
    }
    else if (Memory.refillEnergy) {
        queueFillEnergyJobs.run(spawn.room);
        Memory.refillEnergy = false;
    }

    //queueFillEnergyJobs.run(spawn.room);
    

    //queueWorkerCreeps.run(spawn.room);
    //spawnBuildQueue.constructNextCreepInQueue(spawn);


    // refill the workers with any names that might have expired
    var maxWorkers = 6;
    for (let num = 0; num < maxWorkers; num++) {
        let needHarvester = !workerNumbers[num];
        //let haveEnergyToCreate = (spawn.room.energyAvailable >= 550);
        let haveEnergyToCreate = (spawn.room.energyAvailable >= 350);
        //console.log("need harvester " + num + " ?: " + needHarvester + ", have energy to create? " + haveEnergyToCreate);
        if (needHarvester && haveEnergyToCreate) {
            //console.log("creating worker" + num + " with energy source index " + (num % energySources.length));
            let newEnergySourceId = energySources[num % energySources.length].id;
            //spawn.createCreep([WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE], "worker" + num, {
            //spawn.createCreep([WORK, CARRY, MOVE], "worker" + num, {
            spawn.createCreep([WORK, CARRY, MOVE, MOVE], "worker" + num, {
                role: 'worker',
                number: num,
                energySourceId: newEnergySourceId
            });
            break;
        }
    }
}