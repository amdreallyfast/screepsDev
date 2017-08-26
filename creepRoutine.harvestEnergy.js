

var CreepRoutineHarvestEnergy = {
    run: function(creep) {
        if (creep.memory.role !== "miner") {
            return;
        }
        
        let source = Game.getObjectById(creep.memory.energySourceId);
        if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
            creep.say('🔄 moving to harvest');
            creep.moveTo(source, {visualizePathStyle: {stroke: "aaaaaa"}});
        }
    }
}

module.exports = CreepRoutineHarvestEnergy;
