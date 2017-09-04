
module.exports = {
    run: function (creep) {
        let notMyJob = (creep.memory.role !== "worker");
        let noJob = (!creep.memory.constructionJobId);
        if (notMyJob || noJob) {
            return false;
        }

        let constructionSite = Game.getObjectById(creep.memory.constructionJobId);
        if (!constructionSite) {
            // construction site finished
            // Note: The creep.build(...) function does not have a special return value if the 
            // build completed.  The return value OK only says that creep.build(...) was 
            // scheduled successfully.  If the construction site does not exist, then it either 
            // (1) is a bad ID or 
            // (2) construction completed.  
            // Assume the latter unless this becomes a problem.
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
