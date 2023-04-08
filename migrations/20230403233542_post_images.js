/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable("post_images", (table) => {
        table.uuid("id").primary();
        table.string("image").notNullable();
        table.string("title");
        table.string("description");
        table.decimal("latitude", 9, 6);
        table.decimal("longitude", 9, 6);
        table
            .string("post_id")
            .notNullable()
            .references("id")
            .inTable("posts")
            .onUpdate("CASCADE")
            .onDelete("CASCADE");
        table.timestamps(true, true);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTable("post_images");
};
