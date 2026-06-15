// In-memory user database
export interface User {
    id: string;
    email: string;
    password: string;
    name: string;
}

export const users: User[] = [
    {
        id: "1",
        email: "user1@example.com",
        password: "Password123",
        name: "User One"
    },
    {
        id: "2",
        email: "user2@example.com",
        password: "Password456",
        name: "User Two"
    },
    {
        id: "3",
        email: "user3@example.com",
        password: "Password789",
        name: "User Three"
    }
];

