/**
 * We are maintaining more than one socket connection for a user 
 * identified by the fuzzyId.
 * 
 */

const liveSessions = require("./liveSessions.js");

describe("Offering advice about a given session", () => {

    it("Should return No when a session has single role", ()=> {

        liveSessions.clear(25);
        liveSessions.clear(26);

        const session25 = { sessionId: 25, role: "guide" };
        const socketId1 = '1-1~Gopal~25';
        const advice1 = liveSessions.joinSession(session25, socketId1);
        expect(advice1.reason).toBe("Awaiting Member");
        expect(advice1.status).toBe("no");

        const session26 = { sessionId: 26, role: "member" };
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

        const session1 = { sessionId: sessionId, role: "guide" };
        const socketId1 = '1-1~Gopal~1234';
        const advice1 = liveSessions.joinSession(session1, socketId1);

        const session2 = { sessionId: sessionId, role: "member" };
        const socketId2 = '1-1~Raja~1235'
        const advice2 = liveSessions.joinSession(session2, socketId2);
        
        expect(advice2.sessionId).toBe(sessionId);
        expect(advice2.reason).toBe("Ready");
        expect(advice2.status).toBe("ok");

        expect(liveSessions.isRunning(sessionId)).toBe(true);
        expect(liveSessions.count()).toBe(1);

        liveSessions.clear(sessionId);
    });

    it("Should return Err when invalid session details has been injected", ()=> {

        const advice1 = liveSessions.joinSession(null, null);
        expect(advice1.status).toBe("no");

        const advice3 = liveSessions.joinSession({}, "1-1~Gopal~1234");
        expect(advice3.status).toBe("no");

        const advice4 = liveSessions.joinSession({ role: "guide" }, "1-1~Gopal~1234");
        expect(advice4.status).toBe("no");

        expect(liveSessions.count()).toBe(0);
    });
    
    it("should clear memory, when a socket is disconnected", () => {

        const sessionId = 24;

        liveSessions.clear(sessionId);

        const sessionData1 = { sessionId: sessionId, role: "guide" };
        const socketId1 = '1-1~Gopal~1234';
        liveSessions.joinSession(sessionData1, socketId1);

        const sessionData9 = { sessionId: sessionId, role: "guide" };
        const socketId9 = '1-1~Gopal~1236';
        liveSessions.joinSession(sessionData9, socketId9);

        const sessionData2 = { sessionId: sessionId, role: "member" };
        const socketId2 = '1-1~Raja~1235'
        liveSessions.joinSession(sessionData2, socketId2);
        
        const sessionData3 = { sessionId: sessionId, role: "member" };
        const socketId3 = '1-1~Raja~1236'
        liveSessions.joinSession(sessionData3, socketId3);

        expect(liveSessions.isRunning(sessionId)).toBe(true);
        expect(liveSessions.count()).toBe(1);

        liveSessions.disconnect(socketId9);

        expect(liveSessions.isRunning(sessionId)).toBe(false);
        expect(liveSessions.count()).toBe(0);

        liveSessions.clear(sessionId);
    });

    it("should be graceful, when disconnection without any join events", ()=>{
        expect(liveSessions.disconnect(null)).toBe(false);
        expect(liveSessions.disconnect("1-1~Raja~1235")).toBe(false);
    })
});