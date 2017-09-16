
let creepJobQueues = require("jobs.workQueue");

module.exports = {
    /*--------------------------------------------------------------------------------------------
	Description:
        Scans the room for any structures that are not at max hit points and submits them to the 
        repair queue.
	Creator:    John Cox, 9/2017
	--------------------------------------------------------------------------------------------*/
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
