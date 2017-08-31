
//var spawnBuildQueue = require('Spawn.BuildQueue');

//var NewName = function() {
//    var num = 0;
//    var baseName = "creepy";
//    return function() {
//        return (baseName + (num++));
//    }
//}();

//var UpdateSpawn(spawn) {
//    if (spawn.spawning !== null) {
//        // busy
//        return;
//    }
    
//    if (!spawnBuildQueue.haveBuildJob(spawn)) {
//        // nothing to do
//        return;
//    }
    
//    if (spawn.room.energyAvailable < spawnBuildQueue.requiredEnergyForNext(spawn)) {
//        // "need additional pylons"
//        return;
//    }
    
//    // spawn is not building, there is a queued creep build request, and there is energy to build it
//    var next = spawnBuildQueue.getNext(spawn);
//    if (next.role === "miner") {
//        spawn.createCreep(next.body, NewName(), {role: next.role, energySouceId: next.energySourceId});
//    }
//    else {
//        spawn.createCreep(next.body, NewName(), {role: next.role});
//    }
    
//}

//module.exports = UpdateSpawn;