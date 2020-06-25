import 'regenerator-runtime/runtime';

var users = require("./users");

describe("Maintain the List of connected socket ids", () => {

    beforeEach(()=>{
        users.init();
    });

    it("should emit a RandomID on create ", async () => {
        const mockSocket = { socket: 1 };
        const fuzzyId = '9-9';
        const name = 'raja';
        const id = await users.create(mockSocket, { fuzzyId: fuzzyId, name: name });

        expect(id).toBeDefined();
    });

    it("should emit a random id with the fuzzy_id and name as its first and second segment", async () => {
        const mockSocket = { socket: 1 };
        const fuzzyId = '9-9';
        const name = 'raja';
        const id = await users.create(mockSocket, { fuzzyId: fuzzyId, name: name });

        expect(id.split('~')[0]).toBe(fuzzyId);
        expect(id.split('~')[1]).toBe(name);
    });

    it("should return the socket connection with the given id", async ()=>{
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

    it("should return undefined when no fuzzyId; either" , () => {
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

    it("should remove the id from the connections and tokens", async()=>{

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

    it("should gracefull when the fuzzyeId is corrupted", async() => {

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

    it("should return Yes when pinging with a connected fuyzzId and No when pinging with an unknown", async ()=>{

        const fuzzyId1 = '9-9';
        const name1 = "raja";
        const mockSocket1 = { socket: 1 };
        
        const id1 = await users.create(mockSocket1, { fuzzyId: fuzzyId1, name: name1 });

        expect(users.ping(fuzzyId1)).toBe("ok");
        users.remove(id1);
        expect(users.ping(fuzzyId1)).toBe("no");
        expect(users.ping(null)).toBe("no");
    })

});