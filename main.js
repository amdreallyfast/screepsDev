let roomEnergyMonitoring = require("room.energyLevelMonitoring");

let spawnBuildQueue = require("room.creepPopulation.buildQueue");
let minerCreepPopulation = require("room.creepPopulation.miners");
let workerCreepPopulation = require("room.creepPopulation.workers");
let creepTraffic = require("room.trafficScan");

let energyRefillJobs = require("jobs.fillEnergy");
let repairJobs = require("jobs.repair");
let constructionJobs = require("jobs.construction");
let creepJobSystem = require("jobs.workQueue");

// for printing and debugging
let creepWorkRoutine = require("creep.workRoutine.work");
let roomEnergyLevels = require("room.energyLevelMonitoring");



// TODO: go through all keys in Memory and see what you don't need; delete those that you don't



module.exports.loop = function () {
    //for (let key in Memory) {
    //    console.log(key);
    //}

    let creepAges = "creep ages (ticks remaining): ";
    for (let name in Game.creeps) {

        let creep = Game.creeps[name];
        creepAges += (creep.name + "(" + creep.ticksToLive + "); ");

        creepWorkRoutine.run(creep);
        creepTraffic.scan(creep);
    }

    // TODO: put all room-specific stuff in here
    for (let roomName in Game.rooms) {
        let room = Game.rooms[roomName];
        roomEnergyLevels.update(room);
        //roomEnergyLevels.print(room);
    }

    // 50 ticks is long enough to build all my creeps right now (9-2-2017)
    var spawn = Game.spawns['Spawn1'];

    let ticksBetweenBigStuff = 75;
    // Note: Due to the nature of mod, the countdown will be on the range [ticksBetweenBigStuff, 1], and never 0.  I like a countdown reaching 0 though, so subtrack 1.
    let countdown = (ticksBetweenBigStuff - (Game.time % ticksBetweenBigStuff)) - 1;
    console.log("big stuff in " + countdown + " ticks");
    if (countdown === 0) {
        console.log(creepAges);
        minerCreepPopulation.queueCreeps(spawn.room);
        workerCreepPopulation.queueCreeps(spawn.room);
        spawnBuildQueue.print(spawn.room);
        //creepTraffic.print(spawn.room);
        roomEnergyLevels.print(spawn.room);

        spawnBuildQueue.constructNextCreepInQueue(spawn);
        repairJobs.queueJobs(spawn.room);

        Memory.doSomethingNextTick = true;
    }
    else if (Memory.doSomethingNextTick) {
        // energy is removed the next tick after the spawn does something
        energyRefillJobs.queueJobs(spawn.room);

        // construction sites appear the next tick after they are created 
        constructionJobs.queueJobs(spawn.room);

        // wait for the next big event
        Memory.doSomethingNextTick = false;

        // wait for the construction jobs to finish queueing before printing the jobs
        creepJobSystem.print(spawn.room);
    }

    //spawnBuildQueue.clear(spawn.room);
    //minerCreepPopulation.queueCreeps(spawn.room);
    //workerCreepPopulation.queueCreeps(spawn.room);


    //spawnBuildQueue.constructNextCreepInQueue(spawn);

    //constructionJobs.queueJobs(spawn.room);
    //roomEnergyLevels.print(spawn.room);
}
