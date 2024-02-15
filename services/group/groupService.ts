import { groupsPrefix } from "../../constants.ts";
import { Group } from "./types.ts";
import { getDatabase } from "../dbService.ts";

const db = getDatabase();

export async function getAllGroups(): Promise<Group[]> {
  const entries = db.list<Group>({ prefix: [groupsPrefix] });
  const groups: Group[] = [];
  for await (const { value } of entries) {
    groups.push(value);
  }
  return groups;
}

export async function getGroupById(id: string): Promise<Group | null> {
  return (await db.get<Group>([groupsPrefix, id])).value;
}

export async function getGroupByName(name: string): Promise<Group | null> {
  const entries = db.list<Group>({ prefix: [groupsPrefix] });
  let group: Group | null = null;
  for await (const { value } of entries) {
    if (value.name === name) {
      group = value;
      break;
    }
  }
  return group;
}

export async function addGroup(
  name: string,
  userId: string,
): Promise<Group | null> {
  const groupId = crypto.randomUUID();

  await db.set([groupsPrefix, groupId], {
    id: groupId,
    name,
    adminIds: [userId],
    createdAt: new Date().toISOString(),
  });

  return getGroupById(groupId);
}

export async function updateGroup(
  id: string,
  { name, adminIds }: Group
): Promise<Group | null> {
  let group: Group | null = await getGroupById(id);

  if (group) {
    await db.set([groupsPrefix, id], {
      id,
      name: name || group.name,
      adminIds: adminIds || group.adminIds,
      createdAt: group.createdAt,
      updatedAt: new Date().toISOString(),
    });
    
    group = await getGroupById(id);
  }

  return group;
}

export async function deleteGroup(id: string): Promise<Group | null> {
  const group: Group | null = await getGroupById(id);

  if (group) {
    await db.delete([groupsPrefix, id]);
  }

  return group ? getGroupById(id) : null;
}
