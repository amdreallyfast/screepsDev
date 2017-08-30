var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');

module.exports.loop = function () {
    //var tower = Game.getObjectById('83f5fab81be9776972ea15d8');
    //if (tower) {
    //    var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
    //        filter: (structure) => structure.hits < structure.hitsMax
    //    });
    //    if (closestDamagedStructure) {
    //        tower.repair(closestDamagedStructure);
    //    }
    
    //    var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    //    if (closestHostile) {
    //        tower.attack(closestHostile);
    //    }
    //}

    var spawn = Game.spawns['Spawn1'];


    var harvesters = {};
    var builders = {};
    var upgraders = {};
    
    let harvestSource = 0;


    for(var name in Game.creeps) {
        
        var creep = Game.creeps[name];
        var num = creep.memory.number;

        let energyEmpty = (creep.carry.energy === 0);
        let energyFull = (creep.carry.energy === creep.energyCapacity);
        let working = creep.memory.working;
        if (working && energyEmpty) {
            creep.memory.working = false;
        }
        if (!working && energyFull) {
            creep.memory.working = true;
        }

        if (!creep.memory.working) {
            if (!creep.memory.energySourceId) {
                creep.memory.energySourceId = spawn.room.find(FIND_SOURCES)[0].id;
            }
            let energySource = Game.getObjectById(creep.memory.energySourceId);
            if (creep.harvest(energySource) == ERR_NOT_IN_RANGE) {
                creep.moveTo(energySource, { visualizePathStyle: { stroke: "#ffffff" } });
            }
        }
        else
        {
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
                    console.log(creep.name + ": moving to refill");
                    creep.moveTo(energyRefillTargets[0], { visualizePathStyle: { stroke: "#aaaaaa" } });
                }
            }
            else {
                let buildTargets = creep.room.find(FIND_CONSTRUCTION_SITES);
                if (buildTargets.length > 0) {
                    creep.say("🔨");
                    if (creep.build(buildTargets[0]) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(buildTargets[0], { visualizePathStyle: { stroke: "cccccc" } });
                    }
                }

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
    let energySources = spawn.room.find(FIND_SOURCES);
    var maxHarvesters = 3;
    for (let num = 0; num < maxHarvesters; num++) {
        let needHarvester = !harvesters[num];
        let haveEnergyToCreate = (spawn.room.energyAvailable >= 300);
        //console.log("need harvester " + num + " ?: " + needHarvester);
        if (needHarvester && haveEnergyToCreate) {
            console.log("creating harvester" + num);

            //let newEnergySourceId = energySources[num % energySources.length].id;
            //spawn.createCreep([WORK, CARRY, MOVE], "harvester" + num, {
            //    role: 'harvester',
            //    number: num,
            //    energySourceId: newEnergySourceId
            //});
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
        console.log("can create uber miner");
    }
}