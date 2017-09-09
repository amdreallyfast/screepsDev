let roomEnergyMonitoring = require("room.energyLevelMonitoring");

let spawnBuildQueue = require("room.creepPopulation.buildQueue");
let minerCreepPopulation = require("room.creepPopulation.miners");
let workerCreepPopulation = require("room.creepPopulation.workers");
let creepTraffic = require("room.trafficScan");
let creepWorkRoutine = require("creep.workRoutine.work");

let energyRefillJobs = require("jobs.fillEnergy");
let repairJobs = require("jobs.repair");
let constructionJobs = require("jobs.construction");
let creepJobSystem = require("jobs.workQueue");



// TODO: go through all keys in Memory and see what you don't need; delete those that you don't



module.exports.loop = function () {
    //for (let key in Memory) {
    //    console.log(key);
    //}

    let creepAges = "creep ages (ticks remaining): ";
    for (var name in Game.creeps) {

        var creep = Game.creeps[name];
        creepAges += (creep.name + "(" + creep.ticksToLive + "); ");

        creepWorkRoutine.run(creep);
        creepTraffic.scan(creep);
    }

    // 50 ticks is long enough to build all my creeps right now (9-2-2017)
    var spawn = Game.spawns['Spawn1'];

    let ticksBetweenBigStuff = 50;
    // Note: Due to the nature of mod, the countdown will be on the range [ticksBetweenBigStuff, 1], and never 0.  I like a countdown reaching 0 though, so subtrack 1.
    let countdown = (ticksBetweenBigStuff - (Game.time % ticksBetweenBigStuff)) - 1;
    console.log("big stuff in " + countdown + " ticks");
    if (countdown === 0) {
        console.log(creepAges);
        minerCreepPopulation.queueCreeps(spawn.room);
        workerCreepPopulation.queueCreeps(spawn.room);
        spawnBuildQueue.constructNextCreepInQueue(spawn);
        repairJobs.queueJobs(spawn.room);

        spawnBuildQueue.print(spawn.room)
        creepJobSystem.print(spawn.room);
        Memory.doSomethingNextTick = true;
    }
    else if (Memory.doSomethingNextTick) {
        // energy is removed the next tick after the spawn does something
        energyRefillJobs.queueJobs(spawn.room);

        // construction sites appear the next tick after they are created 
        constructionJobs.queueJobs(spawn.room);

        // wait for the next big event
        Memory.doSomethingNextTick = false;
    }
}
