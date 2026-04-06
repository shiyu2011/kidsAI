import { buildSystemPrompt } from "@/lib/system-prompt";

describe("buildSystemPrompt", () => {
  it("includes the effort level tag", () => {
    const prompt = buildSystemPrompt("lazy", 1);
    expect(prompt).toContain("[lazy]");
  });

  it("includes the turn count", () => {
    const prompt = buildSystemPrompt("trying", 5);
    expect(prompt).toContain("turn 5");
  });

  it("includes lazy handling instructions for lazy effort", () => {
    const prompt = buildSystemPrompt("lazy", 1);
    expect(prompt).toContain('If effort is "lazy"');
    expect(prompt).toContain("intriguing teaser");
  });

  it("includes thinking handling for thinking effort", () => {
    const prompt = buildSystemPrompt("thinking", 3);
    expect(prompt).toContain('If effort is "thinking"');
    expect(prompt).toContain("REWARD them with knowledge");
  });

  it("includes breakthrough handling", () => {
    const prompt = buildSystemPrompt("breakthrough", 4);
    expect(prompt).toContain('If effort is "breakthrough"');
    expect(prompt).toContain("Celebrate BIG");
  });

  it("includes transformation reflection after 5 turns", () => {
    const prompt = buildSystemPrompt("trying", 6);
    expect(prompt).toContain("brain leveling up");
  });

  it("does not include transformation reflection before 5 turns", () => {
    const prompt = buildSystemPrompt("trying", 3);
    expect(prompt).not.toContain("brain leveling up");
  });

  it("includes safety rules", () => {
    const prompt = buildSystemPrompt("lazy", 1);
    expect(prompt).toContain("inappropriate");
    expect(prompt).toContain("redirect");
    expect(prompt).toContain("self-harm");
    expect(prompt).toContain("parent, teacher, or trusted adult");
  });

  it("rewards thinking with cool knowledge instead of just questioning", () => {
    const prompt = buildSystemPrompt("lazy", 1);
    expect(prompt).toContain("reward thinking with awesome knowledge");
    expect(prompt).toContain("golden ratio");
  });

  it("includes personality guidelines", () => {
    const prompt = buildSystemPrompt("lazy", 1);
    expect(prompt).toContain("Enthusiastic, curious");
    expect(prompt).toContain("9-year-old");
  });
});
