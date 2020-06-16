

const sessionGuides = new Map();
const sessionMembers = new Map();

const ERROR = { status: 'no', reason: "Neither Guide nor Member has joined" };
const NO_MEMBER = { status: 'no', reason: "Awaiting Member" };
const NO_GUIDE = { status: 'no', reason: "Awaiting Guide" };
const GUIDE = "guide";
const COACH = "coach";

/**
 * The Session Data should contain the 
 * sessionId,
 * user fuzzyId and 
 * Role of the user who just joined the session
 * 
 * 
 * @param {*} sessionData 
 * @param {*} socketId 
 */
exports.joinSession = (sessionData, socketId) => {
    const sessionId = sessionData.sessionId;
    const role = sessionData.role;

    if (role === GUIDE || role === COACH) {
        sessionGuides.set(sessionId, { ...sessionData, socketId: socketId });
    }
    else {
        sessionMembers.set(sessionId, { ...sessionData, socketId: socketId });
    }

    return buildAdvice(sessionId);
}


/**
 * Return a suitable advice as a result for this join action,
 * which the socket client receivers may levarage to take action
 * 
 */
function buildAdvice(sessionId) {
    const hasGuide = sessionGuides.has(sessionId);
    const hasMember = sessionMembers.has(sessionId);

    if (!hasGuide && !hasMember) {
        return ERROR;
    }
    if (hasGuide && !hasMember) {
        return NO_MEMBER;
    }
    if (hasMember && !hasGuide) {
        return NO_GUIDE;
    }

    const guideSocketId = sessionGuides.get(sessionId).socketId;
    const memberSocketId = sessionMembers.get(sessionId).socketId;

    return { status: 'ok', reason: "Ready", guideSocketId: guideSocketId, memberSocketId: memberSocketId };
}