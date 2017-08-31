
let spawnBuildQueue = require("spawn.buildQueue");

var NewName = function(role) {
    var num = 0;
    return function() {
        return (role + (num++));
    }
}();

module.exports = {
    run: function (spawn) {
        let numWorkerCreeps = spawn.room.find(FIND_MY_CREEPS, {
            filter: (creep) => {
                return (creep.memory.role === "worker");
            }
        });

        // TODO: ??change the number dynamically somehow? calculate per room based on available resources??
        if (numWorkerCreeps < 6) {
            let buildRequest = {
                body: [WORK, WORK, CARRY, MOVE, MOVE, MOVE],
                name: NewName("worker"),
                role: "worker",
            }
            spawnBuildQueue.submit(buildRequest, spawn);
        }
    }
}
