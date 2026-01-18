const request = require("supertest");
const app = require("../app");

describe("API Endpoints", () => {
  let token;
  let userId;

  describe("Auth Endpoints", () => {
    it("should register a new user", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "password123",
      });
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty("message", "User created");
    });

    it("should login the user", async () => {
      const res = await request(app).post("/api/auth/login").send({
        username: "testuser",
        password: "password123",
      });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("token");
      token = res.body.token;
      userId = res.body.user.id;
    });

    it("should return 401 for invalid credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({
        username: "testuser",
        password: "wrongpassword",
      });
      expect(res.statusCode).toEqual(400);
    });
  });

  describe("Expense Endpoints", () => {
    it("should create a new expense", async () => {
      const res = await request(app)
        .post("/api/expenses")
        .set("Authorization", `Bearer ${token}`)
        .send({
          amount: 100,
          date: new Date().toISOString(),
          vendor: "Test Vendor",
          category: "Test Category",
        });
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty("amount", 100);
    });

    it("should get expenses", async () => {
      const res = await request(app)
        .get("/api/expenses")
        .set("Authorization", `Bearer ${token}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("should fail to get expenses without token", async () => {
      const res = await request(app).get("/api/expenses");
      expect(res.statusCode).toEqual(401);
    });
  });
});
