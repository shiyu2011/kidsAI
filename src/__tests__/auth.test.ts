import { hashPassword, verifyPassword, createToken, verifyToken } from "@/lib/auth";

describe("auth", () => {
  describe("password hashing", () => {
    it("hashes a password and verifies it correctly", async () => {
      const password = "test-password-123";
      const hash = await hashPassword(password);

      expect(hash).not.toBe(password);
      expect(await verifyPassword(password, hash)).toBe(true);
    });

    it("rejects wrong password", async () => {
      const hash = await hashPassword("correct-password");
      expect(await verifyPassword("wrong-password", hash)).toBe(false);
    });

    it("produces different hashes for same password (salt)", async () => {
      const hash1 = await hashPassword("same-password");
      const hash2 = await hashPassword("same-password");
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("JWT tokens", () => {
    it("creates and verifies a token", async () => {
      const parentId = "test-parent-id-123";
      const token = await createToken(parentId);

      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);

      const payload = await verifyToken(token);
      expect(payload).not.toBeNull();
      expect(payload?.parentId).toBe(parentId);
    });

    it("returns null for invalid token", async () => {
      const payload = await verifyToken("invalid-token");
      expect(payload).toBeNull();
    });

    it("returns null for empty token", async () => {
      const payload = await verifyToken("");
      expect(payload).toBeNull();
    });
  });
});
