
module.exports = {
    run: function (creep) {
        let notMyJob = (creep.memory.role !== "worker");
        let noJob = (!creep.memory.refillEnergyJobId);
        if (notMyJob || noJob) {
            return;
        }

        let structure = Game.getObjectById(creep.memory.refillEnergyJobId);
        if (!structure) {
            // huh; structure doesn't exist anymore; decayed? destroyed?
            creep.memory.refillEnergyJobId = null;
            return;
        }
        else if (structure.energy === structure.energyCapacity) {
            // already topped off
            creep.memory.refillEnergyJobId = null;
            return;
        }

        creep.say("⚡");
        if (creep.transfer(structure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(structure, { visualizePathStyle: { stroke: "#ffffff" } });
        }
    }
}
