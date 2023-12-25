import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from 'bcrypt';

import prismadb from '@/lib/prismadb';

export default NextAuth({
    providers: [
        Credentials({
            id: 'credentials',
            name: 'Credentials',
            credentials: {
                email: {
                    label: 'Email',
                    type: 'text',
                },
                password: {
                    label: 'Password',
                    type: 'text',
                }
            },
            async authorize(credentials) {
                // Check if the credentials for email or password is missing/empty
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Email and password required');
                }

                // Checking for unique users
                const user = await prismadb.user.findUnique({
                    where: {
                        email: credentials.email
                    }
                });
                // Check if the user does not exist or the user does not have a password
                if (!user || !user.hashedPassword) {
                    throw new Error('Email does not exist');
                }

                // Check if the user or password is correct
                const isCorrectPassword = await compare(
                    credentials.password, 
                    user.hashedPassword
                );
                // Check if the password is not correct
                if (!isCorrectPassword) {
                    throw new Error('Incorrect password');
                }
                return user;
            }
        })
    ],
    pages: {
        signIn: '/auth',
    },
    // Displays any errors in the terminal
    debug: process.env.NODE_ENV === 'development',
    session: {
        strategy: 'jwt',
    },
    jwt: {
        secret: process.env.NEXTAUTH_JWT_SECRET,
    },
    secret: process.env.NEXTAUTH_SECRET,
});