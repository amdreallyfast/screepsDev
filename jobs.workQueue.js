var jobs = {}


var JobSystem {
    submitBuildJob: function(room, pos, structureType) {
        if (!Jobs[room]) {
            Jobs[room] = {};
            Jobs[room].buildQueue = [];
        }
        
        // TODO: check if it already exists
        Jobs[room].buildQueue.push({
            room: room,
            pos: pos,
            type: structureType
        })
    }
    
    assignBuildJobTo: function(creep) {
        if (!Jobs[room]) {
            return;
        }
        else if (Jobs[room].buildQueue.length == 0) {
            return;
        }
        
        creep.memory.buildThis = Jobs[room].buildQueue.pop();
    }
    
    
    
    
    Update: function(spawn) {
        var room = spawn.room;
        if (!Jobs[room])) {
            // no jobs in the room; create 2 jobs for each energy and mineral deposit
            Jobs[room] = { 
                energyHarvest: {},
                mineralHarvest: {}
            };
            
            var roomEnergySources = room.find(FIND_SOURCES);
            for (var energySource in roomEnergySources) {
                Jobs[room].energyHarvest[energySource] = {
                    // only need 1 uberminer, so I can hard-code a "num current workers < 1" check later
                    numCurrentWorkers: 0,
                }
            }
            
            var roomMineralSources = room.find(FIND_MINERALS);
            for (var mineralSource in roomMineralSources) {
                Jobs[room].mineralHarvest[mineralSource] = {
                    numCurrentWorkers: 0
                }
            }
        }
        
        
        if (!creep.memory.harvestJob) {
            // every creep needs a place to draw energy from
            for (var energySource in Jobs[room].energyHarvest) {
                if (energySource.numCurrentWorkers < energySource.maxWorkers) {
                    creep.memory.harvestJob = energySource;
                    energySource.numCurrentWorkers++;
                }
            }
        }
    }
    
}



module.exports = {

};