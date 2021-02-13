const sessionGuides = new Map();
/*
*  sessionID : (Map (userFuzzId : socketID))
*/
const sessionMembers = new Map();
const runningSessions = new Map();
const socketSessions = new Map();

const ERROR = { status: 'no', reason: "The joiner is neither a Guide nor a Member Or has a valid session Id" };
const NO_MEMBER = { status: 'no', reason: "Awaiting Member" };
const NO_GUIDE = { status: 'no', reason: "Awaiting Guide" };

const GUIDE = "guide";
const COACH = "coach";
const MEMBER = "member"

const PERMITTED_ROLES = new Set([GUIDE, COACH, MEMBER]);

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

    if (!isValid(sessionData)) {
        return ERROR;
    }

    const sessionId = sessionData.sessionId;
    const role = sessionData.role;
    const userFuzzyId = sessionData.fuzzyId;

    socketSessions.set(socketId, sessionId);

    if (role === GUIDE || role === COACH) {
        if(sessionGuides.has(sessionId)) {
            const gSocketId = sessionGuides.get(sessionId).socketId;
            socketSessions.delete(gSocketId);
        }
        sessionGuides.set(sessionId, { ...sessionData, socketId: socketId });
    }
    else {
        if(sessionMembers.has(sessionId)) {
            //const mSocketId = sessionMembers.get(sessionId).socketId;
            //socketSessions.delete(mSocketId);
            var sessionMemberData = sessionMembers.get(sessionId);
            if(sessionMemberData.has(userFuzzyId)) {
              const mSocketId = sessionMemberData.get(userFuzzyId);
              socketSessions.delete(mSocketId);
            }
            sessionMemberData.set(userFuzzyId, socketId);
            sessionMembers.set(sessionId, sessionMemberData);


        }
        var sessionMember = new Map();
        sessionMember.set(userFuzzyId, socketId);
        sessionMembers.set(sessionId, sessionMember);
    }

    const advice = buildAdvice(sessionId);

    if (advice.status === 'ok') {
        saveRunningSession(advice);
    }

    return advice;
}

exports.isRunning = (sessionId) => {
    return runningSessions.has(sessionId);
}

exports.count = () => {
    return runningSessions.size;
}

exports.clear = (sessionId) => {

    if (sessionGuides.has(sessionId)) {
        const gSocketId = sessionGuides.get(sessionId).socketId;
        socketSessions.delete(gSocketId);
        sessionGuides.delete(sessionId);
    }

    if (sessionMembers.has(sessionId)) {
        //const mSocketId = sessionMembers.get(sessionId).socketId;
        const sessionMemberMap = sessionMembers.get(sessionId);
        for (let [user, socket] of sessionMemberMap) {
          socketSessions.delete(socket);
        }
        sessionMembers.delete(sessionId);
        runningSessions.delete(sessionId);

    }

}

exports.disconnect = (socketId) => {

    if (!socketSessions.has(socketId)) {
        return false;
    }

    const sessionId = socketSessions.get(socketId);

    if (sessionGuides.has(sessionId) && sessionGuides.get(sessionId).socketId == socketId) {
        sessionGuides.delete(sessionId);
    }

    if (sessionMembers.has(sessionId) && sessionMembers.get(sessionId).socketId == socketId) {
        sessionMembers.delete(sessionId);
    }

    socketSessions.delete(socketId);
    runningSessions.delete(sessionId);

    return true;
}


function saveRunningSession(advice) {
    const sessionId = advice.sessionId;
    runningSessions.set(sessionId, advice);
}


function isValid(sessionData) {
    if (!sessionData) {
        return false;
    }

    if (!PERMITTED_ROLES.has(sessionData.role)) {
        return false;
    }

    if (!sessionData.sessionId) {
        return false;
    }

    return true;
}

/**
 * Return a suitable advice as a result for this join action,
 * which the socket client receivers may levarage to take action
 *
 */
function buildAdvice(sessionId) {
    const hasGuide = sessionGuides.has(sessionId);
    const hasMember = sessionMembers.has(sessionId);

    if (hasGuide && !hasMember) {
        return NO_MEMBER;
    }

    if (hasMember && !hasGuide) {
        return NO_GUIDE;
    }

    const guideSocketId = sessionGuides.get(sessionId).socketId;
    //const memberSocketId = sessionMembers.get(sessionId).socketId;
    const sessionMemberData = sessionMembers.get(sessionId);
    var guestSocketId = [];
    for (let [user, socket] of sessionMemberData) {
      guestSocketId.push(socket);
    }
    //const memberSocketId = sessionMembers.get(sessionId).socketId;

    return { sessionId: sessionId, status: 'ok', reason: "Ready", guideSocketId: guideSocketId, memberSocketId: guestSocketId };
}
