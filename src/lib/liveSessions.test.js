/**
 * We are maintaining more than one socket connection for a user 
 * identified by the fuzzyId.
 * 
 */

const liveSessions = require("./liveSessions.js");

describe("Offering advice about a given session", () => {

    it("Should return No when a session has single role", () => {

        liveSessions.clear(25);
        liveSessions.clear(26);

        const userId = '1-1-Gopal';

        const session25 = { sessionId: 25, role: "guide", userId: userId };
        const socketId1 = '1-1~Gopal~25';

        const advice1 = liveSessions.joinSession(session25, socketId1);

        expect(advice1.reason).toBe("Awaiting Member");
        expect(advice1.status).toBe("no");

        const session26 = { sessionId: 26, role: "member", userId: userId };
        const socketId2 = '1-1~Gopal~26';

        const advice2 = liveSessions.joinSession(session26, socketId2);

        expect(advice2.reason).toBe("Awaiting Guide");
        expect(advice2.status).toBe("no");

        liveSessions.clear(25);
        liveSessions.clear(26);
    });

    it("Should return Ok when a session has both the Coach and Member Role", () => {

        const sessionId = 24;

        liveSessions.clear(sessionId);

        const userId1 = '1-1-Gopal';
        const session1 = { sessionId: sessionId, role: "guide", userId: userId1 };
        const socketId1 = '1-1~Gopal~1234';
        liveSessions.joinSession(session1, socketId1);

        const userId2 = '1-1-Raja';
        const session2 = { sessionId: sessionId, role: "member", userId: userId2 };
        const socketId2 = '1-1~Raja~1235'

        const advice2 = liveSessions.joinSession(session2, socketId2);

        expect(advice2.sessionId).toBe(sessionId);
        expect(advice2.reason).toBe("Ready");
        expect(advice2.status).toBe("ok");

        expect(liveSessions.isRunning(sessionId)).toBe(true);
        expect(liveSessions.count()).toBe(1);

        liveSessions.clear(sessionId);
    });

    it("Should return an advice with all the connected member socket ids for a session", () => {

        const sessionId = 24;

        liveSessions.clear(sessionId);

        const userId1 = '1-1-Gopal';
        const session1 = { sessionId: sessionId, role: "guide", userId: userId1 };
        const socketId1 = '1-1~Gopal~1234';
        liveSessions.joinSession(session1, socketId1);

        const userId2 = '1-1-Raja';
        const session2 = { sessionId: sessionId, role: "member", userId: userId2 };
        const socketId2 = '1-1~Raja~1235'
        liveSessions.joinSession(session2, socketId2);

        const userId3 = '1-1-Skanda';
        const session3 = { sessionId: sessionId, role: "member", userId: userId3 };
        const socketId3 = '1-1~Skanda~1236'
        const advice3 = liveSessions.joinSession(session3, socketId3);

        expect(advice3.sessionId).toBe(sessionId);
        expect(advice3.reason).toBe("Ready");
        expect(advice3.status).toBe("ok");

        let members = new Map(JSON.parse(advice3.members));
        expect(members.get(userId2)).toBe(socketId2);
        expect(members.get(userId3)).toBe(socketId3);

        expect(liveSessions.isRunning(sessionId)).toBe(true);
        expect(liveSessions.count()).toBe(1);

        liveSessions.clear(sessionId);
    });

    it("Should return Err when invalid session details has been injected", () => {

        const advice1 = liveSessions.joinSession(null, null);
        expect(advice1.status).toBe("no");

        const advice3 = liveSessions.joinSession({}, "1-1~Gopal~1234");
        expect(advice3.status).toBe("no");

        const advice4 = liveSessions.joinSession({ role: "guide" }, "1-1~Gopal~1234");
        expect(advice4.status).toBe("no");

        const advice5 = liveSessions.joinSession({ role: "guide", sessionId: "1-1" }, "1-1~Gopal~1234");
        expect(advice5.status).toBe("no");

        expect(liveSessions.count()).toBe(0);
    });

    it("should clear memory, when a socket is disconnected", () => {

        const sessionId = 24;

        liveSessions.clear(sessionId);

        const userId1 = '1-1-Gopal';
        const sessionData1 = { sessionId: sessionId, role: "guide", userId: userId1 };
        const socketId1 = '1-1~Gopal~1234';
        liveSessions.joinSession(sessionData1, socketId1);

        const sessionData9 = { sessionId: sessionId, role: "guide", userId: userId1 };
        const socketId9 = '1-1~Gopal~1236';
        liveSessions.joinSession(sessionData9, socketId9);

        const userId2 = '1-1-Raja';
        const sessionData2 = { sessionId: sessionId, role: "member", userId: userId2 };
        const socketId2 = '1-1~Raja~1235'
        liveSessions.joinSession(sessionData2, socketId2);

        const sessionData3 = { sessionId: sessionId, role: "member", userId: userId2 };
        const socketId3 = '1-1~Raja~1236'
        liveSessions.joinSession(sessionData3, socketId3);

        expect(liveSessions.isRunning(sessionId)).toBe(true);
        expect(liveSessions.count()).toBe(1);

        liveSessions.disconnect(socketId9);

        expect(liveSessions.isRunning(sessionId)).toBe(false);
        expect(liveSessions.count()).toBe(0);

        liveSessions.clear(sessionId);
    });

    it("should be graceful, when disconnection without any join events", () => {
        expect(liveSessions.disconnect(null)).toBe(false);
        expect(liveSessions.disconnect("1-1~Raja~1235")).toBe(false);
    });

    it("should return a map of userId to socketId of a session, except the given userId. This map is the peer socket Id",() =>{

        const sessionId = 24;
        const anotherSessionId = 37;

        liveSessions.clear(sessionId);
        liveSessions.clear(anotherSessionId);

        const userId1 = '1-1-Gopal';
        const session1 = { sessionId: sessionId, role: "guide", userId: userId1 };
        const socketId1 = '1-1~Gopal~1234';
        liveSessions.joinSession(session1, socketId1);

        const userId2 = '1-1-Raja';
        const session2 = { sessionId: sessionId, role: "member", userId: userId2 };
        const socketId2 = '1-1~Raja~1235'
        liveSessions.joinSession(session2, socketId2);

        const userId3 = '1-1-Skanda';
        const session3 = { sessionId: sessionId, role: "member", userId: userId3 };
        const socketId3 = '1-1~Skanda~1236'
        liveSessions.joinSession(session3, socketId3);

        const userId4 = '7-7-Bootham';
        const session4 = { sessionId: anotherSessionId, role: "member", userId: userId4 };
        const socketId4 = '7-7~Bootham~1236'
        liveSessions.joinSession(session4, socketId4);

        const peerMap = liveSessions.getPeers(sessionId,userId2);

        expect(peerMap.get(userId1)).toBe(socketId1);
        expect(peerMap.get(userId3)).toBe(socketId3);
        expect(peerMap.has(userId2)).toBe(false);

        const anotherPeerMap = liveSessions.getPeers(session4,userId4);
        expect(peerMap.has(userId4)).toBe(false);

    });
});