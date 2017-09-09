
module.exports = {
    run: function (creep) {
        let notMyJob = (creep.memory.role !== "worker");
        let noJob = (!creep.memory.constructionJobId);
        if (notMyJob || noJob) {
            return false;
        }

        let constructionSite = Game.getObjectById(creep.memory.constructionJobId);
        if (!constructionSite) {
            // construction site no longer exists (bad ID or was already finished and is now a structure)
            console.log(creep.name + ": construction site doesn't exist (already built?)");
            creep.memory.constructionJobId = null;
            return false;
        }

        creep.say("🔨");
        if (creep.build(constructionSite) === ERR_NOT_IN_RANGE) {
            creep.moveTo(constructionSite, { visualizePathStyle: { stroke: "#ffffff" } });
        }

        return true;
    }
};
