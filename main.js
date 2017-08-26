var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');

module.exports.loop = function () {
    var tower = Game.getObjectById('83f5fab81be9776972ea15d8');
    if (tower) {
        var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => structure.hits < structure.hitsMax
        });
        if (closestDamagedStructure) {
            tower.repair(closestDamagedStructure);
        }
    
        var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (closestHostile) {
            tower.attack(closestHostile);
        }
    }

    var harvesters = {};
    var builders = {};
    var upgraders = {};
    for(var name in Game.creeps) {
        
        var creep = Game.creeps[name];
        var num = creep.memory.number;
        
        if(creep.memory.role == 'harvester') {
            harvesters[num] = true;
            roleHarvester.run(creep);
        }
        if(creep.memory.role == 'upgrader') {
            upgraders[num] = true;
            roleUpgrader.run(creep);
        }
        if(creep.memory.role == 'builder') {
            builders[num] = true;
            roleBuilder.run(creep);
        }
    }
    
    var spawn = Game.spawns['Spawn1'];

    // refill the workers with any names that might have expired
    var maxHarvesters = 3;
    for (let num = 0; num < maxHarvesters; num++) {
        let needHarvester = !harvesters[num];
        let haveEnergyToCreate = (spawn.room.energyAvailable >= 300);
        //console.log("need harvester " + num + " ?: " + needHarvester);
        if (needHarvester && haveEnergyToCreate) {
            console.log("creating harvester" + num);
            spawn.createCreep([WORK, CARRY, MOVE], "harvester" + num, {role: 'harvester', number: num});
            break;
        }
    }
    
    var maxUpgraders = 8;
    for (let num = 0; num < maxUpgraders; num++) {
        let needUpgrader = !upgraders[num];
        let haveEnergyToCreate = (spawn.energy === spawn.energyCapacity);
        if (needUpgrader && haveEnergyToCreate) {
            console.log("creating upgrader" + num);
            spawn.createCreep([WORK, CARRY, MOVE], "upgrader" + num, {role: 'upgrader', number: num});
            break;
        }
    }
    
    var maxBuilders = 1;
    for (let num = 0; num < maxBuilders; num++) {
        let needBuilder = !builders[num];
        let haveEnergyToCreate = (spawn.energy === spawn.energyCapacity);
        if (needBuilder && haveEnergyToCreate) {
            console.log("creating builder" + num);
            spawn.createCreep([WORK, CARRY, MOVE], "builder" + num, {role: 'builder', number: num});
            break;
        }
    }
}