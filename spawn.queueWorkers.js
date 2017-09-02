
let creepBuildQueue = require("spawn.buildQueue");

//// a unique number is useful for performing a % operation to scatter the workers among limited resources like energy sources and energy containers 
//let NewNumber = function() {
//    let num = 0;
//    return function() {
//        return (num++);
//    }
//}();

// TODO: rename module to room.creepPopulation.workers
module.exports = {
    // Note: Multiple spawns can be created in a room as the RCL rises, but the number of workers is dependent on the number of energy sources in the room, which is a constant.  So take a room, not a spawn.
    run: function (room) {
        let workerCreeps = room.find(FIND_MY_CREEPS, {
            filter: (creep) => {
                return (creep.memory.role === "worker");
            }
        });

        // recycle the worker numbers per room; easier to read and easier to dedect duplicate build requests
        let workerNumbers = [];
        for (let index in workerCreeps) {
            let workerCreep = workerCreeps[index];
            workerNumbers[workerCreep.memory.number] = true;
            // ??check for unassigned energySourceId or ignore because it is set on creation??
        }

        // TODO: ??change the number dynamically somehow? calculate per room based on available resources??
        let maxWorkersPerRoom = 15;
        for (let num = 0; num < maxWorkersPerRoom; num++) {
            if (!workerNumbers[num]) {
                let newRole = "worker";
                let buildRequest = {
                    body: [WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE],
                    name: newRole + num,
                    role: newRole,
                    number: num,
                }

                //console.log("submitting worker creep build request: " + buildRequest.name);
                creepBuildQueue.submit(buildRequest, room);
            }
        }
    }
}
