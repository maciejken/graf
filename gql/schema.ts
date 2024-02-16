import {
  GraphQLObjectType,
  GraphQLEnumType,
  GraphQLString,
  GraphQLSchema,
  GraphQLList,
  GraphQLNonNull,
} from "npm:graphql";
import { Context } from "../types.ts";
import { getAllDocuments, getUserDocuments } from "../services/document/documentService.ts";
import {
  deleteUser,
  getAllUsers,
  getGroupUsers,
  getUserById,
  updateUser,
} from "../services/user/userService.ts";
import { Document, NewDocument, AccessLevel } from "../services/document/types.ts";
import { addDocument, updateDocument, updateDocumentPermissions, deleteDocument } from '../services/document/documentService.ts';
import { addGroup, getAllGroups, getUserGroups } from "../services/group/groupService.ts";
import { Group } from "../services/group/types.ts";
import { UserData } from "../services/user/types.ts";

const UserType: GraphQLObjectType = new GraphQLObjectType<UserData>({
  name: "User",
  fields: () => ({
    id: { type: GraphQLString },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    email: { type: GraphQLString },
    phone: { type: GraphQLString },
    groups: {
      type: new GraphQLList(GroupType),
      resolve({ id, groupIds }: UserData) {
        return getUserGroups(id, groupIds);
      }
    },
    documents: {
      type: new GraphQLList(DocumentType),
      resolve({ id, groupIds }: UserData) {
        return getUserDocuments(id, groupIds);
      },
    },
  }),
});

const GroupType: GraphQLObjectType = new GraphQLObjectType<Group>({
  name: "Group",
  fields: () => ({
    id: { type: GraphQLString },
    name: { type: GraphQLString },
    adminIds: { type: new GraphQLList(GraphQLString) },
    users: {
      type: new GraphQLList(UserType),
      resolve({ id, adminIds }: Group) {
        return getGroupUsers(id, adminIds);
      }
    },
  }),
});

const DocumentType: GraphQLObjectType = new GraphQLObjectType<Document>({
  name: "Document",
  fields: () => ({
    id: { type: GraphQLString },
    user: {
      type: UserType,
      resolve({ userId }: Document) {
        return getUserById(userId);
      },
    },
    type: { type: GraphQLString },
    title: { type: GraphQLString },
    content: { type: GraphQLString },
  }),
});

const query = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    user: {
      type: UserType,
      args: { id: { type: GraphQLString } },
      resolve(_parentValue, args) {
        return getUserById(args.id);
      },
    },
    users: {
      type: new GraphQLList(UserType),
      resolve() {
        return getAllUsers();
      },
    },
    groups: {
      type: new GraphQLList(GroupType),
      resolve() {
        return getAllGroups();
      },
    },
    documents: {
      type: new GraphQLList(DocumentType),
      resolve() {
        return getAllDocuments();
      },
    },
  },
});

const mutation = new GraphQLObjectType({
  name: "RootMutationType",
  fields: {
    updateUser: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        firstName: { type: GraphQLString },
        lastName: { type: GraphQLString },
        email: { type: GraphQLString },
        phone: { type: GraphQLString },
        password: { type: GraphQLString },
      },
      resolve(_parentValue, args) {
        return updateUser(args.id, args);
      },
    },
    deleteUser: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve(_parentValue, { id }: UserData) {
        return deleteUser(id);
      },
    },
    addGroup: {
      type: GroupType,
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) }
      },
      resolve(_parentValue, { name }, context: Context) {
        return addGroup(name, context.user.id);
      }
    },
    addDocument: {
      type: DocumentType,
      args: {
        type: { type: new GraphQLNonNull(GraphQLString) },
        title: { type: GraphQLString },
        content: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve(_parentValue, { type, title, content }: NewDocument, context: Context) {
        return addDocument({
          type,
          title,
          content,
          userId: context.user.id,
        });
      }
    },
    updateDocument: {
      type: DocumentType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        type: { type: GraphQLString },
        title: { type: GraphQLString },
        content: { type: GraphQLString },
      },
      resolve(_parentValue, args) {
        return updateDocument(args.id, args);
      }
    },
    updateDocumentPermissions: {
      type: DocumentType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        subjectId: { type: new GraphQLNonNull(GraphQLString) },
        accessLevel: {
          type: new GraphQLNonNull(new GraphQLEnumType({
            name: 'AccessLevel',
            values: {
              NONE: { value: AccessLevel.None },
              VIEW: { value: AccessLevel.View },
              UPDATE: { value: AccessLevel.Update },
              MANAGE: { value: AccessLevel.Manage },
            }
          }
        ))},
      },
      resolve(_parentValue, { id, subjectId, accessLevel }) {
        return updateDocumentPermissions(id, { [subjectId]: accessLevel });
      }
    },
    deleteDocument: {
      type: DocumentType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve(_parentValue, { id }: UserData) {
        return deleteDocument(id);
      },
    },
  },
});

export const schema = new GraphQLSchema({
  query,
  mutation,
});
