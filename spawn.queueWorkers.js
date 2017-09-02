
let spawnBuildQueue = require("spawn.buildQueue");

// a unique number is useful for performing a % operation to scatter the workers among limited resources like energy sources and energy containers 
let NewNumber = function() {
    let num = 0;
    return function() {
        return (num++);
    }
}();

module.exports = {
    // Note: Multiple spawns can be created in a room as the RCL rises, but the number of workers is dependent on the number of energy sources in the room, which is a constant.  So take a room, not a spawn.
    run: function (room) {
        let numWorkerCreeps = room.find(FIND_MY_CREEPS, {
            filter: (creep) => {
                return (creep.memory.role === "worker");
            }
        });

        // TODO: ??change the number dynamically somehow? calculate per room based on available resources??
        if (numWorkerCreeps < 6) {
            let newNum = NewNumber();
            let newRole = "worker";
            let buildRequest = {
                body: [WORK, WORK, CARRY, MOVE, MOVE, MOVE],
                name: newRole + newNum,
                role: newRole,
                num: newNum
            }
            spawnBuildQueue.submit(buildRequest, spawn);
        }
    }
}
