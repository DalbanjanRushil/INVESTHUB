import { NextAuthOptions, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectToDatabase from "@/lib/db";
import User, { IUser, UserRole, UserStatus } from "@/models/User";
import Wallet from "@/models/Wallet"; // Import Wallet to create one on sign up
import bcrypt from "bcryptjs";

// Extend built-in types to include our custom fields
declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: UserRole;
            status: UserStatus;
        } & DefaultSession["user"];
    }

    interface User {
        id: string;
        role: UserRole;
        status: UserStatus;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: UserRole;
        status: UserStatus;
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Invalid credentials");
                }

                await connectToDatabase();

                // 1. Check if user exists (Select password because strictly excluded in schema)
                const user = await User.findOne({ email: credentials.email }).select(
                    "+password"
                );

                if (!user) {
                    throw new Error("No user found with this email");
                }

                // 2. Check Password
                const isValid = await bcrypt.compare(
                    credentials.password,
                    user.password!
                );

                if (!isValid) {
                    throw new Error("Invalid password");
                }

                // 3. Check Status
                if (user.status === UserStatus.BLOCKED) {
                    throw new Error("Account is blocked. Contact support.");
                }

                // 4. Return User Data (Excluded password)
                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    status: user.status,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.status = user.status;
            }

            // Allow updating session from client component (e.g. after updating profile)
            if (trigger === "update" && session) {
                token.name = session.name;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.role = token.role;
                session.user.status = token.status;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
        error: "/login", // Redirect back to login on error
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 Days
    },
    secret: process.env.NEXTAUTH_SECRET,
};
