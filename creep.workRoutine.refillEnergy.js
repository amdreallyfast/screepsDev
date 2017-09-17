
module.exports = {
    /*--------------------------------------------------------------------------------------------
	Description:
        Transfer energy from the creep to the structure specified by the refill job ID.
    Creator:    John Cox, 9/2017
	--------------------------------------------------------------------------------------------*/
    run: function (creep) {
        let noJob = (!creep.memory.refillEnergyJobId);
        if (noJob) {
            return false;
        }

        let abortJob = false;
        let structure = Game.getObjectById(creep.memory.refillEnergyJobId);
        if (!structure) {
            // huh; structure doesn't exist anymore; decayed? destroyed?
            console.log(creep.name + ": target structure doesn't exist");
            abortJob = true;
        }
        else if (structure.energy === structure.energyCapacity) {
            // already topped off
            console.log(creep.name + ": " + structure.structureType + " refill finished");
            abortJob = true;
        }

        if (abortJob) {
            creep.memory.refillEnergyJobId = null;
            return false;
        }

        creep.say("⚡");
        if (creep.transfer(structure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(structure, { visualizePathStyle: { stroke: "yellow" } });
        }

        return true;
    }
}
