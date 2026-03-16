// lib/warning.js - KHAN-MD Warning System (Using JSON file)
const fs = require('fs');
const path = require('path');

// Path to warnings.json in root directory
const warningsPath = path.join(__dirname, '..', 'warnings.json');

// Ensure warnings file exists
if (!fs.existsSync(warningsPath)) {
    fs.writeFileSync(warningsPath, JSON.stringify([]));
}

// ===== LINK WARNINGS (Using JSON file) =====
function getLinkWarnings() {
    try {
        const data = fs.readFileSync(warningsPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading warnings.json:', error);
        return [];
    }
}

function saveLinkWarnings(warningsArray) {
    try {
        fs.writeFileSync(warningsPath, JSON.stringify(warningsArray, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing warnings.json:', error);
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
        console.error('Error getting warning count:', error);
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
        console.error('Error adding warning:', error);
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
        console.error('Error removing warning:', error);
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

module.exports = {
    // Link warnings only (bad word removed)
    getLinkWarnings,
    saveLinkWarnings,
    getLinkWarningCount,
    addLinkWarning,
    removeLinkWarning,
    
    // Generic warning functions
    getWarning,
    addWarning,
    clearWarning
};
