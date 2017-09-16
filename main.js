let roomEnergyMonitoring = require("room.energyLevelMonitoring");

let spawnBuildQueue = require("room.creepPopulation.buildQueue");
let maintainMinerPopulation = require("room.creepPopulation.miners");
let maintainWorkerPopulation = require("room.creepPopulation.workers");
let maintainEnergyHaulerPopulation = require("room.creepPopulation.energyHaulers");
let creepTraffic = require("room.trafficScan");

let energyRefillJobs = require("jobs.fillEnergy");
let repairJobs = require("jobs.repair");
let constructionJobs = require("jobs.construction");
let creepJobSystem = require("jobs.workQueue");

// for printing and debugging
let creepWorkRoutine = require("creep.workRoutine.work");
let roomEnergyLevels = require("room.energyLevelMonitoring");


module.exports.loop = function () {
    //// TODO: clear out existing creep memories and traffic and job queues and all that stuff; clean slate
    //let str = "";
    //for (let key in Memory) {
    //    str += (key + "; ");
    //    //delete Memory[key];
    //}
    //console.log("Memory keys: " + str);


    // Note: Due to the nature of mod, the countdown will be on the range 
    // [ticksBetweenBigStuff, 1], and never 0.  I like a countdown reaching 0 though, so 
    // subtrack 1.
    let ticksBetweenBigStuff = 30;
    let countdown = (ticksBetweenBigStuff - (Game.time % ticksBetweenBigStuff)) - 1;
    console.log("big stuff in " + countdown + " ticks");
    let doTheBigStuff = (countdown === 0);
    //doTheBigStuff = false;
    //doTheBigStuff = true;

    // TODO: update with a module that takes into account all rooms
    let creepAges = "creep ages (ticks remaining): ";
    for (let name in Game.creeps) {

        let creep = Game.creeps[name];
        creepAges += (creep.name + "(" + creep.ticksToLive + "); ");

        creepWorkRoutine.run(creep);
        creepTraffic.scan(creep);
    }

    for (let roomName in Game.rooms) {
        let room = Game.rooms[roomName];

        // energy level monitoring every tick
        roomEnergyLevels.update(room);

        // most things are a bit expensive, so do them only periodically
        if (doTheBigStuff) {
            console.log(creepAges);
            maintainMinerPopulation.queueCreeps(room);
            maintainEnergyHaulerPopulation.queueCreeps(room);
            maintainWorkerPopulation.queueCreeps(room);

            spawnBuildQueue.print(room);
            //creepTraffic.print(room);
            roomEnergyLevels.print(room);

            let roomSpawns = room.find(FIND_MY_SPAWNS);
            roomSpawns.forEach(function(spawn) {
                spawnBuildQueue.constructNextCreepInQueue(spawn);
            });

            repairJobs.queueJobs(room);
            Memory.doSomethingNextTick = true;
        }
        else if (Memory.doSomethingNextTick) {
            Memory.doSomethingNextTick = false;

            // energy is removed the next tick after the creep begins spawning
            energyRefillJobs.queueJobs(room);
            
            // construction sites appear the next tick after they are created
            constructionJobs.queueJobs(room);

            // wait for the construction jobs to finish queue before printing the job lists
            creepJobSystem.print(room);
        }
    }





    //// 50 ticks is long enough to build all my creeps right now (9-2-2017)
    //var spawn = Game.spawns['Spawn1'];

    //let ticksBetweenBigStuff = 75;
    //// Note: Due to the nature of mod, the countdown will be on the range [ticksBetweenBigStuff, 1], and never 0.  I like a countdown reaching 0 though, so subtrack 1.
    //let countdown = (ticksBetweenBigStuff - (Game.time % ticksBetweenBigStuff)) - 1;
    //console.log("big stuff in " + countdown + " ticks");
    //if (countdown === 0) {
    //    console.log(creepAges);
    //    maintainMinerPopulation.queueCreeps(spawn.room);
    //    maintainWorkerPopulation.queueCreeps(spawn.room);
    //    spawnBuildQueue.print(spawn.room);
    //    //creepTraffic.print(spawn.room);
    //    roomEnergyLevels.print(spawn.room);

    //    spawnBuildQueue.constructNextCreepInQueue(spawn);
    //    repairJobs.queueJobs(spawn.room);

    //    Memory.doSomethingNextTick = true;
    //}
    //else if (Memory.doSomethingNextTick) {
    //    // energy is removed the next tick after the spawn does something
    //    energyRefillJobs.queueJobs(spawn.room);

    //    // construction sites appear the next tick after they are created 
    //    constructionJobs.queueJobs(spawn.room);

    //    // wait for the next big event
    //    Memory.doSomethingNextTick = false;

    //    // wait for the construction jobs to finish queueing before printing the jobs
    //    creepJobSystem.print(spawn.room);
    //}

    //spawnBuildQueue.clear(spawn.room);
    //maintainMinerPopulation.queueCreeps(spawn.room);
    //maintainWorkerPopulation.queueCreeps(spawn.room);


    //spawnBuildQueue.constructNextCreepInQueue(spawn);

    //constructionJobs.queueJobs(spawn.room);
    //roomEnergyLevels.print(spawn.room);
}
