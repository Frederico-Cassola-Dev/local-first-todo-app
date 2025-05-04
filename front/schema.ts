import { createSchema, table, string, boolean, number } from "@rocicorp/zero";
import { ANYONE_CAN_DO_ANYTHING, definePermissions } from "@rocicorp/zero";

const todo = table("todo")
  .columns({
    id: string(),
    task: string(),
    isCompleted: boolean().from("is_completed"),
    createdAt: number().from("created_at"),
  })
  .primaryKey("id");

export const schema = createSchema({
  tables: [todo],
});

export const permissions = definePermissions<unknown, Schema>(schema, () => ({
  todo: ANYONE_CAN_DO_ANYTHING,
}));

export type Schema = typeof schema;
