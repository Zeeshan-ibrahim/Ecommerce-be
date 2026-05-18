"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugify = slugify;
exports.resolveUniqueSlug = resolveUniqueSlug;
function slugify(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
function resolveUniqueSlug(base, existingSlugs) {
    var taken = new Set(existingSlugs);
    if (!taken.has(base)) {
        return base;
    }
    var counter = 1;
    while (taken.has("".concat(base, "-").concat(counter))) {
        counter += 1;
    }
    return "".concat(base, "-").concat(counter);
}
