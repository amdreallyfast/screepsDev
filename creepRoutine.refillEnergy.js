
module.exports = {
    run: function (creep) {
        let notMyJob = (creep.memory.role !== "worker");
        let noJob = (!creep.memory.refillEnergyJobId);
        if (notMyJob || noJob) {
            return;
        }

        let structure = Game.getObjectById(creep.memory.refillEnergyJobId);
        if (structure.energy === structure.energyCapacity) {
            creep.memory.refillEnergyJobId = null;
        }

        creep.say("⚡");
        if (creep.transfer(structure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(structure);
        }
    }
}
