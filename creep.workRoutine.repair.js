
module.exports = {
    /*--------------------------------------------------------------------------------------------
	Description:
        Encapsulates the repairing of an object.  Discards the creep's repair job if it is done.
	Creator:    John Cox, 9/2017
	--------------------------------------------------------------------------------------------*/
    run: function (creep) {
        let notMyJob = (creep.memory.role !== "worker");
        let noJob = (!creep.memory.repairJobId);
        if (notMyJob || noJob) {
            return false;
        }

        let structure = Game.getObjectById(creep.memory.repairJobId);
        if (structure.hits === structure.hitsMax) {
            console.log(creep.name + ": " + structure.structureType + " finished repairing");
            creep.memory.repairJobId = null;
            return false;
        }

        creep.say("🔧");
        //console.log(creep.name + ": repairing " + structure.structureType + " with " + structure.hits + "/" + structure.hitsMax);
        if (creep.repair(structure) === ERR_NOT_IN_RANGE) {
            creep.moveTo(structure, { visualizePathStyle: { stroke: "#ffffff" } });
        }

        return true;
    }
}
