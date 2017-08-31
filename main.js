let spawnBuildQueue = require("spawn.buildQueue");

var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');

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
        workerNumbers[creep.memory.number] = true;

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
                creep.memory.energySourceId = energySources[energySources.length % creep.memory.number].id;
            }
            let energySource = Game.getObjectById(creep.memory.energySourceId);
            if (creep.harvest(energySource) == ERR_NOT_IN_RANGE) {
                creep.moveTo(energySource, { visualizePathStyle: { stroke: "#ffffff" } });
            }
        }
        else if (creep.memory.number === 0) {
            // one guy is always upgrading (until this new system gets under control)
            creep.say("⚙️");
            if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: "#ffffff" } });
            }
        }
        else {
            if (energyRefillTargets.length > 0) {
                creep.say("⚡");
                if (creep.transfer(energyRefillTargets[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(energyRefillTargets[0], { visualizePathStyle: { stroke: "#ffffff" } });
                }
                continue;
            }

            if (repairTargets.length > 0) {
                creep.say("🔧");
                if (creep.repair(repairTargets[0]) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(repairTargets[0], { visualizePathStyle: { stroke: "#ffffff" } });
                }
                continue;
            }

            if (buildTargets.length > 0 && workersBuilding < 2) {
                workersBuilding++;
                creep.say("🔨");
                if (creep.build(buildTargets[0]) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(buildTargets[0], { visualizePathStyle: { stroke: "#ffffff" } });
                }
                continue;
            }

            // nothing else to do; upgrade controller
            creep.say("⚙️");
            if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: "#ffffff" } });
            }
        }

        //if(creep.memory.role == 'harvester') {
        //    harvesters[num] = true;
        //    //creep.moveTo(spawn);
        //    roleHarvester.run(creep);
        //}
        //if(creep.memory.role == 'upgrader') {
        //    upgraders[num] = true;
        //    creep.moveTo(spawn.room.controller);
        //    //roleUpgrader.run(creep);
        //}
        //if(creep.memory.role == 'builder') {
        //    builders[num] = true;
        //    creep.moveTo(spawn.room.controller);
        //    //roleBuilder.run(creep);
        //}
    }

    var spawn = Game.spawns['Spawn1'];

    // refill the workers with any names that might have expired
    var maxWorkers = 6;
    for (let num = 0; num < maxWorkers; num++) {
        let needHarvester = !workerNumbers[num];
        let haveEnergyToCreate = (spawn.room.energyAvailable >= 550);
        //console.log("need harvester " + num + " ?: " + needHarvester);
        if (needHarvester && haveEnergyToCreate) {
            console.log("creating worker" + num + " with energy source index " + (num % energySources.length));
            let newEnergySourceId = energySources[num % energySources.length].id;
            spawn.createCreep([WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE], "worker" + num, {
                role: 'worker',
                number: num,
                energySourceId: newEnergySourceId
            });
            break;
        }
    }

    //var maxUpgraders = 1;
    //for (let num = 0; num < maxUpgraders; num++) {
    //    let needUpgrader = !upgraders[num];
    //    let haveEnergyToCreate = (spawn.energy === spawn.energyCapacity);
    //    if (needUpgrader && haveEnergyToCreate) {
    //        console.log("creating upgrader" + num);
    //        spawn.createCreep([WORK, CARRY, MOVE], "upgrader" + num, {role: 'upgrader', number: num});
    //        break;
    //    }
    //}

    //var maxBuilders = 2;
    //for (let num = 0; num < maxBuilders; num++) {
    //    let needBuilder = !builders[num];
    //    let haveEnergyToCreate = (spawn.energy === spawn.energyCapacity);
    //    if (needBuilder && haveEnergyToCreate) {
    //        console.log("creating builder" + num);
    //        spawn.createCreep([WORK, CARRY, MOVE], "builder" + num, {role: 'builder', number: num});
    //        break;
    //    }
    //}

    if (spawn.room.energyAvailable >= 550) {
        //console.log("can create uber miner");
    }
}