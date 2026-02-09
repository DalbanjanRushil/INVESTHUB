import { NextAuthOptions, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
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
                    throw new Error("Access Denied: Your account has been suspended by the Administrator.");
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
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === "google") {
                if (!user.email) return false; // Ensure email exists

                await connectToDatabase();
                try {
                    const existingUser = await User.findOne({ email: user.email });

                    if (existingUser) {
                        if (existingUser.status === UserStatus.BLOCKED) {
                            return false; // Access Denied
                        }
                        return true;
                    }

                    // Create New User Logic (Similar to Register API)
                    const userCount = await User.countDocuments();
                    const role = userCount === 0 ? UserRole.ADMIN : UserRole.USER;

                    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                    const referralCode = `INVEST-HUB-${randomSuffix}`;

                    const newUser = await User.create({
                        name: user.name || user.email.split("@")[0], // Fallback name
                        email: user.email,
                        role: role,
                        referralCode: referralCode,
                        status: UserStatus.ACTIVE,
                        kycStatus: "NOT_SUBMITTED",
                    });

                    // Create Wallet
                    await Wallet.create({
                        userId: newUser._id,
                        balance: 0,
                        totalDeposited: 0,
                        totalWithdrawn: 0,
                        totalProfit: 0,
                    });

                    // Send Welcome Email
                    const { sendEmail } = await import("@/lib/email");
                    await sendEmail({
                        to: user.email,
                        subject: "Welcome to InvestHub! 🚀",
                        html: `
                            <div style="font-family: Arial, sans-serif; color: #333;">
                                <h1>Welcome, ${user.name || "Investor"}!</h1>
                                <p>You have successfully logged in with Google on InvestHub.</p>
                                <p>Your referral code is: <strong>${referralCode}</strong></p>
                                <p>Start investing today.</p>
                                <br>
                                <p>Best,<br>InvestHub Team</p>
                            </div>
                        `
                    }).catch(err => console.error("Failed to send welcome email:", err));

                    return true;
                } catch (error) {
                    console.error("Google Signin Error:", error);
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user, account, trigger, session }) {
            // Initial Sign In
            if (user) {
                // If it's a Google Login, we need to fetch the real User ID and Role from DB
                if (account?.provider === "google") {
                    if (user.email) {
                        await connectToDatabase();
                        const dbUser = await User.findOne({ email: user.email });
                        if (dbUser) {
                            token.id = dbUser._id.toString();
                            token.role = dbUser.role;
                            token.status = dbUser.status;
                        }
                    }
                } else {
                    // Credentials login (user object already has our shape)
                    token.id = user.id;
                    token.role = user.role;
                    token.status = user.status;
                }
            }

            // Allow updating session from client component (e.g. after updating profile)
            if (trigger === "update" && session) {
                token.name = session.name;
            }
            return token;
        },
        async session({ session, token }) {
            // 1. Initialize with token data (fast fallback)
            if (token) {
                session.user.id = token.id;
                session.user.role = token.role;
                session.user.status = token.status;
            }

            // 2. Try to refresh status from DB (security enforcement)
            if (token && token.id) {
                try {
                    await connectToDatabase();
                    // Select only necessary fields
                    const freshUser = await User.findById(token.id).select("status role").lean();
                    if (freshUser) {
                        session.user.status = freshUser.status;
                        session.user.role = freshUser.role;
                    }
                } catch (error) {
                    // Silently fail to token data if DB is unreachable to prevent session crash
                    // console.error("Session sync failed:", error);
                }
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
