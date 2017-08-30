
module.exports = {
    run: function (creep) {
        if (!creep.memory.repairJobId) {
            return;
        }

        let structure = Game.getObjectById(creep.memory.repairJobId);
        if (structure.hits === structure.maxHits) {
            creep.memory.repairJobId = null;
        }

        if (creep.repair(structure) == ERR_NOT_IN_RANGE) {
            creep.moveTo(structure);
        }
    }
}
