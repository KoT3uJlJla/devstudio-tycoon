import "./trustAccess.js";
import "./trustedRatings.js";
import "./trustedSave.js";
import "./referrals.js";

// Compatibility shim: trust model, server-owned saves, trusted releases,
// trusted ratings, roles, and maintenance access are now implemented in
// clean modules and wired from index.js. This file intentionally performs
// no runtime file patching.
