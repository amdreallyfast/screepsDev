
let creepBuildQueue = require("spawn.buildQueue");

//// a unique number is useful for performing a % operation to scatter the workers among limited resources like energy sources and energy containers 
//let NewNumber = function () {
//    let num = 0;
//    return function () {
//        return (num++);
//    }
//}();

let ensureRoomEnergySourceRecordsExist = function (room) {
    if (!Memory.roomEnergySources) {
        Memory.roomEnergySources = {};
    }
    if (!Memory.roomEnergySources[room.name]) {
        Memory.roomEnergySources[room.name] = room.find(FIND_SOURCES);
    }
}


// TODO: rename module to room.creepPopulation.miners
module.exports = {
    // Note: Multiple spawns can be created in a room as the RCL rises, but the number of workers is dependent on the number of energy sources in the room, which is a constant.  So take a room ID, not a spawn ID.
    run: function (room) {
        ensureRoomEnergySourceRecordsExist(room);

        let miners = room.find(FIND_MY_CREEPS, {
            filter: (creep) => {
                return (creep.memory.role === 'miner');
            }
        });

        // ??how to streamline this? there are usually only 1 or 2 energy sources in a room
        let numEnergySources = Memory.roomEnergySources[room.name].length;
        if (miners.length >= numEnergySources) {
            // great
            return;
        }

        // recycle the miner numbers per room; easier to read and easier to dedect duplicate build requests
        let minerNumbers = [];
        for (let index in miners) {
            let minerCreep = miners[index];
            minerNumbers[minerCreep.memory.number] = true;
            // ??check for unassigned energySourceId or ignore because it is set on creation??
        }

        // max miners === num energy sources
        for (let num = 0; num < numEnergySources; num++) {
            if (!minerNumbers[num]) {
                let newRole = "miner";
                let buildRequest = {
                    //body: [WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE],
                    body: [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, MOVE],
                    name: newRole + num,
                    role: newRole,
                    number: num,
                    energySourceId: Memory.roomEnergySources[room.name][num % numEnergySources].id
                }

                //console.log("submitting miner creep build request: " + buildRequest.name);
                creepBuildQueue.submit(buildRequest, room);
            }
        }
    }
}
