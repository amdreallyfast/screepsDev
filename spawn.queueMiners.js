
let spawnQueue = require("spawn.buildQueue");

// a unique number is useful for performing a % operation to scatter the workers among limited resources like energy sources and energy containers 
let NewNumber = function () {
    let num = 0;
    return function () {
        return (num++);
    }
}();

let ensureRoomEnergySourceRecordsExist = function (room) {
    if (!Memory.roomEnergySources) {
        Memory.roomEnergySources = {};
    }
    if (!Memory.roomEnergySources[room.name]) {
        Memory.roomEnergySources[room.name] = room.find(FIND_SOURCES);
    }
}

module.exports = {
    // Note: Multiple spawns can be created in a room as the RCL rises, but the number of workers is dependent on the number of energy sources in the room, which is a constant.  So take a room ID, not a spawn ID.
    run: function (room) {
        ensureRoomEnergySourceRecordsExist(room);

        //let newMinerForEnergySource = [];

        // check that all living miners are assigned
        let miners = room.find(FIND_MY_CREEPS, {
            filter: (creep) => {
                return (creep.memory.role === 'miner');
            }
        });

        // ??how to streamline this? there are usually only 1 or 2 energy sources in a room
        let numEnergySources = Memory.roomEnergySources[room.name].length;
        if (miners.length < numEnergySources) {
            let newMinerNumber = NewNumber();
            let newRole = "miner";
            let buildRequest = {
                body: [WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE],
                name: newRole + newMinerNumber,
                role: newRole,
                num: newMinerNumber,
                energySourceId: Memory.roomEnergySources[room.name][newMinerNumber % numEnergySources].id
            }
            spawnQueue.submit(buildRequest, spawn);
            // not enough miners
            //for (let index in Memory.roomEnergySources[room.name].length) {
            //    let source = Memory.roomEnergySources[room.name][index];
            //    if (!source.memory.assignedMinerId) {
            //        // no miner assigned
            //        newMinerRequests[newMinerRequests.length] = source.id;
            //    }
            //    else {
            //        let miner = Game.getObjectById(source.memory.assignedMinerId);
            //        if (!miner) {
            //            // miner no longer exists
            //            newMinerRequests[newMinerRequests.length] = source.id;
            //        }
            //        else {
            //            // miner assigned and miner exists; all is well
            //        }
            //    }
            //}
        }

        //for (let index in miners) {
        //    // make sure that the energy source is aware that it is being mined
        //    let miner = miners[index];
        //    let energySource = Game.getObjectById(miner.memory.energySouceId);
        //    energySource.memory.minerId = miner.id;

        //    if (miner.ticksToLive < 50) {
        //        // replace it
        //        createNewMiner = true;
        //        newMinerEnergySourceId = miner.memory.energySouceId;
        //        break;
        //    }
        //}

        //// now check that all energy sources have a miner assigned
        //for (let sourceId in roomEnergySources) {
        //    let source = Game.getObjectById(sourcId);
        //    if (!source.memory.minerId) {
        //        // no miner assigned
        //        createNewMiner = true;
        //        newMinerEnergySourceId = source.id;
        //        break;
        //    }
        //    else {
        //        let miner = Game.getObjectById(source.memory.minerId);
        //        if (!miner) {
        //            // miner no longer exists
        //            createNewMiner = true;
        //            newMinerEnergySourceId = source.id;
        //            break;
        //        }
        //        else {
        //            // miner assigned and miner exists; all is well
        //        }
        //    }
        //}

        //if (createNewMiner) {
        //    let buildRequest = {
        //        body: [WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE],
        //        name: NewName("miner"),
        //        role: "miner",
        //        energySourceId: newMinerEnergySourceId
        //    }
        //    spawnQueue.submit(buildRequest, spawn);
        //}
    }
}
