let roomEnergyMonitoring = require("room.energyLevelMonitoring");

let commonSearches = require("room.commonSearches");
let towerRoutine = require("tower.run");
let spawnBuildQueue = require("room.creepPopulation.buildQueue");
let maintainMinerPopulation = require("room.creepPopulation.miners");
let maintainWorkerPopulation = require("room.creepPopulation.workers");
let maintainEnergyHaulerPopulation = require("room.creepPopulation.energyHaulers");
let creepTraffic = require("room.trafficScan");

// creep jobs
let energyRefillJobs = require("jobs.fillEnergy");
let repairJobs = require("jobs.repair");
let constructionJobs = require("jobs.construction");
let creepJobSystem = require("jobs.workQueue");

// for printing and debugging
let creepWorkRoutine = require("creep.work");
let roomEnergyLevels = require("room.energyLevelMonitoring");


/*------------------------------------------------------------------------------------------------
Description:
    Effectively "main".

    On every tick:
    - Each creep is sent through the work routine corresponding to its role
    - The room's available energy in spanws and extensions is monitored and the available energy 
        level "timeout" counters are updated.
    - Creep traffic is updated and road construction sites are created for high-traffic areas.

    Periodically, room-specific functions are also run:
    - Requesting new creeps to replace expired ones
    - Spawning new creeps
    - Scanning for spawns and containers that need to be filled
    - Scanning for construction sites and submitting them to the creep job system
Creator:    John Cox, 9/2017
------------------------------------------------------------------------------------------------*/
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
    let ticksBetweenBigStuff = 75;
    let countdown = (ticksBetweenBigStuff - (Game.time % ticksBetweenBigStuff)) - 1;
    console.log("big stuff in " + countdown + " ticks");
    let doTheBigStuff = (countdown === 0);
    //doTheBigStuff = false;
    //doTheBigStuff = true;

    let creepAges = "creep ages (ticks remaining): ";
    for (let name in Game.creeps) {
        let creep = Game.creeps[name];
        creepAges += (creep.name + "(" + creep.ticksToLive + "); ");

        creepWorkRoutine.run(creep);
        creepTraffic.scan(creep);
    }

    for (let roomName in Game.rooms) {
        let room = Game.rooms[roomName];

        //commonSearches.run(room);
        //Memory.commonSearches[room.name].myTowers.forEach(function (tower) {
        //    console.log("hi there; this is tower");
        //    towerRoutine.run(tower);
        //})

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
}
