// Jawad Tech - Warning System for Anti-Link & Anti-Bad Word

const config = require('../config');

// ===== LINK WARNINGS =====
function getLinkWarnings() {
    try {
        if (config.LINK_WARNINGS && Array.isArray(config.LINK_WARNINGS)) {
            return config.LINK_WARNINGS;
        }
        return [];
    } catch (error) {
        return [];
    }
}

function saveLinkWarnings(warningsArray) {
    try {
        config.LINK_WARNINGS = warningsArray;
        process.env.LINK_WARNINGS = warningsArray.join(',');
        return true;
    } catch (error) {
        return false;
    }
}

function getLinkWarningCount(senderNumber) {
    try {
        const warnings = getLinkWarnings();
        for (let item of warnings) {
            if (item.startsWith(senderNumber + '-')) {
                return parseInt(item.split('-')[1]) || 1;
            }
        }
        return 0;
    } catch (error) {
        return 0;
    }
}

function addLinkWarning(senderNumber) {
    try {
        let warnings = getLinkWarnings();
        let found = false;
        let newWarnings = [];
        let newCount = 1;
        
        for (let item of warnings) {
            if (item.startsWith(senderNumber + '-')) {
                let currentCount = parseInt(item.split('-')[1]) || 1;
                newCount = currentCount + 1;
                newWarnings.push(`${senderNumber}-${newCount}`);
                found = true;
            } else {
                newWarnings.push(item);
            }
        }
        
        if (!found) {
            newWarnings.push(`${senderNumber}-1`);
        }
        
        saveLinkWarnings(newWarnings);
        return newCount;
    } catch (error) {
        return 1;
    }
}

function removeLinkWarning(senderNumber) {
    try {
        let warnings = getLinkWarnings();
        let newWarnings = warnings.filter(item => !item.startsWith(senderNumber + '-'));
        saveLinkWarnings(newWarnings);
        return true;
    } catch (error) {
        return false;
    }
}

// Generic warning functions for anti-link
function getWarning(sender) {
    const senderNumber = sender.split('@')[0];
    return getLinkWarningCount(senderNumber);
}

function addWarning(sender) {
    const senderNumber = sender.split('@')[0];
    return addLinkWarning(senderNumber);
}

function clearWarning(sender) {
    const senderNumber = sender.split('@')[0];
    return removeLinkWarning(senderNumber);
}

// ===== BAD WORD WARNINGS =====
function getBadWordWarnings() {
    try {
        if (config.BAD_WORD_WARNINGS && Array.isArray(config.BAD_WORD_WARNINGS)) {
            return config.BAD_WORD_WARNINGS;
        }
        return [];
    } catch (error) {
        return [];
    }
}

function saveBadWordWarnings(warningsArray) {
    try {
        config.BAD_WORD_WARNINGS = warningsArray;
        process.env.BAD_WORD_WARNINGS = warningsArray.join(',');
        return true;
    } catch (error) {
        return false;
    }
}

function getBadWordWarningCount(senderNumber) {
    try {
        const warnings = getBadWordWarnings();
        for (let item of warnings) {
            if (item.startsWith(senderNumber + '-')) {
                return parseInt(item.split('-')[1]) || 1;
            }
        }
        return 0;
    } catch (error) {
        return 0;
    }
}

function addBadWordWarning(senderNumber) {
    try {
        let warnings = getBadWordWarnings();
        let found = false;
        let newWarnings = [];
        let newCount = 1;
        
        for (let item of warnings) {
            if (item.startsWith(senderNumber + '-')) {
                let currentCount = parseInt(item.split('-')[1]) || 1;
                newCount = currentCount + 1;
                newWarnings.push(`${senderNumber}-${newCount}`);
                found = true;
            } else {
                newWarnings.push(item);
            }
        }
        
        if (!found) {
            newWarnings.push(`${senderNumber}-1`);
        }
        
        saveBadWordWarnings(newWarnings);
        return newCount;
    } catch (error) {
        return 1;
    }
}

function removeBadWordWarning(senderNumber) {
    try {
        let warnings = getBadWordWarnings();
        let newWarnings = warnings.filter(item => !item.startsWith(senderNumber + '-'));
        saveBadWordWarnings(newWarnings);
        return true;
    } catch (error) {
        return false;
    }
}

module.exports = {
    // Link warnings
    getLinkWarnings,
    saveLinkWarnings,
    getLinkWarningCount,
    addLinkWarning,
    removeLinkWarning,
    
    // Generic warning functions
    getWarning,
    addWarning,
    clearWarning,
    
    // Bad word warnings
    getBadWordWarnings,
    saveBadWordWarnings,
    getBadWordWarningCount,
    addBadWordWarning,
    removeBadWordWarning
};
