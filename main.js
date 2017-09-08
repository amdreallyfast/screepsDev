let roomEnergyMonitoring = require("room.energyLevelMonitoring");

let spawnBuildQueue = require("room.creepPopulation.buildQueue");
let queueMinerCreeps = require("room.creepPopulation.miners");
let queueWorkerCreeps = require("room.creepPopulation.workers");
let creepWorkRoutine = require("creepRoutine.work");

let queueFillEnergyJobs = require("jobs.fillEnergy");
let queueRepairJobs = require("jobs.repair");
let queueManualConstructionJobs = require("jobs.manualConstruction");
let creepJobQueues = require("jobs.workQueue");



// TODO: go through all keys in Memory and see what you don't need; delete those that you don't



module.exports.loop = function () {
    //let workersBuilding = 0;
    let workerNumbers = {};

    var energySources = Game.spawns['Spawn1'].room.find(FIND_SOURCES);

    //// Note: FIND_MY_STRUCTURES does not find roads or containers for some reason.
    //var repairTargets = spawn.room.find(FIND_STRUCTURES, {
    //    filter: (structure) => {
    //        return (structure.hits < structure.hitsMax);
    //    }
    //});
    ////let str = "";
    ////repairTargets.forEach(function (target) {
    ////    str += (target.structureType + " " + target.hits + "/" + target.hitsMax + ";");
    ////});
    ////console.log(str);

    //var energyRefillTargets = spawn.room.find(FIND_STRUCTURES, {
    //    filter: (structure) => {
    //        return (
    //            structure.structureType == STRUCTURE_EXTENSION ||
    //            structure.structureType == STRUCTURE_SPAWN ||
    //            structure.structureType == STRUCTURE_TOWER) && structure.energy < structure.energyCapacity;
    //    }
    //});

    //var buildTargets = spawn.room.find(FIND_CONSTRUCTION_SITES);

    let creepAges = "";
    for (var name in Game.creeps) {

        var creep = Game.creeps[name];
        creepAges += (creep.name + "(" + creep.ticksToLive + "); ");

        creepWorkRoutine.run(creep);
        //continue;

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
        //        //creep.memory.energySourceId = energySources[energySources.length % creep.memory.number].id;
        //        creep.memory.energySourceId = energySources[0].id;
        //    }
        //    let energySource = Game.getObjectById(creep.memory.energySourceId);
        //    if (creep.harvest(energySource) === ERR_NOT_IN_RANGE) {
        //        creep.moveTo(energySource, { visualizePathStyle: { stroke: "#ffffff" } });
        //    }
        //}
        ////else if (creep.memory.number === 0) {
        ////    // one guy is always upgrading (until this new system gets under control)
        ////    creep.say("⚙️");
        ////    if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
        ////        creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: "#ffffff" } });
        ////    }
        ////}
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




    // 50 ticks is long enough to build all my creeps right now (9-2-2017)
    var spawn = Game.spawns['Spawn1'];

    //console.log(creepAges);
    //spawnBuildQueue.clearQueues(spawn.room);
    //creepJobQueues.clearJobs(spawn.room);

    console.log("that time yet? " + (Game.time % 50));
    let currentTick = Game.time;
    if (currentTick % 50 === 0) {
        console.log(creepAges);
        queueMinerCreeps.run(spawn.room);
        queueWorkerCreeps.run(spawn.room);
        queueRepairJobs.run(spawn.room);
        queueManualConstructionJobs.run(spawn.room);

        // the energy is used upon spawning, but it isn't gone until the next tick
        Memory.refillEnergy = true;

        spawnBuildQueue.constructNextCreepInQueue(spawn);
    }
    else if (Memory.refillEnergy) {
        queueFillEnergyJobs.run(spawn.room);
        Memory.refillEnergy = false;
    }

    for (let name in Game.rooms) {
        //console.log("room loops: " + name);
        let room = Game.rooms[name];
        roomEnergyMonitoring.update(room);
        //roomEnergyMonitoring.printEnergyTimeoutsForRoom(room);
    }



    //// refill the workers with any names that might have expired
    //var maxWorkers = 6;
    //for (let num = 0; num < maxWorkers; num++) {
    //    let needHarvester = !workerNumbers[num];
    //    //let haveEnergyToCreate = (spawn.room.energyAvailable >= 550);
    //    let haveEnergyToCreate = (spawn.room.energyAvailable >= 300);
    //    //console.log("need harvester " + num + " ?: " + needHarvester + ", have energy to create? " + haveEnergyToCreate);
    //    if (needHarvester && haveEnergyToCreate) {
    //        console.log("creating worker" + num + " with energy source index " + (num % energySources.length));
    //        let newEnergySourceId = energySources[num % energySources.length].id;
    //        //spawn.createCreep([WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE], "worker" + num, {
    //        //spawn.createCreep([WORK, CARRY, MOVE], "worker" + num, {
    //        //let body = [WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE];
    //        let body = [WORK, CARRY, MOVE];
    //        //let body = [WORK, CARRY, MOVE, MOVE];
    //        spawn.createCreep(body, "worker" + num, {
    //            role: 'worker',
    //            number: num,
    //            energySourceId: newEnergySourceId
    //        });
    //        break;
    //    }
    //}
}