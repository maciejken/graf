import {
  GraphQLBoolean,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from "npm:graphql";
import { Context } from "../types.ts";
import {
  getAllDocuments,
  getUserDocuments,
} from "../services/document/documentService.ts";
import {
  deleteUser,
  getAllUsers,
  getGroupUsers,
  getUserById,
  removeUserFromGroup,
  updateUser,
} from "../services/user/userService.ts";
import { Document } from "../services/document/types.ts";
import { getGroupDocuments } from "../services/document/documentService.ts";
import {
  addGroup,
  deleteGroup,
  getAllGroups,
  getUserGroups,
  updateGroup,
} from "../services/group/groupService.ts";
import { Group } from "../services/group/types.ts";
import { User } from "../services/user/types.ts";
import { addUserToGroup } from "../services/user/userService.ts";
import {
  resolveDocument,
  resolveDocumentPermissionsUpdate,
  resolveDocumentRemoval,
  resolveDocumentUpdate,
  resolveNewDocument,
  resolveUserDocuments,
} from "./resolvers.ts";

const PageInfoType = new GraphQLObjectType({
  name: "PageInfo",
  fields: {
    startCursor: { type: GraphQLString },
    endCursor: { type: GraphQLString },
    lastCursor: { type: GraphQLString },
    hasNextPage: { type: GraphQLBoolean },
    hasPreviousPage: { type: GraphQLBoolean },
  },
});

function createConnectionType(name: string, nodeType: GraphQLObjectType) {
  const edgeType = new GraphQLObjectType({
    name: name + "ConnectionEdge",
    fields: {
      node: {
        type: nodeType,
      },
      cursor: {
        type: GraphQLString,
      },
    },
  });

  const connectionType = new GraphQLObjectType({
    name: name + "Connection",
    fields: {
      edges: {
        type: new GraphQLList(edgeType),
      },
      pageInfo: {
        type: PageInfoType,
      },
    },
  });

  return [connectionType, edgeType];
}

const UserType: GraphQLObjectType = new GraphQLObjectType<User>({
  name: "User",
  fields: () => ({
    id: { type: GraphQLString },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    email: { type: GraphQLString },
    phone: { type: GraphQLString },
    groups: {
      type: new GraphQLList(GroupType),
      resolve({ id }: User) {
        return getUserGroups(id);
      },
    },
    documents: {
      type: new GraphQLList(DocumentType),
      resolve(user: User) {
        return getUserDocuments(user);
      },
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
    accessLevel: { type: GraphQLInt },
    createdAt: { type: GraphQLString },
    updatedAt: { type: GraphQLString },
  }),
});

const [DocumentsConnectionType, DocumentsConnectionEdgeType] =
  createConnectionType(
    "Documents",
    DocumentType,
  );

const ViewerType: GraphQLObjectType = new GraphQLObjectType({
  name: "Viewer",
  fields: () => ({
    id: { type: GraphQLString },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    email: { type: GraphQLString },
    phone: { type: GraphQLString },
    groups: {
      type: new GraphQLList(GroupType),
      resolve({ id }: User) {
        return getUserGroups(id);
      },
    },
    documents: {
      type: DocumentsConnectionType,
      args: {
        first: { type: GraphQLInt },
        after: { type: GraphQLString },
      },
      resolve: resolveUserDocuments,
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
      },
    },
    documents: {
      type: new GraphQLList(DocumentType),
      resolve(group: Group) {
        return getGroupDocuments(group);
      },
    },
  }),
});

const query = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    viewer: { type: ViewerType },
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
    document: {
      type: DocumentType,
      args: { id: { type: GraphQLString } },
      resolve: resolveDocument,
    },
    documents: {
      type: new GraphQLList(DocumentType),
      resolve() {
        return getAllDocuments();
      },
    },
  },
});

const PermissionType = new GraphQLInputObjectType({
  name: "Permission",
  fields: () => ({
    key: { type: GraphQLString },
    value: { type: GraphQLInt },
  }),
});

const DocumentMutationResponseWithEdgeType = new GraphQLObjectType({
  name: "DocumentMutationResponseWithEdge",
  fields: {
    viewer: { type: ViewerType },
    documentEdge: { type: DocumentsConnectionEdgeType },
  },
});

const DocumentMutationResponseType = new GraphQLObjectType({
  name: "DocumentMutationResponse",
  fields: {
    viewer: { type: ViewerType },
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
    addUserToGroup: {
      type: UserType,
      args: {
        userId: { type: new GraphQLNonNull(GraphQLString) },
        groupId: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve(_parentValue, { userId, groupId }, context: Context) {
        return addUserToGroup({
          userId,
          groupId,
          currentUserId: context.user.id,
        });
      },
    },
    removeUserFromGroup: {
      type: UserType,
      args: {
        userId: { type: new GraphQLNonNull(GraphQLString) },
        groupId: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve(_parentValue, { userId, groupId }, context: Context) {
        return removeUserFromGroup({
          userId,
          groupId,
          currentUserId: context.user.id,
        });
      },
    },
    deleteUser: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve(_parentValue, { id }: User) {
        return deleteUser(id);
      },
    },
    addGroup: {
      type: GroupType,
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve(_parentValue, { name }, context: Context) {
        return addGroup(name, context.user.id);
      },
    },
    updateGroup: {
      type: GroupType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        name: { type: GraphQLString },
        adminIds: { type: new GraphQLList(GraphQLString) },
      },
      resolve(_parentValue, args: Group, context: Context) {
        return updateGroup(args.id, {
          ...args,
          viewer: context.user,
        });
      },
    },
    deleteGroup: {
      type: GroupType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve(_parentValue, { id }: Group, context: Context) {
        return deleteGroup(id, context.user);
      },
    },
    addDocument: {
      type: DocumentMutationResponseWithEdgeType,
      args: {
        type: { type: new GraphQLNonNull(GraphQLString) },
        title: { type: GraphQLString },
        content: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: resolveNewDocument,
    },
    updateDocument: {
      type: DocumentMutationResponseWithEdgeType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        type: { type: GraphQLString },
        title: { type: GraphQLString },
        content: { type: GraphQLString },
      },
      resolve: resolveDocumentUpdate,
    },
    updateDocumentPermissions: {
      type: DocumentMutationResponseType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        permissions: {
          type: new GraphQLNonNull(new GraphQLList(PermissionType)),
        },
      },
      resolve: resolveDocumentPermissionsUpdate,
    },
    deleteDocument: {
      type: DocumentMutationResponseType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: resolveDocumentRemoval,
    },
  },
});

export const schema = new GraphQLSchema({
  query,
  mutation,
});
