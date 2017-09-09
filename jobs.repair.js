
let creepJobQueues = require("jobs.workQueue");

module.exports = {
    queueJobs: function (room) {
        let repairTargets = room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.hits < structure.hitsMax);
            }
        });

        //console.log("number of repair targets: " + repairTargets.length);

        repairTargets.forEach(function (structure) {
            creepJobQueues.submitRepairJob(structure);
        });
    }
}
