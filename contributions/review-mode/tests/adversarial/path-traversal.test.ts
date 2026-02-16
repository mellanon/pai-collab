import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import path from "node:path";
import {
  createTypedReference,
  verifyTypedReference,
} from "../../src/lib/typed-reference.js";
import { generateHMACKey } from "../../src/lib/hmac-ops.js";
import type { AgentMetadata } from "../../src/lib/types.js";

function makeQuarantineMetadata(overrides?: Partial<AgentMetadata>): AgentMetadata {
  return {
    agentId: `quarantine-${crypto.randomUUID()}`,
    sessionId: crypto.randomUUID(),
    isQuarantine: true,
    hmacKey: generateHMACKey(),
    ...overrides,
  };
}

describe("AS-004: Path Traversal", () => {
  it("should canonicalize absolute path traversal attempts", () => {
    const metadata = makeQuarantineMetadata();
    
    const ref = createTypedReference("../../../etc/passwd", metadata.sessionId, metadata.hmacKey!);

    // Path should be canonicalized by path.resolve
    const resolvedPath = path.resolve("../../../etc/passwd");
    expect(ref.path).toBe(resolvedPath);
    
    // Verification should work with canonicalized path
    const result = verifyTypedReference(ref, metadata.sessionId, metadata.hmacKey!);
    expect(result.valid).toBe(true);
  });

  it("should canonicalize relative path traversal with ./", () => {
    const metadata = makeQuarantineMetadata();
    
    const ref = createTypedReference("./../../etc/shadow", metadata.sessionId, metadata.hmacKey!);

    const resolvedPath = path.resolve("./../../etc/shadow");
    expect(ref.path).toBe(resolvedPath);
  });

  it("should canonicalize mixed path traversal", () => {
    const metadata = makeQuarantineMetadata();
    
    const ref = createTypedReference("/src/../../../etc/passwd", metadata.sessionId, metadata.hmacKey!);

    // path.resolve canonicalizes this
    const resolvedPath = path.resolve("/src/../../../etc/passwd");
    expect(ref.path).toBe(resolvedPath);
    expect(ref.path).not.toContain("..");
  });

  it("should resolve home directory paths", () => {
    const metadata = makeQuarantineMetadata();
    
    const ref = createTypedReference("~/.ssh/id_rsa", metadata.sessionId, metadata.hmacKey!);

    // path.resolve treats ~ literally, doesn't expand to home dir
    const resolvedPath = path.resolve("~/.ssh/id_rsa");
    expect(ref.path).toBe(resolvedPath);
  });

  it("should canonicalize redundant separators", () => {
    const metadata = makeQuarantineMetadata();
    
    const ref = createTypedReference("/src///file.ts", metadata.sessionId, metadata.hmacKey!);

    expect(ref.path).toBe(path.resolve("/src///file.ts"));
    expect(ref.path).not.toContain("///");
  });

  it("should canonicalize current directory references", () => {
    const metadata = makeQuarantineMetadata();
    
    const ref = createTypedReference("/src/./file.ts", metadata.sessionId, metadata.hmacKey!);

    const resolvedPath = path.resolve("/src/./file.ts");
    expect(ref.path).toBe(resolvedPath);
    expect(ref.path).not.toContain("/./");
  });

  it("should handle complex traversal chains", () => {
    const metadata = makeQuarantineMetadata();
    
    const ref = createTypedReference("/a/b/../c/../../d/e/../f.txt", metadata.sessionId, metadata.hmacKey!);

    const resolvedPath = path.resolve("/a/b/../c/../../d/e/../f.txt");
    expect(ref.path).toBe(resolvedPath);
    expect(ref.path).not.toContain("..");
  });

  it("should verify canonicalized paths correctly", () => {
    const metadata = makeQuarantineMetadata();
    
    // Create reference with traversal
    const ref = createTypedReference("../../../src/file.ts", metadata.sessionId, metadata.hmacKey!);
    
    // Verification should work because HMAC is computed on canonicalized path
    const result = verifyTypedReference(ref, metadata.sessionId, metadata.hmacKey!);
    expect(result.valid).toBe(true);
  });
});
