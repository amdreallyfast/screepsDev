
let spawnQueue = require("Spawn.QueueMiners");
let roomEnergySources = {}

var QueueMiners = function(spawn) {
    if (!roomEnergySources[spawn.room]) {
        // no records of this room
        roomEnergySources[spawn.room] = spawn.room.find(FIND_SOURCES);
    }
    
    let createNewMiner = false;
    let newMinerEnergySourceId = 0;
    
    // check that all living miners are assigned
    let miners = spawn.room.find(FIND_MY_CREEPS, {
        filter: (creep) => {
            return (creep.memory.role = 'miner');
        }
    });
    for (let miner in miners) {
        // make surce that the energy source is aware that it is being mined
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
    for (let source in roomEnergySources) {
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
            body: [WORK, WORK, WORK, WORK, WORK, MOVE],
            role: "miner",
            energySourceId = newMinerEnergySourceId
        }
        spawnQueue.submit(buildRequest);
    }
}

module.exports = {

};