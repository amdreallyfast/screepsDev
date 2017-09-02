
let spawnQueue = require("spawn.buildQueue");

// TODO: change to Memory.
let roomEnergySources = {}

var NewName = function(role) {
    var num = 0;
    return function() {
        return (role + (num++));
    }
}();

module.exports = {
    run: function(spawn) {
        if (!roomEnergySources[spawn.id]) {
            // no records of this room
            roomEnergySources[spawn.id] = spawn.room.find(FIND_SOURCES);
        }
    
        let createNewMiner = false;
        let newMinerEnergySourceId = 0;
    
        // check that all living miners are assigned
        let miners = spawn.room.find(FIND_MY_CREEPS, {
            filter: (creep) => {
                return (creep.memory.role === 'miner');
            }
        });
        for (let miner in miners) {
            // make sure that the energy source is aware that it is being mined
            let energySource = Game.getObjectById(miner.memory.energySouceId);
            energySource.memory.minerId = miner.id;
        
            if (miner.ticksToLive < 50) {
                // replace it
                createNewMiner = true;
                newMinerEnergySourceId = miner.memory.energySouceId;
                break;
            }
        }
    
        // now check that all energy sources have a miner assigned
        for (let sourceId in roomEnergySources) {
            let source = Game.getObjectById(sourcId);
            if (!source.memory.minerId) {
                // no miner assigned
                createNewMiner = true;
                newMinerEnergySourceId = source.id;
                break;
            }
            else {
                let miner = Game.getObjectById(source.memory.minerId);
                if (!miner) {
                    // miner no longer exists
                    createNewMiner = true;
                    newMinerEnergySourceId = source.id;
                    break;
                }
                else {
                    // miner assigned and miner exists; all is well
                }
            }
        }
    
        if (createNewMiner) {
            let buildRequest = {
                body: [WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE],
                name: NewName("miner"),
                role: "miner",
                energySourceId: newMinerEnergySourceId
            }
            spawnQueue.submit(buildRequest, spawn);
        }
    }
}
