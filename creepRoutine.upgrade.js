
module.exports = {
    run: function (creep) {
        let notMyJob = (creep.memory.role !== "worker");
        if (notMyJob) {
            return;
        }

        // nothing else to do; upgrade controller
        creep.say("⚙️");
        if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: "#ffffff" } });
        }
    }
}
