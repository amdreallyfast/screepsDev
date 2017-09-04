
module.exports = {
    run: function (creep) {
        let notMyJob = (creep.memory.role !== "worker");
        let noJob = (!creep.memory.refillEnergyJobId);
        if (notMyJob || noJob) {
            return false;
        }

        let abortJob = false;
        let structure = Game.getObjectById(creep.memory.refillEnergyJobId);
        if (!structure) {
            // huh; structure doesn't exist anymore; decayed? destroyed?
            abortJob = true;
        }
        else if (!structure.energy || !structure.energyCapacity) {
            // Note: "refill energy" jobs are only meant for spawns, extensions, and turrets 
            // because they are the only structures with 'energy' and 'energyCapacity' 
            // properties.  If the structure does not have these, then this structure should not 
            // have submitted a "refill energy" job and it should not be refilled.
            abortJob = true;
        }
        else if (structure.energy === structure.energyCapacity) {
            // already topped off
            abortJob = true;
        }

        if (abortJob) {
            creep.memory.refillEnergyJobId = null;
            return false;
        }

        creep.say("⚡");
        if (creep.transfer(structure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(structure, { visualizePathStyle: { stroke: "#ffffff" } });
        }

        return true;
    }
}
