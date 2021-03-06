/**
 * Run npm test -- --coverage
 */
import 'regenerator-runtime/runtime';

const users = require("./users");

describe("Maintain the List of connected socket ids", () => {

    beforeEach(() => {
        users.clear();
    });

    it("should emit a RandomID on create ", async () => {
        const mockSocket = { socket: 1 };
        const fuzzyId = '9-9';
        const name = 'raja';
        const id = await users.create(mockSocket, { fuzzyId: fuzzyId, name: name });

        expect(id).toBeDefined();
    });

    it("should emit a RandomId with fuzzy_id and name as its first and second segment", async () => {
        const mockSocket = { socket: 1 };
        const fuzzyId = '9-9';
        const name = 'raja';
        const id = await users.create(mockSocket, { fuzzyId: fuzzyId, name: name });

        expect(id.split('~')[0]).toBe(fuzzyId);
        expect(id.split('~')[1]).toBe(name);
    });

    it("should return the socket connection with the given id", async () => {
        const fuzzyId1 = '9-9';
        const name1 = "raja";
        const mockSocket1 = { socket: 1 };
        const mockSocket2 = { socket: 2 };

        const id1 = await users.create(mockSocket1, { fuzzyId: fuzzyId1, name: name1 });
        const id2 = await users.create(mockSocket2, { fuzzyId: fuzzyId1, name: name1 });


        const fuzzyId2 = '1-1';
        const name2 = "gopal";
        const mockSocket3 = { socket: 3 };
        const mockSocket4 = { socket: 4 };

        const id3 = await users.create(mockSocket3, { fuzzyId: fuzzyId2, name: name2 });
        const id4 = await users.create(mockSocket4, { fuzzyId: fuzzyId2, name: name2 });

        const connection = users.get(id2);

        expect(connection.socket).toBe(2);
    })

    it("should return undefined when no fuzzyId; either", () => {
        expect(users.get(null)).toBeUndefined();
    })

    it("should allow to maintain multiple socket ids for the same fuzzy_ids", async () => {
        const fuzzyId = '9-9';
        const name = "raja";

        const mockSocket1 = { socket: 1 };
        const mockSocket2 = { socket: 2 };

        const id1 = await users.create(mockSocket1, { fuzzyId: fuzzyId, name: name });
        const id2 = await users.create(mockSocket2, { fuzzyId: fuzzyId, name: name });

        const tokens = users.getTokens(fuzzyId);

        expect(tokens.size).toBe(2);
    });

    it("should remove the id from the connections and tokens", async () => {

        const fuzzyId1 = '9-9';
        const name1 = "raja";
        const mockSocket1 = { socket: 1 };
        const mockSocket2 = { socket: 2 };

        const id1 = await users.create(mockSocket1, { fuzzyId: fuzzyId1, name: name1 });
        const id2 = await users.create(mockSocket2, { fuzzyId: fuzzyId1, name: name1 });

        expect(users.get(id2)).toBeDefined();
        expect(users.getTokens(fuzzyId1).size).toBe(2);

        users.remove(id2);

        expect(users.get(id2)).toBeUndefined();
        expect(users.getTokens(fuzzyId1).size).toBe(1);
    })

    it("should be gracefull when the fuzzyId is corrupted", async () => {

        const fuzzyId1 = '9-9';
        const name1 = "raja";
        const mockSocket1 = { socket: 1 };

        const id1 = await users.create(mockSocket1, { fuzzyId: fuzzyId1, name: name1 });

        // Removing null fuzzyId
        users.remove(null);

        // Removing fuzzyid without ~
        users.remove("x");

        // Removing multiple times
        users.remove(id1);
        users.remove(id1);
        users.remove(id1);
    })

    it("should return Yes when pinging with a connected fuyzzId and No or Error when pinging with an unknown", async () => {

        const fuzzyId1 = '9-9';
        const name1 = "raja";
        const mockSocket1 = { socket: 1 };

        const id1 = await users.create(mockSocket1, { fuzzyId: fuzzyId1, name: name1 });

        const pingData = {fuzzyId:fuzzyId1};
        const answer = users.ping(pingData);
        expect(answer.fuzzyId).toBe(fuzzyId1);
        expect(answer.ans).toBe("ok");
        
        users.remove(id1);

        expect(users.ping(fuzzyId1).ans).toBe("no");
   

        expect(users.ping(null).ans).toBe("ERROR");
    })

    it("Should return the matching sockets of a user identifed by its fuzzyId", async() => {

        // Built two sockets for Raja
        const fuzzyId = '9-9';
        const name = "raja";

        const mockSocket1 = { socket: 1 };
        const mockSocket2 = { socket: 2 };
        const mockSocketX = { socket: 3 };

        const id1 = await users.create(mockSocket1, { fuzzyId: fuzzyId, name: name });
        const id2 = await users.create(mockSocket2, { fuzzyId: fuzzyId, name: name });
        const idX = await users.create(mockSocketX, { fuzzyId: fuzzyId, name: name });

        // Build two sockets for Gopal
        const fuzzyId2 = '1-1';
        const name2 = "gopal";
        const mockSocket3 = { socket: 3 };
        const mockSocket4 = { socket: 4 };

        const id3 = await users.create(mockSocket3, { fuzzyId: fuzzyId2, name: name2 });
        const id4 = await users.create(mockSocket4, { fuzzyId: fuzzyId2, name: name2 });

        // Check if raja's fuzzyId yield three sockets
        const rajaSockets = users.getSockets(fuzzyId);
        expect(rajaSockets.size).toBe(3);

        // Testing Unknown user fuzzyId
        const unknownUserSockets = users.getSockets('x-x');
        expect(unknownUserSockets.size).toBe(0);

        // Test to handle undefined userId
        expect(users.getSockets().size).toBe(0);

        // Now Check if Gopals's fuzzyId yield two sockets
        const gopalSockets = users.getSockets(fuzzyId2);
        expect(gopalSockets.size).toBe(2);
    })

});