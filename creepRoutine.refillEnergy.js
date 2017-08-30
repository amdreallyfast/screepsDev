
module.exports = {
    run: function (creep) {
        if (!creep.memory.refillEnergyJobId) {
            return;
        }

        let structure = Game.getObjectById(creep.memory.refillEnergyJobId);
        if (structure.energy === structure.energyCapacity) {
            creep.memory.refillEnergyJobId = null;
        }

        if (creep.transfer(structure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(structure);
        }
    }
}
