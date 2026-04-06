import { classifyEffort, effortToScore, EffortLevel } from "@/lib/effort";

describe("classifyEffort", () => {
  describe("lazy inputs", () => {
    it("classifies very short messages as lazy", () => {
      expect(classifyEffort("hi")).toBe("lazy");
      expect(classifyEffort("yes")).toBe("lazy");
      expect(classifyEffort("")).toBe("lazy");
    });

    it("classifies bare commands as lazy", () => {
      expect(classifyEffort("solve this problem")).toBe("lazy");
      expect(classifyEffort("give me the answer")).toBe("lazy");
    });

    it("classifies homework dumps as lazy", () => {
      const longPaste =
        "A train leaves station A at 9am traveling at 60mph. Another train leaves station B at 10am traveling at 80mph. Station A and B are 300 miles apart. The first train stops for 15 minutes at a station 100 miles from A. Calculate when and where the trains meet, showing all working steps and intermediate calculations for full marks.";
      expect(classifyEffort(longPaste)).toBe("lazy");
    });
  });

  describe("trying inputs", () => {
    it("classifies messages with some reasoning as trying", () => {
      expect(classifyEffort("I think the answer might be 4")).toBe("trying");
    });

    it("classifies questions as trying (curiosity counts)", () => {
      expect(classifyEffort("what is 2+2")).toBe("trying");
      expect(classifyEffort("tell me the answer")).toBe("trying");
      expect(classifyEffort("help me with this")).toBe("trying");
    });

    it("classifies medium-length messages as trying", () => {
      expect(classifyEffort("I want to learn about dinosaurs")).toBe("trying");
    });
  });

  describe("thinking inputs", () => {
    it("classifies messages with multiple reasoning indicators as thinking", () => {
      expect(
        classifyEffort(
          "I think I need to find a common denominator because the fractions have different bases"
        )
      ).toBe("thinking");
    });
  });

  describe("breakthrough inputs", () => {
    it("classifies messages with rich reasoning as breakthrough", () => {
      expect(
        classifyEffort(
          "I think I need to find a common denominator because the fractions have different bases. What if I multiply 3 and 4?"
        )
      ).toBe("breakthrough");
    });

    it("classifies step-by-step reasoning as breakthrough", () => {
      expect(
        classifyEffort(
          "I tried step 1: convert to same denominator. I got 8/12 and 3/12. I think the answer is 11/12 because 8+3=11"
        )
      ).toBe("breakthrough");
    });

    it("classifies long thoughtful messages as breakthrough", () => {
      const thoughtful =
        "I think the problem is asking about velocity, because I know velocity is speed with direction. I tried using the formula v = d/t and I got 60, but I'm not sure if that's right because the problem mentions acceleration too. What if I need to use a different formula?";
      expect(classifyEffort(thoughtful)).toBe("breakthrough");
    });
  });

  describe("edge cases", () => {
    it("handles questions with context as breakthrough (multiple curiosity signals)", () => {
      expect(
        classifyEffort("Can you help me understand how photosynthesis works in plants?")
      ).toBe("breakthrough");
    });
  });
});

describe("effortToScore", () => {
  it("maps effort levels to numeric scores", () => {
    expect(effortToScore("lazy")).toBe(0);
    expect(effortToScore("trying")).toBe(1);
    expect(effortToScore("thinking")).toBe(2);
    expect(effortToScore("breakthrough")).toBe(3);
  });
});
