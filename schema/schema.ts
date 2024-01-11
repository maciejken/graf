import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLSchema,
  GraphQLList,
  GraphQLNonNull,
} from "npm:graphql";
import { Application, Company, Document, User } from "./types.ts";

const kv: Deno.Kv = await Deno.openKv();

const UserType: GraphQLObjectType = new GraphQLObjectType<User>({
  name: "User",
  fields: () => ({
    id: { type: GraphQLString },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    email: { type: GraphQLString },
    phone: { type: GraphQLString },
    documents: {
      type: new GraphQLList(DocumentType),
      async resolve({ id: userId }: User) {
        const allDocuments = kv.list<Document>({ prefix: ["documents"] });
        const userDocuments = [];
        for await (const { value } of allDocuments) {
          if (value.userId === userId) {
            userDocuments.push(value);
          }
        }
        return userDocuments;
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
      async resolve({ userId }: Document) {
        return (await kv.get(["users", userId])).value;
      },
    },
    content: { type: GraphQLString },
    contentType: { type: GraphQLString },
    applications: {
      type: new GraphQLList(ApplicationType),
      async resolve({ id: documentId }: Document) {
        const allApplications = kv.list<Application>({
          prefix: ["applications"],
        });
        const docApplications = [];
        for await (const { value } of allApplications) {
          if (value.documentId === documentId) {
            docApplications.push(value);
          }
        }
        return docApplications;
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
      async resolve({ documentId }: Application) {
        return (await kv.get(["documents", documentId])).value;
      },
    },
    company: {
      type: CompanyType,
      async resolve({ companyId }: Application) {
        return (await kv.get(["companies", companyId])).value;
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
      async resolve(_parentValue, args) {
        return (await kv.get(["users", args.id])).value;
      },
    },
    users: {
      type: new GraphQLList(UserType),
      async resolve() {
        const allUsersList = kv.list<User>({ prefix: ["users"] });
        const users: User[] = [];
        for await (const { value } of allUsersList) {
          users.push(value);
        }
        return users;
      },
    },
    company: {
      type: CompanyType,
      args: { id: { type: GraphQLString } },
      async resolve(_parentValue, args) {
        return (await kv.get(["companies", args.id])).value;
      },
    },
    document: {
      type: DocumentType,
      args: { id: { type: GraphQLString } },
      async resolve(_parentValue, args) {
        return (await kv.get(["documents", args.id])).value;
      },
    },
    application: {
      type: ApplicationType,
      args: { id: { type: GraphQLString } },
      async resolve(_parentValue, args) {
        return (await kv.get(["applications", args.id])).value;
      },
    },
  },
});

const mutation = new GraphQLObjectType({
  name: "RootMutationType",
  fields: {
    addUser: {
      type: UserType,
      args: {
        firstName: { type: new GraphQLNonNull(GraphQLString) },
        lastName: { type: new GraphQLNonNull(GraphQLString) },
        email: { type: new GraphQLNonNull(GraphQLString) },
        phone: { type: GraphQLString },
      },
      async resolve(_parentValue, { firstName, lastName, email, phone }) {
        const id = crypto.randomUUID();
        await kv.set(["users", id], {
          id,
          firstName,
          lastName,
          email,
          phone,
        });
        return (await kv.get(["users", id])).value;
      },
    },
    updateUser: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        firstName: { type: GraphQLString },
        lastName: { type: GraphQLString },
        email: { type: GraphQLString },
        phone: { type: GraphQLString },
      },
      async resolve(_parentValue, { id, firstName, lastName, email, phone }) {
        const user: User | null = (await kv.get<User>(["users", id])).value;
        const shouldUpdate = !!(firstName || lastName || email || phone);
        if (user && shouldUpdate) {
          await kv.set(["users", id], {
            id,
            firstName: firstName || user.firstName,
            lastName: lastName || user.lastName,
            email: email || user.email,
            phone: phone || user.phone,
          });
        }
        return (await kv.get(["users", id])).value;
      },
    },
    deleteUser: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve(_parentValue, { id }) {
        return kv.delete(["users", id]);
      },
    },
  },
});

export const schema = new GraphQLSchema({
  query,
  mutation,
});