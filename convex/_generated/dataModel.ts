// This file is a stub. Run `npx convex dev` to generate the real version.
// It will be overwritten automatically on first deploy.
/* eslint-disable */
// @ts-nocheck

export type Id<TableName extends string = string> = string & {
  __tableName: TableName;
};

export type Doc<TableName extends string = string> = {
  _id: Id<TableName>;
  _creationTime: number;
  [key: string]: unknown;
};
