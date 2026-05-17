import { createHash } from "node:crypto";

/**
 * Generates a weak ETag from any serializable data.
 *
 * Weak ETags (W/"...") mean: "semantically equivalent", not byte-for-byte identical.
 * That's the right choice for API responses — we care if the data changed,
 * not if whitespace or key ordering shifted.
 */
const generateETag = (data: unknown): string => {
	const hash = createHash("sha1")
		.update(JSON.stringify(data))
		.digest("hex")
		.slice(0, 16); // 16 hex chars is plenty for a fingerprint

	return `W/"${hash}"`;
};

export default generateETag;
