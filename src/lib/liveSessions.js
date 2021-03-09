/**
 * We store the userData if the user is a coach for the session
 */
const sessionGuides = new Map();
/*
*  sessionID : (Map (userId : socketID))
*/
const sessionMembers = new Map();
const runningSessions = new Map();
const socketSessions = new Map();

const ERROR = { status: 'no', reason: "The joiner is neither a Guide nor a Member Or has a valid session Id Or has valid user Id" };
const NO_MEMBER = { status: 'no', reason: "Awaiting Member" };
const NO_GUIDE = { status: 'no', reason: "Awaiting Guide" };

const GUIDE = "guide";
const COACH = "coach";
const MEMBER = "member"

const PERMITTED_ROLES = new Set([GUIDE, COACH, MEMBER]);

/**
 * The Session Data should contain the
 * sessionId,
 * user (fuzzy) Id and
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

    const role = sessionData.role;
    const sessionId = sessionData.sessionId;
    socketSessions.set(socketId, sessionId);

    if (role === GUIDE || role === COACH) {
        if (sessionGuides.has(sessionId)) {
            // Delete any previous sockets
            const gSocketId = sessionGuides.get(sessionId).socketId;
            socketSessions.delete(gSocketId);
        }
        sessionGuides.set(sessionId, { ...sessionData, socketId: socketId });
    }
    else {
        captureMemberSocket(sessionData, socketId);
    }

    const advice = buildAdvice(sessionId);

    if (advice.status === 'ok') {
        saveRunningSession(advice);
    }

    return advice;
}

function captureMemberSocket(sessionData, socketId) {

    const sessionId = sessionData.sessionId;
    const userId = sessionData.userId;

    var sessionMemberData = null;

    if (sessionMembers.has(sessionId)) {
        sessionMemberData = sessionMembers.get(sessionId);

        if (sessionMemberData.has(userId)) {
            const mSocketId = sessionMemberData.get(userId);
            socketSessions.delete(mSocketId);
        }
    }
    else {
        sessionMemberData = new Map();
        sessionMembers.set(sessionId, sessionMemberData);
    }
    sessionMemberData.set(userId, socketId);
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

    if (!sessionData.userId) {
        return false;
    }

    return true;
}

/**
 * Return a suitable advice as a result for this join action,
 * which the socket client receivers may levarage to take action
 * 
 * The ES5 Map implementation of MemberSocketMap needs to be carfully serialized.
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
    const members = sessionMembers.get(sessionId);

    const serialized = JSON.stringify(Array.from(members.entries()));

    return { sessionId: sessionId, status: 'ok', reason: "Ready", guideSocketId: guideSocketId, members: serialized };
}

/**
 * The Guide map of a given session id has both the socket id and the user Id.
 *
 * The members of a session is a map of userId to socketId
 * 
 * We return a map of peer user Id along with its socket of a given session
 * except the givenUserId. 
 * 
 * @param {*} sessionId 
 * @param {*} givenUserId 
 */
exports.getPeers = (sessionId, givenUserId) => {
    const peerSocketIds = new Map();

    const guideData = sessionGuides.get(sessionId);
    if (guideData && guideData.userId !== givenUserId) {
        peerSocketIds.set(guideData.userId,guideData.socketId);
    }

    const members = sessionMembers.get(sessionId);
    if (!members) {
        return peerSocketIds;
    }

    for (let [userId, socketId] of members) {
        if (givenUserId === userId) {
            continue;
        }
        peerSocketIds.set(userId,socketId);
    }

    return peerSocketIds;
}