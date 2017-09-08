

module.exports = {
    bodyCost: function (bodyParts) {
        let energyRequired = 0;
        bodyParts.forEach(function (part) {
            if (part === WORK) {
                energyRequired += 100;
            }
            else if (part === CARRY) {
                energyRequired += 50;
            }
            else if (part === MOVE) {
                energyRequired += 50;
            }
        });

        return energyRequired;
    }
}
