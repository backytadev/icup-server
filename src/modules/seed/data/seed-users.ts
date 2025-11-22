interface SeedUser {
  email: string;
  userName: string;
  firstNames: string;
  lastNames: string;
  gender: string;
  password: string;
  roles: string[];
  ministries: string[];
  churches: string[];
}

interface SeedDataUsers {
  users: SeedUser[];
}

export const dataUsers: SeedDataUsers = {
  users: [
    {
      userName: 'User1',
      firstNames: 'User',
      lastNames: 'Test 1',
      email: 'user.test1@icup.com',
      gender: 'female',
      password: 'Abcd1234$',
      roles: ['admin-user'],
      churches: [],
      ministries: [],
    },
    {
      userName: 'User2',
      firstNames: 'User',
      lastNames: 'Test 2',
      email: 'user.test2@icup.com',
      gender: 'male',
      password: 'Abcd1234%',
      roles: ['admin-user'],
      churches: [],
      ministries: [],
    },
    {
      userName: 'User3',
      firstNames: 'User',
      lastNames: 'Test 3',
      email: 'user.test3@icup.com',
      gender: 'female',
      password: 'Abcd1234&',
      roles: ['admin-user'],
      churches: [],
      ministries: [],
    },
  ],
};
