
module.exports = {
    run: function (creep) {
        let notMyJob = (creep.memory.role !== "worker");
        let noJob = (!creep.memory.repairJobId);
        if (notMyJob || noJob) {
            return false;
        }

        let structure = Game.getObjectById(creep.memory.repairJobId);
        if (structure.hits === structure.maxHits) {
            creep.memory.repairJobId = null;
            return false;
        }

        creep.say("🔧");
        if (creep.repair(structure) == ERR_NOT_IN_RANGE) {
            creep.moveTo(structure, { visualizePathStyle: { stroke: "#ffffff" } });
        }

        return true;
    }
}
