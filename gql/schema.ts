import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLSchema,
  GraphQLList,
  GraphQLNonNull,
} from "npm:graphql";
import { Application, Company, Document, UserData } from "../types.ts";
import { getDatabase } from "../services/dbService.ts";
import {
  getDocumentById,
  getDocumentsByUserId,
} from "../services/document/documentService.ts";
import { getApplicationsByDocumentId } from "../services/application/applicationService.ts";
import {
  deleteUser,
  getAllUsers,
  getUserById,
  updateUser,
} from "../services/user/userService.ts";
import { getCompanyById } from "../services/company/companyService.ts";

const db = getDatabase();

const UserType: GraphQLObjectType = new GraphQLObjectType<UserData>({
  name: "User",
  fields: () => ({
    id: { type: GraphQLString },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    email: { type: GraphQLString },
    phone: { type: GraphQLString },
    documents: {
      type: new GraphQLList(DocumentType),
      resolve({ id: userId }: UserData) {
        return getDocumentsByUserId(userId);
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
    content: { type: GraphQLString },
    contentType: { type: GraphQLString },
    applications: {
      type: new GraphQLList(ApplicationType),
      resolve({ id: documentId }: Document) {
        return getApplicationsByDocumentId(documentId);
      },
    },
  }),
});

const CompanyType = new GraphQLObjectType<Company>({
  name: "Company",
  fields: {
    id: { type: GraphQLString },
    name: { type: GraphQLString },
    email: { type: GraphQLString },
    phone: { type: GraphQLString },
    address: { type: GraphQLString },
    description: { type: GraphQLString },
  },
});

const ApplicationType: GraphQLObjectType = new GraphQLObjectType<Application>({
  name: "Application",
  fields: () => ({
    id: { type: GraphQLString },
    date: { type: GraphQLString },
    position: { type: GraphQLString },
    document: {
      type: DocumentType,
      resolve({ documentId }: Application) {
        return getDocumentById(documentId);
      },
    },
    company: {
      type: CompanyType,
      resolve({ companyId }: Application) {
        return getCompanyById(companyId);
      },
    },
    description: { type: GraphQLString },
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
    company: {
      type: CompanyType,
      args: { id: { type: GraphQLString } },
      async resolve(_parentValue, args) {
        return (await db.get(["companies", args.id])).value;
      },
    },
    document: {
      type: DocumentType,
      args: { id: { type: GraphQLString } },
      async resolve(_parentValue, args) {
        return (await db.get(["documents", args.id])).value;
      },
    },
    application: {
      type: ApplicationType,
      args: { id: { type: GraphQLString } },
      async resolve(_parentValue, args) {
        return (await db.get(["applications", args.id])).value;
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
  },
});

export const schema = new GraphQLSchema({
  query,
  mutation,
});
