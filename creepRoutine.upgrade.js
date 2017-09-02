
module.exports = {
    run: function (creep) {
        if (!creep.memory.role === "worker") {
            return;
        }

        // nothing else to do; upgrade controller
        creep.say("⚙️");
        if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: "#ffffff" } });
        }
    }
}
