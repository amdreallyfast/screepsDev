
module.exports = {
    // Note: Usuallly creeps are low priority.  If there are none then it is high priority (ex: 0 miners takes precedence over building a 3rd and 4th worker, for example), and if it is the "bootstraper" creep (the one that can restart the room) then build priority is critical.
    creepBuildPriorityLow: 1,
    creepBuildPriorityHigh: 2,
    creepBuildPriorityCritical: 3,
}
